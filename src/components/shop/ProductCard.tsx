import { Link } from "react-router-dom";
import type { Product } from "../../data/products";
import { formatPrice } from "../../data/products";
import Icon from "../ui/Icon";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <article className="group min-w-0">
      <Link
        to={`/product/${product.slug}`}
        className="block"
        aria-label={`View ${product.name}`}
      >
        {/* PRODUCT IMAGE */}
        <div className="relative isolate aspect-[4/4.5] overflow-hidden bg-[var(--color-surface)]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {/* Image overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/5 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Product badges */}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {product.badge && (
              <span className="bg-[var(--color-primary-bg)] px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--color-primary-text)]">
                {product.badge}
              </span>
            )}

            <span className="border border-white/30 bg-black/45 px-2.5 py-1.5 text-[9px] uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              {product.condition}
            </span>
          </div>

          {/* Hover action */}
          <span className="absolute bottom-3 right-3 grid h-10 w-10 translate-y-2 place-items-center bg-white text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <Icon name="arrow-up-right" size={18} />
          </span>
        </div>

        {/* PRODUCT INFORMATION */}
        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)]">
              {product.brand}
            </span>

            <span className="text-[10px] text-[var(--color-muted)]">
              {product.category}
            </span>
          </div>

          <h2 className="font-['Space_Grotesk'] text-base tracking-tight transition-opacity group-hover:opacity-70 sm:text-lg">
            {product.name}
          </h2>

          <p className="mt-1.5 text-xs leading-5 text-[var(--color-muted)]">
            {product.description}
          </p>
        </div>
      </Link>

      {/* PRICE AND DETAILS */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-3">
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold">
            {formatPrice(product.price)}
          </span>

          {product.previousPrice && (
            <span className="text-xs text-[var(--color-muted)] line-through">
              {formatPrice(product.previousPrice)}
            </span>
          )}
        </div>

        <Link
          to={`/product/${product.slug}`}
          aria-label={`View ${product.name} details`}
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent-link)] transition-opacity hover:opacity-60"
        >
          View details
          <Icon name="arrow-right" size={13} />
        </Link>
      </div>
    </article>
  );
}
