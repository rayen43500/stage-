import jwt from "jsonwebtoken";

export function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET || "fallback-secret-key-12345", { expiresIn: "7d" });
}
