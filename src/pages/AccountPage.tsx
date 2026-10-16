import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4242"
).replace(/\/$/, "");

type AccountUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
};

type AuthResponse = {
  user?: AccountUser;
  error?: string;
  message?: string;
};

export default function AccountPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAccount() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          navigate("/login", {
            replace: true,
            state: { from: { pathname: "/account" } },
          });
          return;
        }

        const data: AuthResponse = await response.json();

        if (!response.ok || !data.user) {
          throw new Error(
            data.error || "We couldn't load your account. Please try again.",
          );
        }

        if (!cancelled) {
          setUser(data.user);
          setError("");
        }
      } catch {
        if (!cancelled) {
          setError(
            "Unable to connect to your account right now. Check your connection and try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAccount();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleSignOut() {
    setSigningOut(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Sign out failed.");
      }

      setUser(null);
      navigate("/", { replace: true });
    } catch {
      setError("We couldn't sign you out. Please try again.");
    } finally {
      setSigningOut(false);
    }
  }

  if (loading) {
    return (
      <main className="theme-page min-h-[70vh] px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <p className="theme-muted-text text-sm">Loading your account...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="theme-page min-h-[70vh] px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="surface-card rounded-2xl border theme-border p-8">
            <h1 className="text-2xl font-semibold">Your account</h1>

            <p className="theme-muted-text mt-3">
              {error || "Your account information is currently unavailable."}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="button-primary mt-6 rounded-full px-6 py-3 text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  const firstName = user.fullName.trim().split(/\s+/)[0] || "Customer";
  const initials = user.fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <main className="theme-page min-h-screen px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10">
          <p className="theme-muted-text text-xs font-semibold uppercase tracking-[0.2em]">
            OceanTech / My account
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back, {firstName}.
          </h1>

          <p className="theme-muted-text mt-3 max-w-xl text-sm leading-6 sm:text-base">
            Manage your profile and keep track of your OceanTech shopping
            experience from one place.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <section className="surface-card rounded-2xl border theme-border p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border theme-border text-lg font-semibold">
                {initials}
              </div>

              <div className="min-w-0">
                <h2 className="text-xl font-semibold">Personal information</h2>

                <p className="theme-muted-text mt-1 text-sm">
                  Your registered account details
                </p>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <p className="theme-muted-text text-xs font-medium uppercase tracking-wider">
                  Full name
                </p>

                <p className="mt-2 break-words text-sm font-medium">
                  {user.fullName}
                </p>
              </div>

              <div>
                <p className="theme-muted-text text-xs font-medium uppercase tracking-wider">
                  Email address
                </p>

                <p className="mt-2 break-all text-sm font-medium">
                  {user.email}
                </p>
              </div>

              <div>
                <p className="theme-muted-text text-xs font-medium uppercase tracking-wider">
                  Email verification
                </p>

                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      user.emailVerified
                        ? "border-green-600/30 text-green-700"
                        : "border-amber-600/30 text-amber-700"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.emailVerified ? "bg-green-600" : "bg-amber-600"
                      }`}
                    />
                    {user.emailVerified ? "Verified" : "Not verified"}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="space-y-6">
            <section className="surface-card rounded-2xl border theme-border p-6 sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">Your orders</h2>

                  <p className="theme-muted-text mt-2 text-sm leading-6">
                    View your purchases and order updates here when order
                    history is connected.
                  </p>
                </div>

                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 shrink-0"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path
                    d="M3 7.5h18l-1.5 13h-15L3 7.5Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M8 9V6a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                </svg>
              </div>

              <div className="mt-6 border-t theme-border pt-5">
                <p className="theme-muted-text text-sm">
                  Order history isn't connected yet.
                </p>
              </div>
            </section>

            <section className="surface-card rounded-2xl border theme-border p-6 sm:p-8">
              <h2 className="text-xl font-semibold">Continue shopping</h2>

              <p className="theme-muted-text mt-2 text-sm leading-6">
                Explore laptops, computers, and accessories available at
                OceanTech.
              </p>

              <Link
                to="/shop"
                className="button-primary mt-5 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium"
              >
                Browse products
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>
            </section>

            <section className="rounded-2xl border theme-border p-6">
              <h2 className="text-base font-semibold">Account security</h2>

              <p className="theme-muted-text mt-2 text-sm leading-6">
                Sign out when you're finished using your account, especially on
                a shared device.
              </p>

              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="mt-5 rounded-full border theme-border px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
