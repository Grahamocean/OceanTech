import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:4242"
).replace(/\/$/, "");

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || transitioning) return;

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.user) {
        throw new Error(data.error || "Unable to sign in. Please try again.");
      }

      if (!data.user.emailVerified) {
        throw new Error("Please verify your email address before signing in.");
      }

      setLoading(false);
      setTransitioning(true);

      const from = location.state?.from?.pathname;
      const destination =
        typeof from === "string" &&
        from.startsWith("/") &&
        !from.startsWith("//") &&
        from !== "/login" &&
        from !== "/signup"
          ? from
          : "/account";

      window.setTimeout(() => {
        navigate(destination, { replace: true });
      }, 650);
    } catch (err) {
      setLoading(false);
      setTransitioning(false);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  const isBusy = loading || transitioning;

  return (
    <>
      {transitioning && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-black"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-black/15 border-t-black" />
          <p className="mt-5 text-sm font-medium">
            Welcome back to OceanTech...
          </p>
        </div>
      )}

      <main className="theme-page flex min-h-screen items-center justify-center px-5 py-12">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border theme-border bg-white shadow-xl lg:grid-cols-2">
          <div
            className="relative hidden min-h-[650px] bg-cover bg-center lg:block"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=2400&q=85)",
            }}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute inset-x-0 bottom-0 p-10 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                OceanTech
              </p>
              <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
                Technology that moves you forward.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/75">
                Sign in to continue your shopping experience.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-12 sm:px-10 lg:px-12">
            <div className="w-full max-w-md">
              <Link
                to="/"
                className="text-sm font-semibold tracking-wide text-black"
              >
                OceanTech
              </Link>

              <h1 className="mt-8 text-3xl font-semibold tracking-tight text-black">
                Welcome back
              </h1>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Sign in to access your account.
              </p>

              {error && (
                <div
                  role="alert"
                  className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-medium text-black"
                  >
                    Email address
                  </label>

                  <input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    disabled={isBusy}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-black outline-none transition focus:border-black disabled:opacity-60"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-medium text-black"
                    >
                      Password
                    </label>
                  </div>

                  <div className="relative">
                    <input
                      id="login-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Enter your password"
                      disabled={isBusy}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-20 text-sm text-black outline-none transition focus:border-black disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      disabled={isBusy}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-black disabled:opacity-50"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex w-full items-center justify-center gap-3 rounded-full !bg-black px-6 py-3.5 text-sm font-medium !text-white transition hover:!bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading && (
                    <span
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    />
                  )}
                  {loading
                    ? "Signing in..."
                    : transitioning
                      ? "Welcome..."
                      : "Sign in"}
                </button>
              </form>

              <p className="mt-7 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/signup"
                  className="font-semibold text-black underline underline-offset-4"
                >
                  Create account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
