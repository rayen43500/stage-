import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import reportsRoutes from "./routes/reports.routes.js";
import donationsRoutes from "./routes/donations.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import blogRoutes from "./routes/blog.routes.js";
import legalRoutes from "./routes/legal.routes.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
  "http://localhost:8082",
  "http://localhost:8083",
  "http://127.0.0.1:8081",
  "http://127.0.0.1:8082",
  "http://127.0.0.1:8083"
];
const allowedOrigins = [...new Set([...configuredOrigins, ...developmentOrigins])];
const corsOptions = {
  origin(origin, callback) {
    // Native clients and server-to-server requests do not send an Origin header.
    let isLocalDevelopmentOrigin = false;
    if (origin) {
      try {
        const parsedOrigin = new URL(origin);
        isLocalDevelopmentOrigin =
          ["localhost", "127.0.0.1"].includes(parsedOrigin.hostname) &&
          [5173, 8081, 8082, 8083].includes(Number(parsedOrigin.port));
      } catch {
        isLocalDevelopmentOrigin = false;
      }
    }

    if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) {
      return callback(null, true);
    }
    return callback(new Error(`Origine CORS non autorisee: ${origin}`));
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "SOS CONNECT API" }));
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/donations", donationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/legal", legalRoutes);
app.use("/privacy-policy", (req, res, next) => { req.url = "/privacy"; legalRoutes(req, res, next); });
app.use("/delete-account", (req, res, next) => { req.url = "/delete-account"; legalRoutes(req, res, next); });

app.use((err, req, res, next) => {
  if (err?.name === "ZodError") return res.status(400).json({ message: "Donnees invalides.", issues: err.issues });
  console.error(err);
  res.status(500).json({ message: "Erreur serveur." });
});

connectDb(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos-link")
  .then(() => app.listen(port, () => console.log(`API running on http://localhost:${port}`)))
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
