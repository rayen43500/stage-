import jwt from "jsonwebtoken";

export function signToken(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  return jwt.sign({ sub: user._id.toString(), role: user.role }, secret, { expiresIn: "7d" });
}
