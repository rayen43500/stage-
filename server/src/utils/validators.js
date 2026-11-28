import { z } from "zod";

const HTTPS_URL = /^https:\/\/[^\s"'<>]+$/i;
const DATA_IMAGE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i;

// Image field: HTTPS URL or base64 data URI (png/jpeg/webp). Rejects any HTML/JS payload.
export function imageField(maxLength = 8_000_000, { allowEmpty = false } = {}) {
  return z
    .string()
    .max(maxLength)
    .refine((v) => (allowEmpty && v === "") || HTTPS_URL.test(v) || DATA_IMAGE.test(v), "Image invalide.")
    .optional();
}
