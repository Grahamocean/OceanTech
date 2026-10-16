import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import Icon from "../ui/Icon";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4242"
).replace(/\/+$/, "");

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
};

type AuthResponse = {
  user?: AuthUser;
  error?: string;
};

const navigation = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Our Story", to: "/about" },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <svg
          aria-hidden="true"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.42 1.42" />
          <path d="m17.65 17.65 1.42 1.42" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.35 17.65-1.42 1.42" />
          <path d="m19.07 4.93-1.42 1.42" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        </svg>
      )}
    </button>
  );
}

export default function SiteLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [authError, setAuthError] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Restore the existing session and refresh the header after navigation.
  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          if (active) {
            setUser(null);
          }
          return;
        }

        const data = (await response.json()) as AuthResponse;

        if (active) {
          setUser(data.user ?? null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  async function handleSignOut() {
    if (signingOut) return;

    setSigningOut(true);
    setAuthError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };

      if (!response.ok) {
        setAuthError(data.error || "Unable to sign out. Please try again.");
        return;
      }

      setUser(null);
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch {
      setAuthError(
        "Unable to reach OceanTech. Check your connection and try again.",
      );
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="theme-page">
      <div className="theme-announcement border-b px-4 py-2 text-center text-[10px] tracking-[0.16em] sm:text-xs">
        ENGINEERED FOR YOUR EVERYDAY.
        <span className="mx-2 text-[#92969E]">/</span>
        DISCOVER THE OCEANTECH COLLECTION
      </div>

      <header className="theme-header sticky top-0 z-50 border-b backdrop-blur-xl">
        <div className="container-shell flex h-[76px] items-center justify-between gap-4">
          <Link
            to="/"
            className="shrink-0 font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.08em]"
            aria-label="OceanTech home"
            onClick={() => setMenuOpen(false)}
          >
            OCEAN<span className="theme-muted-text">TECH</span>
            <span className="theme-muted-text ml-1 align-top text-[9px] tracking-normal">
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
                    isActive ? "text-[var(--color-text)]" : "theme-link"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              to="/shop"
              className="theme-link hidden sm:block"
              aria-label="Search products"
            >
              <Icon name="search" size={19} />
            </Link>

            <ThemeToggle />

            {!authLoading &&
              (user ? (
                <div className="hidden items-center gap-3 lg:flex">
                  <Link
                    to="/account"
                    className="theme-link max-w-[150px] truncate text-xs font-medium"
                    title="My account"
                  >
                    Hi, {user.fullName.split(" ")[0]}
                  </Link>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="theme-link text-xs font-medium disabled:opacity-50"
                  >
                    {signingOut ? "Signing out..." : "Sign out"}
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="theme-link hidden text-xs font-medium lg:block"
                  >
                    Sign in
                  </Link>

                  <Link
                    to="/signup"
                    className="button-primary hidden items-center gap-2 px-4 py-2 text-xs sm:inline-flex"
                  >
                    Create account
                    <span aria-hidden="true">→</span>
                  </Link>
                </>
              ))}

            <Link
              to="/wishlist"
              className="theme-link hidden sm:block"
              aria-label="Wishlist"
            >
              <Icon name="heart" size={19} />
            </Link>

            <Link to="/cart" className="theme-link" aria-label="Shopping bag">
              <Icon name="shopping-bag" size={20} />
            </Link>

            <button
              type="button"
              className="theme-link ml-1 md:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMenuOpen((open) => !open)}
            >
              <Icon name={menuOpen ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {authError && (
          <div
            role="alert"
            className="border-t border-red-200 bg-red-50 px-4 py-2 text-center text-sm text-red-700"
          >
            {authError}
          </div>
        )}

        {menuOpen && (
          <nav
            id="mobile-navigation"
            className="theme-mobile-menu border-t px-5 py-5 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="container-shell flex flex-col">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `theme-border border-b py-4 text-sm ${
                      isActive ? "text-[var(--color-text)]" : "theme-link"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}

              {!authLoading &&
                (user ? (
                  <>
                    <div className="theme-border border-b py-4 text-sm">
                      <span className="theme-muted-text block text-xs">
                        Signed in as
                      </span>
                      <span className="mt-1 block font-medium">
                        {user.fullName}
                      </span>
                    </div>

                    <Link
                      to="/account"
                      onClick={() => setMenuOpen(false)}
                      className="theme-link theme-border border-b py-4 text-sm"
                    >
                      My account
                    </Link>

                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={signingOut}
                      className="theme-link theme-border border-b py-4 text-left text-sm disabled:opacity-50"
                    >
                      {signingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMenuOpen(false)}
                      className="theme-link theme-border border-b py-4 text-sm"
                    >
                      Sign in
                    </Link>

                    <Link
                      to="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="theme-link theme-border border-b py-4 text-sm"
                    >
                      Create account
                    </Link>
                  </>
                ))}

              <Link
                to="/wishlist"
                onClick={() => setMenuOpen(false)}
                className="theme-link theme-border border-b py-4 text-sm"
              >
                Wishlist
              </Link>

              <Link
                to="/cart"
                onClick={() => setMenuOpen(false)}
                className="theme-link py-4 text-sm"
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

      <footer className="theme-border border-t">
        <div className="container-shell grid gap-12 py-14 md:grid-cols-[1.5fr_1fr_1fr] md:py-20">
          <div className="max-w-sm">
            <Link
              to="/"
              className="font-['Space_Grotesk'] text-2xl font-semibold tracking-[-0.08em]"
            >
              OCEAN<span className="theme-muted-text">TECH</span>
            </Link>

            <p className="theme-muted-text mt-5 max-w-xs text-sm leading-7">
              Thoughtfully selected technology. Everyday essentials, considered
              differently.
            </p>

            <Link
              to="/shop"
              className="theme-accent-link mt-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.12em]"
            >
              Explore the collection
              <Icon name="arrow-up-right" size={16} />
            </Link>
          </div>

          <div>
            <p className="eyebrow mb-5">Explore</p>
            <div className="flex flex-col items-start gap-4 text-sm">
              <Link className="theme-link" to="/shop">
                All products
              </Link>
              <Link className="theme-link" to="/wishlist">
                Wishlist
              </Link>
              <Link className="theme-link" to="/cart">
                Shopping bag
              </Link>
            </div>
          </div>

          <div>
            <p className="eyebrow mb-5">Customer care</p>
            <div className="flex flex-col items-start gap-4 text-sm">
              <a className="theme-link" href="mailto:hello@oceantech.com">
                Contact us
              </a>
              <p className="theme-muted-text">Secure checkout</p>
              <p className="theme-muted-text">Carefully selected technology</p>
            </div>
          </div>
        </div>

        <div className="theme-border theme-muted-text container-shell flex flex-col gap-3 border-t py-5 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} OceanTech. All rights reserved.</p>
          <p>Technology, thoughtfully chosen.</p>
        </div>
      </footer>
    </div>
  );
}
