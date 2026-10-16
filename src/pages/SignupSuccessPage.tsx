import { Link, useLocation, Navigate } from "react-router-dom";

type SignupSuccessState = {
  email?: string;
};

export default function SignupSuccessPage() {
  const location = useLocation();
  const state = location.state as SignupSuccessState | null;
  const email = state?.email;

  if (!email) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <section className="theme-page">
      <div className="container-shell flex min-h-[75vh] items-center justify-center py-14 sm:py-20">
        <div className="w-full max-w-lg">
          <div className="surface-card p-7 text-center sm:p-10">
            <div
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-3xl text-green-600 dark:text-green-400"
              aria-hidden="true"
            >
              ✓
            </div>

            <p className="eyebrow mt-7 justify-center">ONE LAST STEP</p>

            <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
              Check your email.
            </h1>

            <p className="theme-muted-text mt-5 text-sm leading-7">
              Your OceanTech account has been created. We’ve requested an email
              verification message for:
            </p>

            <p className="mt-3 break-words font-semibold">{email}</p>

            <div className="theme-border my-7 border-t" />

            <div className="space-y-3 text-left text-sm leading-6">
              <p>
                <strong>1.</strong> Open your email inbox.
              </p>
              <p>
                <strong>2.</strong> Look for the OceanTech verification email.
              </p>
              <p>
                <strong>3.</strong> Click the verification link to confirm your
                email address.
              </p>
            </div>

            <p className="theme-muted-text mt-6 text-xs leading-5">
              Can't find the email? Check your spam or junk folder. If the
              message never arrives, contact OceanTech support for assistance.
            </p>

            <Link
              to="/login"
              className="button-primary mt-8 flex w-full items-center justify-center gap-2"
            >
              Continue to sign in <span aria-hidden="true">→</span>
            </Link>

            <p className="theme-muted-text mt-5 text-xs">
              You must verify your email before using account features that
              require a verified address.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
