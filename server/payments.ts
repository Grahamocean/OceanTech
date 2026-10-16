import { Router, type Request, type Response } from "express";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { pool } from "./db";

const router = Router();

const productSlugs: Record<string, string> = {
  p001: "macbook-air-m3",
  p002: "hp-elitebook-840-g8",
  p003: "dell-xps-13",
  p004: "macbook-pro-14",
  p005: "samsung-27-inch-monitor",
  p006: "lg-ultrawide-monitor",
  p007: "iphone-15",
  p008: "samsung-galaxy-s24",
  p009: "sony-wh1000xm5",
  p010: "wireless-headphones",
  p011: "mx-master-wireless-mouse",
  p012: "usb-c-multiport-hub",
};

const checkoutSchema = z.object({
  customer: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z
      .string()
      .trim()
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    phone: z.string().trim().min(7).max(30),
    address: z.string().trim().min(3).max(200),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    country: z.string().trim().min(2).max(100),
    postalCode: z.string().trim().max(20).optional().default(""),
    deliveryInstructions: z.string().trim().max(500).optional().default(""),
  }),
  items: z
    .array(
      z.object({
        productId: z.string().min(1).max(50),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1)
    .max(20),
  deliveryMethod: z.enum(["standard", "pickup"]),
});

const referenceSchema = z.object({
  reference: z.string().regex(/^OT-[a-f0-9]{32}$/i),
});

type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
};

type PaymentResult =
  | { ok: true; alreadyProcessed: boolean }
  | {
      ok: false;
      status: number;
      message: string;
    };

function getSessionUserId(req: Request): string | undefined {
  return (req.session as typeof req.session & { userId?: string }).userId;
}

function logPaymentError(context: string, error: unknown): void {
  console.error(
    context,
    error instanceof Error
      ? { name: error.name, message: error.message }
      : error,
  );
}

async function verifyWithPaystack(
  reference: string,
): Promise<PaystackTransaction | null> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    return null;
  }

  const response = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!response.ok) {
    throw new Error(`Paystack verification returned HTTP ${response.status}.`);
  }

  const result: unknown = await response.json();

  if (
    typeof result !== "object" ||
    result === null ||
    !("status" in result) ||
    result.status !== true ||
    !("data" in result) ||
    typeof result.data !== "object" ||
    result.data === null
  ) {
    throw new Error("Paystack returned an invalid verification response.");
  }

  const data = result.data;

  if (
    !("status" in data) ||
    typeof data.status !== "string" ||
    !("reference" in data) ||
    typeof data.reference !== "string" ||
    !("amount" in data) ||
    typeof data.amount !== "number" ||
    !("currency" in data) ||
    typeof data.currency !== "string"
  ) {
    throw new Error("Paystack verification data is incomplete.");
  }

  return {
    status: data.status,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
  };
}

