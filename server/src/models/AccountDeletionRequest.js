import mongoose from "mongoose";

const accountDeletionRequestSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true });

export const AccountDeletionRequest = mongoose.model("AccountDeletionRequest", accountDeletionRequestSchema);
