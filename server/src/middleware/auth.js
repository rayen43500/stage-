import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export async function auth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentification requise." });
    const payload = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret-key-12345");
    const user = await User.findById(payload.sub).select("-passwordHash");
    if (!user || user.deletedAt) return res.status(401).json({ message: "Compte introuvable." });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Session invalide." });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ message: "Acces refuse." });
    next();
  };
}

export function requireValidatedOrganization(req, res, next) {
  if (["association", "restaurant"].includes(req.user.role) && req.user.status !== "active") {
    return res.status(403).json({ message: "Compte en attente de validation administrateur." });
  }
  next();
}
