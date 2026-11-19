import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

const configuredRoot = process.env.UPLOAD_ROOT?.trim();

export const UPLOAD_ROOT = configuredRoot
    ? path.resolve(configuredRoot)
    : path.resolve(moduleDirectory, "../../uploads");
export const COMPLAINT_UPLOAD_DIR = path.join(UPLOAD_ROOT, "complaints");

// Keep the folders in place even on a fresh checkout.
fs.mkdirSync(COMPLAINT_UPLOAD_DIR, { recursive: true });

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export const PHOTO_EXTENSIONS = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp"
};

export const ALLOWED_PHOTO_TYPES = Object.keys(PHOTO_EXTENSIONS);