async function processSuccessfulPayment(
  reference: string,
  eventType: string,
): Promise<PaymentResult> {
  const verified = await verifyWithPaystack(reference);

  if (!verified) {
    return {
      ok: false,
      status: 503,
      message: "Online payment is not configured.",
    };
  }

  if (
    verified.status !== "success" ||
    verified.reference !== reference ||
    verified.currency !== "NGN" ||
    !Number.isSafeInteger(verified.amount) ||
    verified.amount <= 0
  ) {
    return {
      ok: false,
      status: 400,
      message: "Paystack has not confirmed a valid successful payment.",
    };
  }

  const client = await pool.connect();
  let transactionOpen = false;

  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const orderResult = await client.query(
      `SELECT id, total_kobo, currency, status
       FROM orders
       WHERE payment_reference = $1
       FOR UPDATE`,
      [reference],
    );

    const order = orderResult.rows[0];

    if (!order) {
      await client.query("ROLLBACK");
      transactionOpen = false;

      return {
        ok: false,
        status: 404,
        message: "No order was found for this payment reference.",
      };
    }

    const expectedAmount = Number(order.total_kobo);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      verified.amount !== expectedAmount ||
      order.currency.trim() !== verified.currency
    ) {
      await client.query("ROLLBACK");
      transactionOpen = false;

      logPaymentError(
        "[Payments] Amount or currency mismatch",
        new Error(`Reference ${reference}`),
      );

      return {
        ok: false,
        status: 400,
        message: "The verified payment does not match the order total.",
      };
    }

    const eventId = `paystack:${eventType}:${reference}`;

    const eventResult = await client.query(
      `INSERT INTO payment_events (
         provider,
         event_id,
         payment_reference,
         event_type
       )
       VALUES ('paystack', $1, $2, $3)
       ON CONFLICT (event_id) DO NOTHING
       RETURNING id`,
      [eventId, reference, eventType],
    );

    if (eventResult.rowCount === 0) {
      await client.query("COMMIT");
      transactionOpen = false;

      return { ok: true, alreadyProcessed: true };
    }

    const fulfilledStatuses = ["paid", "processing", "shipped", "delivered"];

    if (fulfilledStatuses.includes(order.status)) {
      await client.query(
        `UPDATE payment_events
         SET processed_at = NOW()
         WHERE event_id = $1`,
        [eventId],
      );

      await client.query("COMMIT");
      transactionOpen = false;

      return { ok: true, alreadyProcessed: true };
    }

    const itemsResult = await client.query(
      `SELECT product_id, quantity
       FROM order_items
       WHERE order_id = $1
       ORDER BY product_id
       FOR UPDATE`,
      [order.id],
    );

    if (itemsResult.rows.length === 0) {
      throw new Error("The order contains no items.");
    }

    for (const item of itemsResult.rows) {
      const quantity = Number(item.quantity);

      if (!Number.isSafeInteger(quantity) || quantity < 1) {
        throw new Error("An order item has an invalid quantity.");
      }

      const stockResult = await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity - $1,
             updated_at = NOW()
         WHERE id = $2
           AND stock_quantity >= $1
         RETURNING id`,
        [quantity, item.product_id],
      );

      if (stockResult.rowCount !== 1) {
        throw new Error(
          "Insufficient inventory to fulfill a confirmed payment.",
        );
      }
    }

    await client.query(
      `UPDATE orders
       SET status = 'paid',
           paid_at = COALESCE(paid_at, NOW()),
           updated_at = NOW()
       WHERE id = $1`,
      [order.id],
    );

    await client.query(
      `UPDATE payment_events
       SET processed_at = NOW()
       WHERE event_id = $1`,
      [eventId],
    );

    await client.query("COMMIT");
    transactionOpen = false;

    return { ok: true, alreadyProcessed: false };
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        logPaymentError("[Payments] Rollback failed", rollbackError);
      });
    }

    throw error;
  } finally {
    client.release();
  }
}

router.post("/initialize", async (req: Request, res: Response) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Please sign in to continue." });
    return;
  }

  const parsed = checkoutSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Check your contact, delivery, and cart details and try again.",
    });
    return;
  }

  const { customer, items, deliveryMethod } = parsed.data;
  const secretKey = process.env.PAYSTACK_SECRET_KEY;

  if (!secretKey) {
    res.status(503).json({
      error: "Online payment is not configured yet. Please try again later.",
    });
    return;
  }

  const quantities = new Map<string, number>();

  for (const item of items) {
    if (!Object.hasOwn(productSlugs, item.productId)) {
      res.status(400).json({
        error:
          "Your cart contains an unknown product. Please refresh your cart.",
      });
      return;
    }

    const quantity = (quantities.get(item.productId) ?? 0) + item.quantity;

    if (quantity > 20) {
      res.status(400).json({
        error: "A maximum of 20 units per product is allowed.",
      });
      return;
    }

    quantities.set(item.productId, quantity);
  }

  const client = await pool.connect();
  let transactionOpen = false;
  let reference: string | undefined;

  try {
    await client.query("BEGIN");
    transactionOpen = true;

    const userResult = await client.query(
      `SELECT id, email, is_active, email_verified_at
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId],
    );

    const user = userResult.rows[0];

    if (!user || !user.is_active) {
      res.status(401).json({ error: "Your account is not available." });
      await client.query("ROLLBACK");
      transactionOpen = false;
      return;
    }

    if (!user.email_verified_at) {
      res.status(403).json({
        error: "Verify your email address before placing an order.",
      });
      await client.query("ROLLBACK");
      transactionOpen = false;
      return;
    }

    if (customer.email !== String(user.email).toLowerCase()) {
      res.status(400).json({
        error: "Use the verified email address associated with your account.",
      });
      await client.query("ROLLBACK");
      transactionOpen = false;
      return;
    }

    const slugs = [...quantities.keys()].map(
      (productId) => productSlugs[productId],
    );

    const productsResult = await client.query(
      `SELECT id, slug, name, price_kobo, stock_quantity, is_active
       FROM products
       WHERE slug = ANY($1::text[])
       ORDER BY slug
       FOR UPDATE`,
      [slugs],
    );

    const products = new Map(
      productsResult.rows.map((product) => [product.slug, product]),
    );

    if (products.size !== slugs.length) {
      res.status(400).json({
        error: "One or more products are no longer available.",
      });
      await client.query("ROLLBACK");
      transactionOpen = false;
      return;
    }

    const orderItems: Array<{
      productId: string;
      productName: string;
      unitPriceKobo: number;
      quantity: number;
      lineTotalKobo: number;
    }> = [];

    let subtotalKobo = 0;

    for (const [productId, quantity] of quantities) {
      const product = products.get(productSlugs[productId]);

      if (!product || !product.is_active) {
        res.status(409).json({
          error: "One or more products are no longer available.",
        });
        await client.query("ROLLBACK");
        transactionOpen = false;
        return;
      }

      const stock = Number(product.stock_quantity);
      const unitPriceKobo = Number(product.price_kobo);

      if (!Number.isSafeInteger(stock) || stock < quantity) {
        res.status(409).json({
          error: `${product.name} does not have enough stock available.`,
        });
        await client.query("ROLLBACK");
        transactionOpen = false;
        return;
      }

      if (!Number.isSafeInteger(unitPriceKobo) || unitPriceKobo <= 0) {
        throw new Error("A product has an invalid database price.");
      }

      const lineTotalKobo = unitPriceKobo * quantity;
      subtotalKobo += lineTotalKobo;

      if (
        !Number.isSafeInteger(lineTotalKobo) ||
        !Number.isSafeInteger(subtotalKobo)
      ) {
        throw new Error("The order total exceeds the supported amount.");
      }

      orderItems.push({
        productId: product.id,
        productName: product.name,
        unitPriceKobo,
        quantity,
        lineTotalKobo,
      });
    }

    if (subtotalKobo < 1) {
      throw new Error("The order total is invalid.");
    }

    reference = `OT-${randomBytes(16).toString("hex")}`;
    const orderNumber = `OT-${randomBytes(6).toString("hex").toUpperCase()}`;

    const shippingAddress = {
      address: customer.address,
      city: customer.city,
      state: customer.state,
      country: customer.country,
      countryCode: "NG",
      postalCode: customer.postalCode,
      deliveryInstructions: customer.deliveryInstructions,
      deliveryMethod,
    };

    const orderResult = await client.query(
      `INSERT INTO orders (
         order_number, user_id, customer_name, customer_email,
         customer_phone, shipping_address, subtotal_kobo,
         shipping_fee_kobo, total_kobo, currency, status,
         payment_provider, payment_reference
       )
       VALUES (
         $1, $2, $3, $4, $5, $6::jsonb, $7, 0, $7,
         'NGN', 'pending', 'paystack', $8
       )
       RETURNING id`,
      [
        orderNumber,
        user.id,
        customer.fullName,
        user.email,
        customer.phone,
        JSON.stringify(shippingAddress),
        subtotalKobo,
        reference,
      ],
    );

    const orderId = orderResult.rows[0].id;

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
           order_id, product_id, product_name,
           unit_price_kobo, quantity, line_total_kobo
         )
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          orderId,
          item.productId,
          item.productName,
          item.unitPriceKobo,
          item.quantity,
          item.lineTotalKobo,
        ],
      );
    }

    await client.query("COMMIT");
    transactionOpen = false;

    // The order is safely persisted before the external Paystack request.
    const paystackResponse = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount: String(subtotalKobo),
          currency: "NGN",
          reference,
          metadata: {
            orderId,
            orderNumber,
            userId: user.id,
            deliveryMethod,
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    const result: unknown = await paystackResponse.json();

    if (
      !paystackResponse.ok ||
      typeof result !== "object" ||
      result === null ||
      !("status" in result) ||
      result.status !== true ||
      !("data" in result) ||
      typeof result.data !== "object" ||
      result.data === null ||
      !("authorization_url" in result.data) ||
      typeof result.data.authorization_url !== "string" ||
      !("reference" in result.data) ||
      result.data.reference !== reference
    ) {
      // Keep the order pending for reconciliation if Paystack's response
      // is ambiguous. Do not delete it or assume no payment can exist.
      throw new Error("Paystack did not return a valid checkout session.");
    }

    const authorizationUrl = new URL(result.data.authorization_url);

    if (
      authorizationUrl.protocol !== "https:" ||
      authorizationUrl.origin !== "https://checkout.paystack.com"
    ) {
      throw new Error("Paystack returned an unexpected checkout URL.");
    }

    res.status(200).json({
      authorizationUrl: authorizationUrl.toString(),
      reference,
    });
  } catch (error) {
    if (transactionOpen) {
      await client.query("ROLLBACK").catch((rollbackError) => {
        logPaymentError("[Payments] Rollback failed", rollbackError);
      });
    }

    logPaymentError("[Payments] Initialization failed", error);

    res.status(502).json({
      error:
        "We couldn't start checkout. If the problem continues, contact support before attempting another payment.",
      ...(reference ? { reference } : {}),
    });
  } finally {
    client.release();
  }
});

