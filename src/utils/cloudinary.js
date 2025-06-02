/** @format */

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // Upload to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder: "youtube_video",
      use_filename: true,
      unique_filename: false,
      access_mode: "public",
    });

    // Remove local file
    fs.existsSync(localFilePath) && fs.unlinkSync(localFilePath);

    return response;
  } catch (err) {
    // Attempt cleanup on error
    fs.existsSync(localFilePath) && fs.unlinkSync(localFilePath);
    console.error("Cloudinary Upload Error:", err);
    return null;
  }
};

export { uploadOnCloudinary };
