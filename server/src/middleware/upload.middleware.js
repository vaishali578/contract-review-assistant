import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

const uploadDir = path.join(process.cwd(), "uploads");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const uniqueName = `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    ".pdf": ["application/pdf"],
    ".docx": [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
    ".txt": ["text/plain"],
  };

  const extension = path.extname(file.originalname).toLowerCase();

  const isValid =
    allowedTypes[extension]?.includes(file.mimetype);

  if (!isValid) {
    return cb(
      new Error("Only PDF, DOCX and TXT files are allowed")
    );
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

export default upload;