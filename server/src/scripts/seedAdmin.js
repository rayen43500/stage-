import "dotenv/config";
import { connectDb } from "../config/db.js";
import { User } from "../models/User.js";

const email = process.env.ADMIN_EMAIL || "admin@soslink.fr";
const password = process.env.ADMIN_PASSWORD || "Admin12345!";

await connectDb(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sos-link");

const exists = await User.findOne({ email });
if (exists) {
  console.log(`Admin already exists: ${email}`);
  process.exit(0);
}

await User.create({
  email,
  passwordHash: await User.hashPassword(password),
  role: "admin",
  status: "active",
  consentRgpd: true,
  emailVerified: true
});

console.log(`Admin created: ${email} / ${password}`);
process.exit(0);
