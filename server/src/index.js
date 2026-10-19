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

// ── CORS : accepter n'importe quelle origine ────────────────────────
const corsOptions = {
  origin: true,                    // reflète l'origine de la requête (Access-Control-Allow-Origin: <origin>)
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "Solid'Aid API" }));
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
  .then(() =>
    app.listen(port, "0.0.0.0", () =>
      console.log(`API running on http://0.0.0.0:${port}`)
    )
  )
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
