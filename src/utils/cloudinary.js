/** @format */

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (buffer, filename) => {
  return new Promise((resolve, reject) => {
    const publicId =
      typeof filename === "string" && filename.includes(".")
        ? filename.split(".")[0]
        : `upload_${Date.now()}`; // fallback id if filename invalid

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "youtube_video",
        public_id: publicId,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};
