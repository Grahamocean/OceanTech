import { Router, type Request, type Response } from "express";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { z } from "zod";
import { pool } from "./db";
import { sendVerificationEmail } from "./email";

const router = Router();
const scrypt = promisify(scryptCallback);

const registerSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(12).max(128),
});

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

const verificationSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/i),
});

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt:${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split(":");

  if (
    parts.length !== 3 ||
    parts[0] !== "scrypt" ||
    !/^[a-f0-9]{32}$/i.test(parts[1]) ||
    !/^[a-f0-9]{128}$/i.test(parts[2])
  ) {
    return false;
  }

  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return timingSafeEqual(actual, expected);
}

function getSessionUserId(req: Request): string | undefined {
  return (req.session as typeof req.session & { userId?: string }).userId;
}

function logError(context: string, error: unknown): void {
  console.error(
    context,
    error instanceof Error
      ? { name: error.name, message: error.message }
      : error,
  );
}

// REGISTER
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error:
        "Enter a valid name, email address, and password of at least 12 characters.",
    });
    return;
  }

  const { fullName, email, password } = parsed.data;

  let passwordHash: string;

  try {
    passwordHash = await hashPassword(password);
  } catch (error) {
    logError("[Auth] Password hashing failed:", error);
    res.status(500).json({
      error: "Unable to create your account right now.",
    });
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const client = await pool.connect();

  let user: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `INSERT INTO users (full_name, email, password_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, full_name, email, role`,
      [fullName, email, passwordHash],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");

      res.status(409).json({
        error:
          "An account with this email already exists. Try signing in instead.",
      });
      return;
    }

    user = result.rows[0];

    await client.query(
      `INSERT INTO email_verification_tokens
         (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, tokenHash],
    );

    await client.query("COMMIT");

    console.info("[Auth] Account created:", {
      userId: user.id,
      email: user.email,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch((rollbackError) => {
      logError("[Auth] Registration rollback failed:", rollbackError);
    });

    logError("[Auth] Account registration failed:", error);

    res.status(500).json({
      error: "Unable to create your account right now.",
    });
    return;
  } finally {
    client.release();
  }

  try {
    console.info("[Auth] Sending verification email:", {
      userId: user.id,
      email: user.email,
    });

    await sendVerificationEmail(email, rawToken);

    console.info("[Auth] Verification email accepted by email provider:", {
      userId: user.id,
      email: user.email,
    });

    res.status(201).json({
      message: "Account created. Check your email for a verification link.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        emailVerified: false,
      },
      verificationEmailSent: true,
    });
  } catch (error) {
    logError("[Auth] Verification email could not be sent:", error);

    res.status(201).json({
      message:
        "Your account was created, but the verification email could not be sent. Please try again later or contact support.",
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        emailVerified: false,
      },
      verificationEmailSent: false,
    });
  }
});

// VERIFY EMAIL
router.post("/verify-email", async (req: Request, res: Response) => {
  const parsed = verificationSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "The verification link is invalid or expired.",
    });
    return;
  }

  const tokenHash = hashToken(parsed.data.token);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT id, user_id
       FROM email_verification_tokens
       WHERE token_hash = $1
         AND consumed_at IS NULL
         AND expires_at > NOW()
       FOR UPDATE`,
      [tokenHash],
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");

      res.status(400).json({
        error: "The verification link is invalid, expired, or already used.",
      });
      return;
    }

    const verification = result.rows[0];

    await client.query(
      `UPDATE email_verification_tokens
       SET consumed_at = NOW()
       WHERE id = $1`,
      [verification.id],
    );

    await client.query(
      `UPDATE users
       SET email_verified_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [verification.user_id],
    );

    await client.query("COMMIT");

    console.info("[Auth] Email verified:", {
      userId: verification.user_id,
    });

    res.status(200).json({
      message: "Your email address has been verified successfully.",
    });
  } catch (error) {
    await client.query("ROLLBACK").catch((rollbackError) => {
      logError("[Auth] Verification rollback failed:", rollbackError);
    });

    logError("[Auth] Email verification failed:", error);

    res.status(500).json({
      error: "Unable to verify your email right now.",
    });
  } finally {
    client.release();
  }
});

// LOGIN
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      error: "Enter a valid email and password.",
    });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, password_hash, role,
              is_active, email_verified_at
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email],
    );

    const user = result.rows[0];

    if (
      !user ||
      !user.password_hash ||
      !user.is_active ||
      !(await verifyPassword(password, user.password_hash))
    ) {
      res.status(401).json({
        error: "Invalid email or password.",
      });
      return;
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) {
        logError("[Auth] Session regeneration failed:", sessionError);

        res.status(500).json({
          error: "Unable to start your session.",
        });
        return;
      }

      (req.session as typeof req.session & { userId?: string }).userId =
        user.id;

      req.session.save((saveError) => {
        if (saveError) {
          logError("[Auth] Session save failed:", saveError);

          res.status(500).json({
            error: "Unable to save your session.",
          });
          return;
        }

        res.status(200).json({
          message: "Signed in successfully.",
          user: {
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            role: user.role,
            emailVerified: Boolean(user.email_verified_at),
          },
        });
      });
    });
  } catch (error) {
    logError("[Auth] Login failed:", error);

    res.status(500).json({
      error: "Unable to sign in right now.",
    });
  }
});

// CURRENT USER
router.get("/me", async (req: Request, res: Response) => {
  const userId = getSessionUserId(req);

  if (!userId) {
    res.status(401).json({
      error: "You are not signed in.",
    });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, email_verified_at
       FROM users
       WHERE id = $1 AND is_active = true
       LIMIT 1`,
      [userId],
    );

    if (result.rowCount === 0) {
      req.session.destroy((error) => {
        if (error) {
          logError("[Auth] Invalid session cleanup failed:", error);
        }
      });

      res.status(401).json({
        error: "Your session is no longer valid.",
      });
      return;
    }

    const user = result.rows[0];

    res.status(200).json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        emailVerified: Boolean(user.email_verified_at),
      },
    });
  } catch (error) {
    logError("[Auth] Current-user lookup failed:", error);

    res.status(500).json({
      error: "Unable to retrieve your account right now.",
    });
  }
});

// LOGOUT
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy((error) => {
    if (error) {
      logError("[Auth] Logout failed:", error);

      res.status(500).json({
        error: "Unable to sign out right now.",
      });
      return;
    }

    res.clearCookie("oceantech.sid");

    res.status(200).json({
      message: "Signed out successfully.",
    });
  });
});

export default router;
