/** @format */

import multer from "multer";

// Store files in memory (RAM)
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, 
  },
});
