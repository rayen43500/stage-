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

const app = express();
const port = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/api/health", (req, res) => res.json({ ok: true, name: "SOS CONNECT API" }));
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/donations", donationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);

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
