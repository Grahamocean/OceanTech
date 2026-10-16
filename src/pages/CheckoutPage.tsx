import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatPrice, products } from "../data/products";

interface CartItem {
  productId: string;
  quantity: number;
}

interface CustomerDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  deliveryInstructions: string;
}

interface InitializePaymentResponse {
  authorizationUrl?: string;
  reference?: string;
  error?: string;
}

interface AuthResponse {
  user?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    emailVerified: boolean;
  };
  error?: string;
}

const CART_STORAGE_KEY = "oceantech-cart";
const PENDING_CART_KEY = "oceantech-pending-payment-cart";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4242"
).replace(/\/+$/, "");

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.productId === "string" &&
    item.productId.length > 0 &&
    typeof item.quantity === "number" &&
    Number.isSafeInteger(item.quantity) &&
    item.quantity >= 1 &&
    item.quantity <= 20
  );
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");

  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "pickup">(
    "standard",
  );
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirm the customer has a valid server-side session before showing checkout.
  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          credentials: "include",
        });

        if (cancelled) return;

        if (response.status === 401) {
          navigate("/login", {
            replace: true,
            state: {
              from: {
                pathname: location.pathname,
              },
            },
          });
          return;
        }

        if (!response.ok) {
          throw new Error("We couldn't verify your sign-in session.");
        }

        const result = (await response.json()) as AuthResponse;

        if (!result.user) {
          throw new Error("We couldn't verify your sign-in session.");
        }

        if (!result.user.emailVerified) {
          navigate("/login", {
            replace: true,
            state: {
              from: {
                pathname: location.pathname,
              },
            },
          });
          return;
        }

        setAuthChecked(true);
      } catch {
        if (!cancelled) {
          setAuthError(
            "We couldn't verify your sign-in session. Check your connection and try again.",
          );
        }
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, navigate]);

  function retrySessionCheck() {
    setAuthError("");
    setAuthChecked(false);
    window.location.reload();
  }

  // Load the cart independently of the authentication check.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      const parsed: unknown = stored ? JSON.parse(stored) : [];

      if (Array.isArray(parsed)) {
        setCart(parsed.filter(isCartItem));
      }
    } catch {
      setCart([]);
    } finally {
      setCartLoaded(true);
    }
  }, []);

  const cartProducts = useMemo(
    () =>
      cart
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);

          return product ? { ...item, product } : null;
        })
        .filter((item) => item !== null),
    [cart],
  );

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setNotice("");

    if (!authChecked || authError) {
      setNotice("Please verify your sign-in session before continuing.");
      return;
    }

    if (cart.length === 0 || cartProducts.length !== cart.length) {
      setNotice(
        "Your cart contains unavailable or invalid items. Return to your cart, refresh it, and try again.",
      );
      return;
    }

    const formData = new FormData(event.currentTarget);

    const customer: CustomerDetails = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      state: String(formData.get("state") ?? "").trim(),
      country: String(formData.get("country") ?? "").trim(),
      postalCode: String(formData.get("postalCode") ?? "").trim(),
      deliveryInstructions: String(
        formData.get("deliveryInstructions") ?? "",
      ).trim(),
    };

    setIsSubmitting(true);

    try {
      // Include the session cookie so the API can identify the customer.
      const response = await fetch(`${API_BASE_URL}/api/payments/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          customer,
          items: cart.map(({ productId, quantity }) => ({
            productId,
            quantity,
          })),
          deliveryMethod,
        }),
      });

      if (response.status === 401) {
        navigate("/login", {
          replace: true,
          state: {
            from: {
              pathname: location.pathname,
            },
          },
        });
        return;
      }

      const result = (await response
        .json()
        .catch(() => ({}))) as InitializePaymentResponse;

      if (!response.ok) {
        throw new Error(
          result.error || "We couldn't start your checkout. Please try again.",
        );
      }

      if (!result.authorizationUrl || !result.reference) {
        throw new Error("The payment service returned an invalid response.");
      }

      // Only allow the expected Paystack-hosted checkout origin.
      let paymentUrl: URL;

      try {
        paymentUrl = new URL(result.authorizationUrl);
      } catch {
        throw new Error("The payment service returned an invalid URL.");
      }

      if (
        paymentUrl.protocol !== "https:" ||
        paymentUrl.origin !== "https://checkout.paystack.com"
      ) {
        throw new Error(
          "We couldn't validate the payment destination. Please contact support.",
        );
      }

      // Preserve the cart snapshot for the payment callback.
      try {
        sessionStorage.setItem(PENDING_CART_KEY, JSON.stringify(cart));
      } catch {
        // Payment can continue if session storage is unavailable.
      }

      window.location.assign(paymentUrl.toString());
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setIsSubmitting(false);
    }
  }

  // Keep checkout hidden until the server confirms the session.
  if (!authChecked) {
    return (
      <main className="theme-page min-h-screen px-5 py-24">
        <div className="mx-auto max-w-xl text-center">
          {authError ? (
            <>
              <h1 className="font-['Space_Grotesk'] text-2xl">
                Unable to verify your session
              </h1>
              <p
                role="alert"
                className="mt-4 text-sm leading-6 text-[var(--color-muted)]"
              >
                {authError}
              </p>
              <button
                type="button"
                onClick={retrySessionCheck}
                className="mt-8 min-h-12 bg-[var(--color-primary-bg)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] !text-[var(--color-primary-text)]"
              >
                Try again
              </button>
              <div>
                <Link
                  to="/login"
                  className="mt-5 inline-flex text-xs underline underline-offset-4"
                >
                  Return to sign in
                </Link>
              </div>
            </>
          ) : (
            <p className="text-sm text-[var(--color-muted)]">
              Verifying your account...
            </p>
          )}
        </div>
      </main>
    );
  }

  if (!cartLoaded) {
    return (
      <main className="theme-page min-h-screen px-5 py-24">
        <p className="text-center text-sm text-[var(--color-muted)]">
          Loading checkout...
        </p>
      </main>
    );
  }

  if (cartProducts.length === 0) {
    return (
      <main className="theme-page min-h-screen px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-xl py-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Checkout
          </p>

          <h1 className="mt-4 font-['Space_Grotesk'] text-3xl sm:text-4xl">
            Your cart is empty
          </h1>

          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
            Add a product to your cart before proceeding to checkout.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex min-h-12 items-center justify-center bg-[var(--color-primary-bg)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.12em] !text-[var(--color-primary-text)]"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="theme-page min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="border-b border-[var(--color-border)] pb-8">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
            OceanTech / Checkout
          </p>

          <h1 className="mt-3 font-['Space_Grotesk'] text-4xl tracking-tight sm:text-5xl">
            Checkout
          </h1>

          <p className="mt-3 text-sm text-[var(--color-muted)]">
            Enter your contact and delivery details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-12 py-9 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16"
        >
          <div className="space-y-10">
            <section>
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Step 01
                </p>
                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl">
                  Contact information
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium">
                    Full name *
                  </span>
                  <input
                    name="fullName"
                    type="text"
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Enter your full name"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">
                    Email address *
                  </span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="you@example.com"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">
                    Phone number *
                  </span>
                  <input
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={30}
                    placeholder="Enter your phone number"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Step 02
                </p>
                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl">
                  Delivery address
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium">
                    Street address *
                  </span>
                  <input
                    name="address"
                    type="text"
                    autoComplete="street-address"
                    required
                    maxLength={200}
                    placeholder="House number and street"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">City *</span>
                  <input
                    name="city"
                    type="text"
                    autoComplete="address-level2"
                    required
                    maxLength={100}
                    placeholder="Your city"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">
                    State *
                  </span>
                  <input
                    name="state"
                    type="text"
                    autoComplete="address-level1"
                    required
                    maxLength={100}
                    placeholder="Your state"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">
                    Country *
                  </span>
                  <input
                    name="country"
                    type="text"
                    autoComplete="country-name"
                    required
                    defaultValue="Nigeria"
                    maxLength={100}
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium">
                    Postal code
                  </span>
                  <input
                    name="postalCode"
                    type="text"
                    autoComplete="postal-code"
                    maxLength={20}
                    placeholder="Optional"
                    className="theme-field w-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-xs font-medium">
                    Delivery instructions
                  </span>
                  <textarea
                    name="deliveryInstructions"
                    rows={3}
                    maxLength={500}
                    placeholder="Landmark or other helpful delivery details (optional)"
                    className="theme-field w-full resize-y border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--color-text)]"
                  />
                </label>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
                  Step 03
                </p>
                <h2 className="mt-2 font-['Space_Grotesk'] text-2xl">
                  Delivery method
                </h2>
              </div>

              <div className="space-y-3">
                <label className="flex cursor-pointer items-start gap-4 border border-[var(--color-border)] p-4 transition-colors has-[:checked]:border-[var(--color-text)]">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="standard"
                    checked={deliveryMethod === "standard"}
                    disabled={isSubmitting}
                    onChange={() => {
                      setDeliveryMethod("standard");
                      setNotice("");
                    }}
                    className="mt-1 accent-current"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
                      Standard delivery
                      <span className="text-xs text-[var(--color-muted)]">
                        Fee not included
                      </span>
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
                      Delivery charges and arrival estimates must be agreed
                      separately before your order is dispatched.
                    </span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-4 border border-[var(--color-border)] p-4 transition-colors has-[:checked]:border-[var(--color-text)]">
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={deliveryMethod === "pickup"}
                    disabled={isSubmitting}
                    onChange={() => {
                      setDeliveryMethod("pickup");
                      setNotice("");
                    }}
                    className="mt-1 accent-current"
                  />
                  <span className="flex-1">
                    <span className="flex flex-wrap items-center justify-between gap-3 text-sm font-medium">
                      Store pickup
                      <span className="text-xs text-[var(--color-muted)]">
                        Must be confirmed
                      </span>
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-[var(--color-muted)]">
                      Pickup location and collection arrangements must be
                      confirmed with OceanTech.
                    </span>
                  </span>
                </label>
              </div>
            </section>

            <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-semibold">Payment information</p>
              <p className="mt-2 text-xs leading-5 text-[var(--color-muted)]">
                Payment will be completed on Paystack's hosted checkout page.
                OceanTech will confirm the transaction with the payment provider
                before marking the order as paid. Delivery charges are not
                included in the amount shown here.
              </p>
            </div>

            {notice && (
              <p
                role="alert"
                className="border border-[var(--color-border)] p-4 text-sm leading-6"
              >
                {notice}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-5">
              <button
                type="submit"
                disabled={isSubmitting || !authChecked}
                className="flex min-h-14 flex-1 items-center justify-center bg-[var(--color-primary-bg)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] !text-[var(--color-primary-text)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
              >
                {isSubmitting ? "Preparing payment..." : "Continue to payment"}
                {!isSubmitting && (
                  <span aria-hidden="true" className="ml-3">
                    ↗
                  </span>
                )}
              </button>

              <Link
                to="/cart"
                className="text-xs text-[var(--color-muted)] underline underline-offset-4 transition-opacity hover:opacity-60"
              >
                Return to cart
              </Link>
            </div>
          </div>

          <aside className="h-fit border border-[var(--color-border)] p-5 sm:p-7 lg:sticky lg:top-28">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Your order
            </p>

            <h2 className="mt-3 font-['Space_Grotesk'] text-2xl">
              Order summary
            </h2>

            <div className="mt-6 divide-y divide-[var(--color-border)]">
              {cartProducts.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 py-4">
                  <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-[var(--color-surface)]">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center bg-[var(--color-primary-bg)] px-1 text-[9px] !text-[var(--color-primary-text)]">
                      {quantity}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[var(--color-muted)]">
                      {product.brand}
                    </p>
                    <p className="mt-1 text-sm leading-5">{product.name}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-4 border-t border-[var(--color-border)] pt-5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="text-[var(--color-muted)]">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4 text-sm">
                <span className="text-[var(--color-muted)]">Delivery</span>
                <span className="max-w-36 text-right text-xs text-[var(--color-muted)]">
                  {deliveryMethod === "pickup"
                    ? "Pickup arrangements pending"
                    : "Fee to be agreed separately"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-5">
                <span className="text-sm font-semibold">Product subtotal</span>
                <span className="text-lg font-semibold tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
            </div>

            <p className="mt-5 text-xs leading-5 text-[var(--color-muted)]">
              The payment amount covers products only. Delivery charges are
              excluded and must be agreed separately before fulfilment.
            </p>

            <Link
              to="/cart"
              className="mt-6 inline-flex text-xs underline underline-offset-4 transition-opacity hover:opacity-60"
            >
              Edit cart
            </Link>
          </aside>
        </form>
      </div>
    </main>
  );
}
