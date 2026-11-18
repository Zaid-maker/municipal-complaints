import crypto from "node:crypto";
import multer from "multer";

import {
    ALLOWED_PHOTO_TYPES,
    COMPLAINT_UPLOAD_DIR,
    MAX_PHOTOS,
    MAX_PHOTO_BYTES,
    PHOTO_EXTENSIONS
} from "../config/uploads.js";

class UploadValidationError extends Error {
    constructor(message) {
        super(message);
        this.status = 400;
    }
}

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, COMPLAINT_UPLOAD_DIR);
    },
    filename: (_req, file, callback) => {
        const extension = PHOTO_EXTENSIONS[file.mimetype] ?? "";
        callback(null, `${crypto.randomUUID()}${extension}`);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: MAX_PHOTO_BYTES,
        files: MAX_PHOTOS
    },
    fileFilter: (_req, file, callback) => {
        if (!ALLOWED_PHOTO_TYPES.includes(file.mimetype)) {
            callback(
                new UploadValidationError(
                    "Only JPEG, PNG or WebP photos are allowed"
                )
            );
            return;
        }

        callback(null, true);
    }
});

const tooLarge = MAX_PHOTO_BYTES / (1024 * 1024);

export const uploadComplaintPhotos = (req, res, next) => {
    upload.array("photos", MAX_PHOTOS)(req, res, (error) => {
        if (!error) {
            next();
            return;
        }

        if (error instanceof multer.MulterError) {
            const messages = {
                LIMIT_FILE_SIZE: `Each photo must be ${tooLarge} MB or smaller`,
                LIMIT_FILE_COUNT: `Attach at most ${MAX_PHOTOS} photos at a time`,
                LIMIT_UNEXPECTED_FILE: `Attach at most ${MAX_PHOTOS} photos at a time, in the photos field`
            };

            return res.status(400).json({
                success: false,
                message: messages[error.code] ?? "The upload could not be accepted"
            });
        }

        if (error.status === 400) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return next(error);
    });
};
