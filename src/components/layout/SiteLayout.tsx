import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import Icon from "../ui/Icon";

const navigation = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Our Story", to: "/about" },
];

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#F3F4F5]">
      <div className="border-b border-[#303238] bg-[#141518] px-4 py-2 text-center text-[10px] tracking-[0.16em] text-[#C5CBD2] sm:text-xs">
        ENGINEERED FOR YOUR EVERYDAY.
        <span className="mx-2 text-[#686C74]">/</span>
        DISCOVER THE OCEANTECH COLLECTION
      </div>

      <header className="sticky top-0 z-50 border-b border-[#303238] bg-[#0A0A0B]/95 backdrop-blur-xl">
        <div className="container-shell flex h-[76px] items-center justify-between gap-5">
          <Link
            to="/"
            className="shrink-0 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.08em]"
            aria-label="OceanTech home"
            onClick={() => setMenuOpen(false)}
          >
            OCEAN<span className="text-[#92969E]">TECH</span>
            <span className="ml-1 align-top text-[9px] tracking-normal text-[#92969E]">
              ®
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `text-xs transition-colors duration-200 ${
                    isActive
                      ? "text-[#F3F4F5]"
                      : "text-[#92969E] hover:text-[#F3F4F5]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/shop"
              className="hidden text-[#92969E] transition-colors hover:text-white sm:block"
              aria-label="Search products"
            >
              <Icon name="search" size={19} />
            </Link>

            <Link
              to="/wishlist"
              className="text-[#92969E] transition-colors hover:text-white"
              aria-label="Wishlist"
            >
              <Icon name="heart" size={19} />
            </Link>

            <Link
              to="/cart"
              className="relative text-[#92969E] transition-colors hover:text-white"
              aria-label="Shopping bag"
            >
              <Icon name="shopping-bag" size={20} />
            </Link>

            <button
              type="button"
              className="ml-1 text-[#F3F4F5] md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[#303238] bg-[#0A0A0B] px-5 py-5 md:hidden">
            <div className="container-shell flex flex-col">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `border-b border-[#303238] py-4 text-sm ${
                      isActive ? "text-white" : "text-[#92969E]"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="py-4 text-sm text-[#92969E]"
              >
                Shopping bag
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-[#303238]">
        <div className="container-shell grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
          <div className="max-w-sm">
            <Link
              to="/"
              className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.08em]"
            >
              OCEAN<span className="text-[#92969E]">TECH</span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-[#92969E]">
              Thoughtfully selected technology. Everyday essentials, considered
              differently.
            </p>

            <Link
              to="/shop"
              className="mt-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#C5CBD2] hover:text-white"
            >
              Explore the collection
              <Icon name="arrow-up-right" size={16} />
            </Link>
          </div>

          <div>
            <p className="eyebrow mb-5">Explore</p>
            <div className="flex flex-col items-start gap-4 text-sm text-[#92969E]">
              <Link className="hover:text-white" to="/shop">
                All products
              </Link>
              <Link className="hover:text-white" to="/wishlist">
                Wishlist
              </Link>
              <Link className="hover:text-white" to="/cart">
                Shopping bag
              </Link>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-5">Customer care</p>
            <div className="flex flex-col items-start gap-4 text-sm text-[#92969E]">
              <a className="hover:text-white" href="mailto:hello@oceantech.com">
                Contact us
              </a>
              <p>Secure checkout</p>
              <p>Carefully selected technology</p>
            </div>
          </div>
        </div>

        <div className="container-shell flex flex-col gap-3 border-t border-[#303238] py-5 text-[11px] text-[#686C74] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OceanTech. All rights reserved.</p>
          <p>Technology, thoughtfully chosen.</p>
        </div>
      </footer>
    </div>
  );
}
