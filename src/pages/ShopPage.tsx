import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/shop/ProductCard";
import { categories, products, type CategoryFilter } from "../data/products";

type ConditionFilter = "All conditions" | "Brand new" | "UK used";
type SortOption = "featured" | "price-low" | "price-high" | "name";

function getCategoryFromQuery(value: string | null): CategoryFilter {
  if (!value) return "All";

  const normalized = value.toLowerCase();

  const mappedCategory: Record<string, CategoryFilter> = {
    laptops: "Laptops",
    monitors: "Monitors",
    phones: "Phones",
    accessories: "Accessories",
    audio: "Audio",
  };

  return mappedCategory[normalized] ?? "All";
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialCategory = getCategoryFromQuery(searchParams.get("category"));

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>(initialCategory);
  const [condition, setCondition] = useState<ConditionFilter>("All conditions");
  const [sort, setSort] = useState<SortOption>("featured");

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          product.name,
          product.brand,
          product.category,
          product.description,
          product.condition,
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesCategory =
        category === "All" || product.category === category;

      const matchesCondition =
        condition === "All conditions" || product.condition === condition;

      return matchesSearch && matchesCategory && matchesCondition;
    });

    switch (sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;

      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;

      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case "featured":
      default:
        result.sort(
          (a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)),
        );
        break;
    }

    return result;
  }, [search, category, condition, sort]);

  function selectCategory(nextCategory: CategoryFilter) {
    setCategory(nextCategory);

    if (nextCategory === "All") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", nextCategory.toLowerCase());
    }

    setSearchParams(searchParams, { replace: true });
  }

  function resetFilters() {
    setSearch("");
    setCategory("All");
    setCondition("All conditions");
    setSort("featured");
    setSearchParams({}, { replace: true });
  }

  const hasActiveFilters =
    search.trim() !== "" ||
    category !== "All" ||
    condition !== "All conditions" ||
    sort !== "featured";

  return (
    <main className="theme-page min-h-screen">
      {/* SHOP INTRO */}
      <section className="container-shell pb-10 pt-12 sm:pb-14 sm:pt-20 lg:pt-24">
        <div className="flex flex-col gap-8 border-b border-[var(--color-border)] pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow mb-5">The OceanTech collection</p>

            <h1 className="display-heading">
              Find your
              <br />
              <span className="metallic-text">next essential.</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-[var(--color-muted)] sm:text-base">
              Thoughtfully selected technology for the way you work, create,
              connect, and live.
            </p>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-3xl font-medium tracking-tight">
              {products.length.toString().padStart(2, "0")}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-[var(--color-muted)]">
              Products in collection
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH AND FILTERS */}
      <section className="container-shell pb-10">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex min-h-12 items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface)] px-4 transition-colors focus-within:border-[var(--color-muted)] lg:max-w-md lg:flex-1">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-[18px] w-[18px] shrink-0 text-[var(--color-muted)]"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m16 16 4.2 4.2"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products, brands..."
                aria-label="Search products"
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-field-placeholder)]"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-xs text-[var(--color-muted)] transition hover:text-[var(--color-text)]"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3 sm:flex">
              <label className="flex min-h-12 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Condition
                </span>

                <select
                  value={condition}
                  onChange={(event) =>
                    setCondition(event.target.value as ConditionFilter)
                  }
                  aria-label="Filter by condition"
                  className="min-w-0 flex-1 bg-transparent py-3 text-xs text-[var(--color-text)] outline-none"
                >
                  <option value="All conditions">All</option>
                  <option value="Brand new">Brand new</option>
                  <option value="UK used">UK used</option>
                </select>
              </label>

              <label className="flex min-h-12 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3">
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
                  Sort
                </span>

                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as SortOption)
                  }
                  aria-label="Sort products"
                  className="min-w-0 flex-1 bg-transparent py-3 text-xs text-[var(--color-text)] outline-none"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                  <option value="name">Name: A–Z</option>
                </select>
              </label>
            </div>
          </div>

          {/* CATEGORY NAVIGATION */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] pb-5">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => selectCategory(item)}
                aria-pressed={category === item}
                className={`border px-4 py-2.5 text-xs transition-colors duration-200 ${
                  category === item
                    ? "border-[var(--color-primary-bg)] bg-[var(--color-primary-bg)] text-[var(--color-primary-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                {item}
              </button>
            ))}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto px-2 py-2 text-xs text-[var(--color-muted)] underline underline-offset-4 transition hover:text-[var(--color-text)]"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="container-shell pb-20 sm:pb-28">
        <div className="mb-7 flex items-center justify-between gap-4">
          <p className="text-xs text-[var(--color-muted)]" aria-live="polite">
            Showing{" "}
            <span className="font-semibold text-[var(--color-text)]">
              {filteredProducts.length}
            </span>{" "}
            {filteredProducts.length === 1 ? "product" : "products"}
          </p>

          <p className="hidden text-[10px] uppercase tracking-[0.15em] text-[var(--color-muted)] sm:block">
            Considered technology. Everyday value.
          </p>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[320px] flex-col items-center justify-center border border-dashed border-[var(--color-border)] px-6 text-center">
            <span className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m16 16 4.2 4.2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>

            <h2 className="font-['Space_Grotesk'] text-2xl">Nothing found.</h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-[var(--color-muted)]">
              Try another search or adjust your filters to discover more
              products.
            </p>

            <button
              type="button"
              onClick={resetFilters}
              className="button-primary mt-7"
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
