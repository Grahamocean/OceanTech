import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { products, formatPrice } from "../data/products";
import type { Product } from "../data/products";

interface CartItem {
  productId: string;
  quantity: number;
}

const CART_STORAGE_KEY = "oceantech-cart";

function addToCart(product: Product, quantity: number): void {
  let cart: CartItem[] = [];

  try {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    cart = storedCart ? JSON.parse(storedCart) : [];

    if (!Array.isArray(cart)) {
      cart = [];
    }
  } catch {
    cart = [];
  }

  const existingItem = cart.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.push({
      productId: product.id,
      quantity,
    });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = products.find((item) => item.slug === slug);

  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartError, setCartError] = useState("");

  if (!product) {
    return (
      <main className="theme-page min-h-screen px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-muted)]">
            Product unavailable
          </p>

          <h1 className="mt-4 font-['Space_Grotesk'] text-3xl sm:text-5xl">
            We couldn't find that product.
          </h1>

          <p className="mt-4 text-sm text-[var(--color-muted)]">
            It may have been removed or the link may be incorrect.
          </p>

          <Link
            to="/shop"
            className="mt-8 inline-flex items-center justify-center bg-[var(--color-primary-bg)] px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--color-primary-text)] transition-opacity hover:opacity-80"
          >
            Browse products
          </Link>
        </div>
      </main>
    );
  }

  const handleAddToCart = () => {
    try {
      addToCart(product, quantity);
      setAddedToCart(true);
      setCartError("");
    } catch {
      setCartError("We couldn't update your cart. Please try again.");
      setAddedToCart(false);
    }
  };

  return (
    <main className="theme-page min-h-screen">
      <div className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 sm:py-12 lg:px-12">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[var(--color-muted)] sm:mb-12"
        >
          <Link
            to="/"
            className="transition-colors hover:text-[var(--color-text)]"
          >
            Home
          </Link>

          <span>/</span>

          <Link
            to="/shop"
            className="transition-colors hover:text-[var(--color-text)]"
          >
            Shop
          </Link>

          <span>/</span>

          <span className="text-[var(--color-text)]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Product image */}
          <div className="min-w-0">
            <div className="relative aspect-[4/4.5] overflow-hidden bg-[var(--color-surface)]">
              <img
                src={product.image}
                alt={product.name}
                fetchPriority="high"
                className="absolute inset-0 block h-full w-full object-cover object-center"
              />

              {product.badge && (
                <span className="absolute left-4 top-4 bg-[var(--color-primary-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-text)]">
                  {product.badge}
                </span>
              )}

              <span className="absolute bottom-4 left-4 border border-white/30 bg-black/50 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {product.condition}
              </span>
            </div>

            <p className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
              Product image shown for illustration. Actual appearance may vary
              by model and condition.
            </p>
          </div>

          {/* Product details */}
          <section className="flex min-w-0 flex-col pt-2 md:pt-6">
            <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
              {product.brand} / {product.category}
            </p>

            <h1 className="mt-4 font-['Space_Grotesk'] text-3xl font-medium leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {product.name}
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-[var(--color-muted)]">
              {product.description}
            </p>

            {/* Price */}
            <div className="mt-7 flex flex-wrap items-baseline gap-3">
              <span className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {formatPrice(product.price)}
              </span>

              {product.previousPrice && (
                <>
                  <span className="text-base text-[var(--color-muted)] line-through">
                    {formatPrice(product.previousPrice)}
                  </span>

                  <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--color-accent-link)]">
                    Special price
                  </span>
                </>
              )}
            </div>

            <div className="my-8 border-t border-[var(--color-border)]" />

            {/* Condition */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em]">
                  Product condition
                </p>

                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  {product.condition}
                </p>
              </div>

              <span className="border border-[var(--color-border)] px-3 py-2 text-[10px] uppercase tracking-[0.12em]">
                {product.category}
              </span>
            </div>

            {/* Quantity */}
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em]">
                Quantity
              </p>

              <div className="inline-flex h-12 items-center border border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    setQuantity((current) => Math.max(1, current - 1));
                    setAddedToCart(false);
                  }}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="h-full w-12 text-lg transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>

                <span
                  aria-live="polite"
                  className="min-w-10 text-center text-sm tabular-nums"
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setQuantity((current) => current + 1);
                    setAddedToCart(false);
                  }}
                  aria-label="Increase quantity"
                  className="h-full w-12 text-lg transition-colors hover:bg-[var(--color-surface)]"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}

            <button
              type="button"
              onClick={handleAddToCart}
              className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 bg-[var(--color-primary-bg)] px-6 py-4 text-xs font-semibold uppercase tracking-[0.16em] !text-[var(--color-primary-text)] opacity-100 transition-opacity hover:opacity-80"
            >
              <span className="!text-[var(--color-primary-text)]">
                {addedToCart ? "Added to cart" : "Add to cart"}
              </span>

              <span
                aria-hidden="true"
                className="!text-[var(--color-primary-text)]"
              >
                {addedToCart ? "✓" : "↗"}
              </span>
            </button>

            {addedToCart && (
              <div
                role="status"
                className="mt-3 flex items-center justify-between gap-4 border border-[var(--color-border)] p-4 text-sm"
              >
                <span className="text-[var(--color-muted)]">
                  {quantity} {quantity === 1 ? "item" : "items"} added to your
                  cart.
                </span>

                <Link
                  to="/cart"
                  className="shrink-0 font-semibold underline underline-offset-4"
                >
                  View cart
                </Link>
              </div>
            )}

            {cartError && (
              <p role="alert" className="mt-3 text-sm text-red-500">
                {cartError}
              </p>
            )}

            {/* Store information */}
            <div className="mt-8 space-y-4 border-t border-[var(--color-border)] pt-6">
              <div className="flex items-start gap-4">
                <span className="text-lg" aria-hidden="true">
                  ↗
                </span>

                <div>
                  <p className="text-xs font-semibold">Product enquiries</p>

                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                    Contact OceanTech to confirm availability and product
                    specifications before ordering.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <span className="text-lg" aria-hidden="true">
                  ◇
                </span>

                <div>
                  <p className="text-xs font-semibold">Shop with confidence</p>

                  <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">
                    Confirm the item's condition, included accessories, and
                    applicable warranty before purchase.
                  </p>
                </div>
              </div>
            </div>

            <Link
              to="/shop"
              className="mt-8 inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.12em] text-[var(--color-muted)] transition-colors hover:text-[var(--color-text)]"
            >
              <span aria-hidden="true">←</span>
              Continue shopping
            </Link>
          </section>
        </div>

        {/* Related products */}
        <section className="mt-20 border-t border-[var(--color-border)] pt-10 sm:mt-28 sm:pt-14">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted)]">
                Explore more
              </p>

              <h2 className="mt-3 font-['Space_Grotesk'] text-2xl sm:text-3xl">
                You might also like
              </h2>
            </div>

            <Link to="/shop" className="text-xs underline underline-offset-4">
              View all
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products
              .filter(
                (item) =>
                  item.id !== product.id && item.category === product.category,
              )
              .slice(0, 4)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.slug}`}
                  className="group min-w-0"
                >
                  <div className="relative aspect-[4/4.5] overflow-hidden bg-[var(--color-surface)]">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-[var(--color-muted)]">
                    {item.brand}
                  </p>

                  <h3 className="mt-1 text-sm leading-5">{item.name}</h3>

                  <p className="mt-2 text-sm font-semibold">
                    {formatPrice(item.price)}
                  </p>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </main>
  );
}
