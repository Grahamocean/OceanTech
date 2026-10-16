import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatPrice } from "../data/products";

const CART_STORAGE_KEY = "oceantech-cart";
const PENDING_CART_KEY = "oceantech-pending-payment-cart";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

type PaymentState = "checking" | "success" | "unconfirmed" | "error";

interface VerificationResponse {
  status?: string;
  reference?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

interface CartItem {
  productId: string;
  quantity: number;
}

function parseCart(value: string | null): CartItem[] | null {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);

    if (!Array.isArray(parsed)) return null;

    if (
      !parsed.every(
        (item) =>
          item &&
          typeof item.productId === "string" &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity >= 1,
      )
    ) {
      return null;
    }

    return parsed as CartItem[];
  } catch {
    return null;
  }
}

function sameCart(a: CartItem[], b: CartItem[]): boolean {
  if (a.length !== b.length) return false;

  return a.every(
    (item, index) =>
      item.productId === b[index].productId &&
      item.quantity === b[index].quantity,
  );
}

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();

  const reference = searchParams.get("reference")?.trim() ?? "";
  const transactionReference = searchParams.get("trxref")?.trim() ?? "";

  const [paymentState, setPaymentState] = useState<PaymentState>("checking");
  const [message, setMessage] = useState(
    "We're checking your transaction with the payment provider.",
  );
  const [verifiedReference, setVerifiedReference] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [currency, setCurrency] = useState("NGN");

  const verifyPayment = useCallback(async () => {
    if (!reference || !/^OT-[a-zA-Z0-9-]+$/.test(reference)) {
      setPaymentState("error");
      setMessage("The payment reference is missing or invalid.");
      return;
    }

    if (transactionReference && transactionReference !== reference) {
      setPaymentState("error");
      setMessage("The payment references do not match.");
      return;
    }

    setPaymentState("checking");
    setMessage("We're checking your transaction with the payment provider.");

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/payments/verify/${encodeURIComponent(reference)}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
        },
      );

      const result = (await response
        .json()
        .catch(() => ({}))) as VerificationResponse;

      if (response.status === 400) {
        setPaymentState("unconfirmed");
        setMessage(
          "Payment has not been confirmed yet. If you completed payment, try checking again in a moment. Do not pay a second time until you have checked your transaction.",
        );
        return;
      }

      if (!response.ok || result.status !== "success") {
        setPaymentState("error");
        setMessage(
          result.error ||
            "We couldn't verify this transaction right now. Your payment status is not confirmed.",
        );
        return;
      }

      if (result.reference !== reference) {
        setPaymentState("error");
        setMessage("The verified reference did not match this order.");
        return;
      }

      setVerifiedReference(result.reference);
      setAmount(typeof result.amount === "number" ? result.amount : null);
      setCurrency(result.currency || "NGN");
      setPaymentState("success");
      setMessage("Your payment has been verified by OceanTech's server.");

      // Clear the cart only if it is still the same cart used for checkout.
      // If the customer changed the cart in another tab, preserve those items.
      try {
        const pendingValue = sessionStorage.getItem(PENDING_CART_KEY);
        const currentCartValue = localStorage.getItem(CART_STORAGE_KEY);

        const pendingCart = parseCart(pendingValue);
        const currentCart = parseCart(currentCartValue);

        if (
          pendingCart !== null &&
          currentCart !== null &&
          pendingValue !== null &&
          sameCart(pendingCart, currentCart)
        ) {
          localStorage.setItem(CART_STORAGE_KEY, "[]");
        }

        sessionStorage.removeItem(PENDING_CART_KEY);
      } catch {
        // Payment is verified even if browser storage is unavailable.
        // Do not turn a confirmed payment into a false payment failure.
      }
    } catch {
      setPaymentState("error");
      setMessage(
        "We couldn't reach the order server. Your payment status is not confirmed. Please try verification again.",
      );
    }
  }, [reference, transactionReference]);

  useEffect(() => {
    void verifyPayment();
  }, [verifyPayment]);

  return (
    <main className="theme-page min-h-[70vh] px-5 py-16 sm:px-8 sm:py-24">
      <section className="mx-auto max-w-xl border border-[var(--color-border)] p-6 sm:p-10">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
          OceanTech / Order status
        </p>

        <h1 className="mt-4 font-['Space_Grotesk'] text-3xl sm:text-4xl">
          {paymentState === "checking" && "Verifying payment"}
          {paymentState === "success" && "Payment confirmed"}
          {paymentState === "unconfirmed" && "Payment not confirmed yet"}
          {paymentState === "error" && "Unable to confirm payment"}
        </h1>

        <p
          role="status"
          aria-live="polite"
          className="mt-4 text-sm leading-6 text-[var(--color-muted)]"
        >
          {message}
        </p>

        {paymentState === "checking" && (
          <div className="mt-6 h-1 overflow-hidden bg-[var(--color-border)]">
            <div className="h-full w-1/2 animate-pulse bg-[var(--color-text)]" />
          </div>
        )}

        {paymentState === "success" && (
          <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-6">
            <div className="flex items-start justify-between gap-4 text-sm">
              <span className="text-[var(--color-muted)]">Order reference</span>
              <span className="break-all text-right font-medium">
                {verifiedReference}
              </span>
            </div>

            {amount !== null && (
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--color-muted)]">
                  Verified amount
                </span>
                <span className="font-semibold">
                  {currency === "NGN"
                    ? formatPrice(amount)
                    : `${currency} ${amount.toLocaleString()}`}
                </span>
              </div>
            )}

            <p className="text-xs leading-5 text-[var(--color-muted)]">
              Keep your order reference for future enquiries. Delivery
              arrangements remain subject to confirmation.
            </p>
          </div>
        )}

        {(paymentState === "unconfirmed" || paymentState === "error") && (
          <button
            type="button"
            onClick={() => void verifyPayment()}
            className="mt-7 min-h-12 w-full border border-[var(--color-border)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.12em] transition-opacity hover:opacity-70"
          >
            Check payment again
          </button>
        )}

        <div className="mt-8 flex flex-wrap gap-4">
          {paymentState === "success" ? (
            <Link
              to="/shop"
              className="inline-flex min-h-12 items-center justify-center bg-[var(--color-primary-bg)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] !text-[var(--color-primary-text)]"
            >
              Continue shopping
            </Link>
          ) : (
            <Link to="/cart" className="text-xs underline underline-offset-4">
              Return to cart
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
