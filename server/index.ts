import "dotenv/config";
import express, { type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";
import authRouter from "./auth";
import paymentsRouter from "./payments";

const app = express();

const PORT = Number(process.env.API_PORT || 4242);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("API_PORT must be a valid port number.");
}

if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must contain at least 32 characters.");
}

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(helmet());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "X-Paystack-Signature"],
  }),
);

app.use(
  express.json({
    limit: "20kb",
    verify: (req, _res, buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  }),
);

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
  }),
);

const PgSession = connectPgSimple(session);

app.use(
  session({
    name: "oceantech.sid",
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: false,
    }),
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

app.use("/api/auth", authRouter);
app.use("/api/payments", paymentsRouter);

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "OceanTech API",
  });
});

app.get("/api/db-health", async (_req, res, next) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database_name",
    );

    res.status(200).json({
      status: "ok",
      database: result.rows[0].database_name,
    });
  } catch (error) {
    next(error);
  }
});

app.use((_req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.use(
  (
    _error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res.status(500).json({
      error: "An unexpected server error occurred.",
    });
  },
);

const server = app.listen(PORT, () => {
  console.log(`OceanTech API running on port ${PORT}`);
});

async function shutdown() {
  server.close(async () => {
    try {
      await pool.end();
      process.exit(0);
    } catch {
      process.exit(1);
    }
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
