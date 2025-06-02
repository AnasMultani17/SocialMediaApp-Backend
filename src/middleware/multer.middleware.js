/** @format */

import multer from "multer";

// Store uploaded files in memory
const storage = multer.memoryStorage();

export const upload = multer({ storage });
