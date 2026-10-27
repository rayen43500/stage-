import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const geoPointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["citizen", "association", "restaurant", "admin"],
      default: "citizen"
    },
    status: {
      type: String,
      enum: ["active", "pending", "rejected"],
      default: "active"
    },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    organizationName: String,
    sirenSiret: String,
    phone: String,
    address: String,
    avatarUrl: String,
    services: [{ type: String, enum: ["hygiene", "clothes", "food", "shelter", "health", "psychological", "other"] }],
    interventionZone: {
      center: geoPointSchema,
      radiusKm: { type: Number, min: 0, max: 100 }
    },
    helloAssoUrl: String,
    emailVerified: { type: Boolean, default: true },
    consentRgpd: { type: Boolean, required: true },
    deletedAt: Date
  },
  { timestamps: true }
);

userSchema.index({ "interventionZone.center": "2dsphere" });

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = function hashPassword(password) {
  return bcrypt.hash(password, 12);
};

export const User = mongoose.model("User", userSchema);