router.post("/verify", async (req: Request, res: Response) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({ error: "Please sign in to verify your order." });
    return;
  }

  const parsed = referenceSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payment reference." });
    return;
  }

  try {
    const ownedOrder = await pool.query(
      `SELECT id
       FROM orders
       WHERE payment_reference = $1 AND user_id = $2`,
      [parsed.data.reference, userId],
    );

    if (ownedOrder.rowCount === 0) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    const result = await processSuccessfulPayment(
      parsed.data.reference,
      "charge.success",
    );

    if (!result.ok) {
      res.status(result.status).json({ error: result.message });
      return;
    }

    res.status(200).json({
      status: "paid",
      alreadyProcessed: result.alreadyProcessed,
    });
  } catch (error) {
    logPaymentError("[Payments] Verification failed", error);
    res.status(502).json({
      error: "Payment verification could not be completed. Please try again.",
    });
  }
});

router.post("/webhook", async (req: Request, res: Response) => {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.header("x-paystack-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!secretKey || !signature || !rawBody) {
    res.status(400).json({ error: "Invalid webhook request." });
    return;
  }

  const expectedSignature = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest();

  let suppliedSignature: Buffer;

  try {
    suppliedSignature = Buffer.from(signature, "hex");
  } catch {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }

  if (
    suppliedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(suppliedSignature, expectedSignature)
  ) {
    res.status(401).json({ error: "Invalid webhook signature." });
    return;
  }

  const body: unknown = req.body;

  if (
    typeof body !== "object" ||
    body === null ||
    !("event" in body) ||
    typeof body.event !== "string"
  ) {
    res.status(400).json({ error: "Invalid webhook payload." });
    return;
  }

  // Other Paystack event types are acknowledged but do not change orders.
  if (body.event !== "charge.success") {
    res.status(200).json({ received: true });
    return;
  }

  if (
    !("data" in body) ||
    typeof body.data !== "object" ||
    body.data === null ||
    !("reference" in body.data) ||
    typeof body.data.reference !== "string" ||
    !/^OT-[a-f0-9]{32}$/i.test(body.data.reference)
  ) {
    res.status(400).json({ error: "Invalid payment event data." });
    return;
  }

  try {
    const result = await processSuccessfulPayment(
      body.data.reference,
      body.event,
    );

    if (!result.ok) {
      // Retryable failures should receive a non-2xx response from Paystack.
      res.status(result.status).json({ error: result.message });
      return;
    }

    res.status(200).json({ received: true });
  } catch (error) {
    logPaymentError("[Payments] Webhook processing failed", error);
    res.status(500).json({ error: "Webhook processing failed." });
  }
});

export default router;
