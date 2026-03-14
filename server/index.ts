import "dotenv/config";
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { registerRoutes } from "./routes.js";

const app = express();
const PORT = Number(process.env.PORT || 3001);

// Trust proxy (Render, Vercel, etc.)
app.set("trust proxy", 1);

// CORS — allow the deployed employee portal frontend + localhost dev
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // curl / mobile / same-origin
      const allowed =
        !origin || // no origin (server-to-server, curl)
        origin.endsWith(".vercel.app") ||
        origin.endsWith(".netlify.app") ||
        origin.endsWith(".onrender.com") ||
        origin.endsWith(".web.app") ||
        origin.endsWith(".firebaseapp.com") ||
        origin === "http://localhost:5173" ||
        origin === "http://localhost:5174" ||
        origin === "http://localhost:5175" ||
        origin === "http://localhost:4173" ||
        process.env.ALLOWED_ORIGIN === origin ||
        process.env.NODE_ENV === "development";

      if (allowed) return callback(null, origin);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/api/health",
  })
);

// Stricter limit on login
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Register all routes
registerRoutes(app);

// 404 catch-all for unknown /api routes
app.use("/api/*", (_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`✓ Employee Portal API running on http://localhost:${PORT}`);
  console.log(`  NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  DB: ${process.env.DATABASE_URL ? "configured" : "MISSING"}`);
});
