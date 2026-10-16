import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatPrice, products } from "../data/products";

interface CartItem {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEY = "oceantech-cart";

function readCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" &&
        typeof item?.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setCart(readCart());
    setReady(true);
  }, []);

  const cartProducts = useMemo(() => {
    return cart
      .map((item) => {
        const product = products.find(
          (product) => product.id === item.productId,
        );

        return product ? { ...item, product } : null;
      })
      .filter((item) => item !== null);
  }, [cart]);

  const subtotal = cartProducts.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const totalItems = cartProducts.reduce(
    (total, item) => total + item.quantity,
    0,
  );

  function saveCart(nextCart: CartItem[]) {
    setCart(nextCart);

    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
    } catch {
      // Keep the current page usable if browser storage is unavailable.
    }
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) return;

    saveCart(
      cart.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }

  function removeItem(productId: string) {
    saveCart(cart.filter((item) => item.productId !== productId));
  }

  function clearCart() {
    saveCart([]);
  }

  if (!ready) {
    return (
      <main className="theme-page min-h-screen px-5 py-24">
        <p className="text-center text-sm text-[var(--color-muted)]">
          Loading your cart...
        </p>
      </main>
    );
  }

  return (
    <main className="theme-page min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
        {/* Page heading */}
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[var(--color-border)] pb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Your selection
            </p>

            <h1 className="mt-3 font-['Space_Grotesk'] text-4xl tracking-tight sm:text-5xl">
              Shopping cart
            </h1>

            <p className="mt-3 text-sm text-[var(--color-muted)]">
              {totalItems} {totalItems === 1 ? "item" : "items"} in your cart
            </p>
          </div>

          <Link
            to="/shop"
            className="text-xs uppercase tracking-[0.12em] underline underline-offset-4 transition-opacity hover:opacity-60"
          >
            Continue shopping
          </Link>
        </div>

        {/* Empty cart */}
        {cartProducts.length === 0 ? (
          <section className="flex min-h-[360px] flex-col items-center justify-center py-16 text-center">
            <div className="grid h-16 w-16 place-items-center border border-[var(--color-border)] text-2xl">
              ♧
            </div>

            <h2 className="mt-6 font-['Space_Grotesk'] text-2xl">
              Your cart is empty
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
              Discover laptops, monitors, phones, and accessories selected for
              your workspace and everyday needs.
            </p>

            <Link
              to="/shop"
              className="mt-7 inline-flex min-h-12 items-center justify-center bg-[var(--color-primary-bg)] px-7 py-3 text-xs font-semibold uppercase tracking-[0.15em] !text-[var(--color-primary-text)] transition-opacity hover:opacity-80"
            >
              Explore products
            </Link>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-12 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            {/* Cart items */}
            <section>
              <div className="mb-5 hidden grid-cols-[minmax(0,1fr)_120px_100px] gap-5 border-b border-[var(--color-border)] pb-3 text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] sm:grid">
                <span>Product</span>
                <span className="text-center">Quantity</span>
                <span className="text-right">Subtotal</span>
              </div>

              <div className="divide-y divide-[var(--color-border)]">
                {cartProducts.map(({ product, quantity }) => (
                  <article
                    key={product.id}
                    className="grid grid-cols-[100px_minmax(0,1fr)] gap-4 py-6 sm:grid-cols-[120px_minmax(0,1fr)_120px_100px] sm:items-center sm:gap-5"
                  >
                    {/* Product image */}
                    <Link
                      to={`/product/${product.slug}`}
                      className="relative block aspect-[4/4.5] overflow-hidden bg-[var(--color-surface)]"
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    </Link>

                    {/* Product information */}
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        {product.brand}
                      </p>

                      <Link
                        to={`/product/${product.slug}`}
                        className="mt-2 block font-['Space_Grotesk'] text-base leading-snug transition-opacity hover:opacity-60"
                      >
                        {product.name}
                      </Link>

                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {product.condition}
                      </p>

                      <p className="mt-3 text-sm font-semibold sm:hidden">
                        {formatPrice(product.price)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(product.id)}
                        className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)] underline underline-offset-4 transition-colors hover:text-[var(--color-text)]"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Quantity selector */}
                    <div className="col-start-2 flex h-10 w-fit items-center border border-[var(--color-border)] sm:col-start-auto sm:justify-self-center">
                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label={`Decrease ${product.name} quantity`}
                        className="h-full w-9 text-lg transition-colors hover:bg-[var(--color-surface)] disabled:opacity-30"
                      >
                        −
                      </button>

                      <span
                        aria-live="polite"
                        className="min-w-8 text-center text-xs tabular-nums"
                      >
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        aria-label={`Increase ${product.name} quantity`}
                        className="h-full w-9 text-lg transition-colors hover:bg-[var(--color-surface)]"
                      >
                        +
                      </button>
                    </div>

                    {/* Line subtotal */}
                    <p className="hidden text-right text-sm font-semibold sm:block">
                      {formatPrice(product.price * quantity)}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)] underline underline-offset-4 transition-opacity hover:opacity-60"
                >
                  Clear cart
                </button>
              </div>
            </section>

            {/* Order summary */}
            <aside className="h-fit border border-[var(--color-border)] p-5 sm:p-7 lg:sticky lg:top-28">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Order summary
              </p>

              <h2 className="mt-3 font-['Space_Grotesk'] text-2xl">
                Your total
              </h2>

              <div className="mt-7 space-y-4 border-b border-[var(--color-border)] pb-5">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-[var(--color-muted)]">
                    Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"}
                    )
                  </span>

                  <span className="font-medium tabular-nums">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-[var(--color-muted)]">Shipping</span>

                  <span className="text-right text-xs text-[var(--color-muted)]">
                    Calculated at checkout
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 py-5">
                <span className="text-sm font-semibold">
                  Estimated subtotal
                </span>

                <span className="text-lg font-semibold tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>

              <p className="mb-5 text-xs leading-5 text-[var(--color-muted)]">
                Shipping charges and final order details will be confirmed
                before payment.
              </p>

              <Link
                to="/checkout"
                className="flex min-h-14 w-full items-center justify-center gap-3 bg-[var(--color-primary-bg)] px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.15em] !text-[var(--color-primary-text)] transition-opacity hover:opacity-80"
              >
                Proceed to checkout
                <span aria-hidden="true">↗</span>
              </Link>

              <p className="mt-4 text-center text-[10px] leading-5 text-[var(--color-muted)]">
                Your cart is saved in this browser.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
