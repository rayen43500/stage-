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
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
  optionsSuccessStatus: 204
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(morgan("dev", {
  skip: (req) => req.path.includes("/delete-account/confirm")
}));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "Solid'Aid API" }));
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/donations", donationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/legal", legalRoutes);
app.use("/privacy-policy", (req, res, next) => { req.url = "/privacy"; legalRoutes(req, res, next); });
app.use("/delete-account", (req, res, next) => {
  req.url = req.url === "/" ? "/delete-account" : `/delete-account${req.url}`;
  legalRoutes(req, res, next);
});

app.use((err, req, res, next) => {
  if (err?.name === "ZodError") return res.status(400).json({ message: "Donnees invalides.", issues: err.issues });
  if (err?.message === "Origin not allowed by CORS") return res.status(403).json({ message: "Origine non autorisee." });
  console.error(err);
  res.status(500).json({ message: "Erreur serveur." });
});

connectDb(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos-link")
  .then(() => {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters.");
    }
    app.listen(port, "0.0.0.0", () => console.log(`API running on port ${port}`));
  })
  .catch((error) => {
    console.error("Application startup failed", error);
    process.exit(1);
  });
