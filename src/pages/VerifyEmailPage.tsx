import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

type VerificationStatus = "loading" | "success" | "error";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4242";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>("loading");
  const [message, setMessage] = useState("Verifying your email address...");
  const requestStarted = useRef(false);

  useEffect(() => {
    if (requestStarted.current) return;
    requestStarted.current = true;

    const token = searchParams.get("token");

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      setStatus("error");
      setMessage(
        "This verification link is invalid. Please check the link in your email.",
      );
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/verify-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ token }),
        });

        const data: { message?: string; error?: string } =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || "We couldn't verify your email address.",
          );
        }

        setStatus("success");
        setMessage(
          data.message || "Your email address has been verified successfully.",
        );
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again later.",
        );
      }
    };

    void verifyEmail();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
        <div
          className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            status === "success"
              ? "bg-green-100 text-green-700"
              : status === "error"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
          }`}
          aria-hidden="true"
        >
          {status === "success" ? (
            <span>✓</span>
          ) : status === "error" ? (
            <span>!</span>
          ) : (
            <span className="animate-pulse">•••</span>
          )}
        </div>

        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-blue-800">
          OceanTech
        </p>

        <h1 className="mb-3 text-2xl font-bold text-slate-900">
          {status === "loading"
            ? "Verifying your email"
            : status === "success"
              ? "Email verified!"
              : "Verification failed"}
        </h1>

        <p
          className="text-sm leading-7 text-slate-600"
          role="status"
          aria-live="polite"
        >
          {message}
        </p>

        {status === "loading" && (
          <div className="mt-6 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-800 border-t-transparent" />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {status === "success" && (
            <Link
              to="/shop"
              className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Continue shopping
            </Link>
          )}

          {status === "error" && (
            <Link
              to="/"
              className="rounded-lg bg-blue-900 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
            >
              Return to homepage
            </Link>
          )}

          {status !== "loading" && (
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 transition hover:text-blue-900"
            >
              Back to OceanTech
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
