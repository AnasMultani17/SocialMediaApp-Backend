/** @format */

import { Router } from "express";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishAVideo,
  updateVideo,
  togglePublishStatus,
  viewUpdate,
} from "../controller/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Apply JWT verification to all routes below
router.use(verifyJWT);

// POST new video with videoFile and thumbnail (both required)
router.route("/").post(
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  publishAVideo
);

// GET all videos (with optional filters)
router.route("/").get(getAllVideos);

// GET single video by ID, PATCH to increment views
router.route("/v/:videoId").get(getVideoById).patch(viewUpdate);

// PATCH update video info and/or thumbnail (thumbnail optional)
router.route("/uv/:videoId").patch(
  // Use single file upload for "thumbnail" field if updating thumbnail
  upload.single("thumbnail"),
  updateVideo
);

// DELETE a video by ID
router.route("/uv/:videoId").delete(deleteVideo);

// PATCH toggle publish status of a video
router.route("/uv/:videoId/toggle-publish").patch(togglePublishStatus);

export default router;
