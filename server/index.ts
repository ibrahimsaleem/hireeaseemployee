import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const app = express();
const PORT = Number(process.env.PORT || 3001);

app.set("trust proxy", 1);

// CORS — only needed in dev (in prod the frontend is served from the same origin)
if (!isProd) {
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed =
          !origin ||
          origin.startsWith("http://localhost:") ||
          process.env.NODE_ENV === "development";
        if (allowed) return callback(null, origin ?? "");
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );
}

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/api/health",
  })
);

app.use(
  "/api/auth/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, skipSuccessfulRequests: true })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── API routes ────────────────────────────────────────────────────────────────
registerRoutes(app);

// ── Serve built React frontend in production ──────────────────────────────────
if (isProd) {
  // The Vite build output is at dist/ (relative to the project root)
  // When running `npx tsx server/index.ts` from the project root, __dirname
  // is the server/ subfolder, so we go up one level to find dist/
  const distPath = path.resolve(__dirname, "..", "dist");
  app.use(express.static(distPath));

  // SPA fallback — any non-API route serves index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
} else {
  // Dev: Vite runs separately on :5173; just tell developers how to access it
  app.get("/", (_req, res) => {
    res.json({
      message: "Employee Portal API (dev mode)",
      frontend: "http://localhost:5173 — run: npm run dev:client",
      api: `http://localhost:${PORT}/api`,
    });
  });
}

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n✓ Aplyease Employee Portal`);
  console.log(`  → http://localhost:${PORT}`);
  console.log(`  Mode: ${isProd ? "production (serving frontend + API)" : "development (API only)"}`);
  console.log(`  DB:   ${process.env.DATABASE_URL ? "connected" : "⚠ DATABASE_URL missing"}\n`);
});
