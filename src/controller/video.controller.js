/** @format */

import mongoose from "mongoose";
import { Video } from "../model/video.model.js";
import { User } from "../model/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

/**
 * GET /videos
 */
const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
    published,
    username,
  } = req.query;

  const sortOptions = { [sortBy]: sortType === "asc" ? 1 : -1 };
  const matchConditions = {};

  if (query) {
    matchConditions.title = new RegExp(query, "i");
  }

  if (published !== undefined) {
    matchConditions.isPublished = published === "true";
  }

  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    matchConditions.owner = new mongoose.Types.ObjectId(userId);
  }

  const pipeline = [
    { $match: matchConditions },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },
  ];

  if (username) {
    pipeline.push({
      $match: { "ownerDetails.username": username },
    });
  }

  pipeline.push(
    { $addFields: { owner: "$ownerDetails" } },
    { $project: { ownerDetails: 0 } },
    { $sort: sortOptions }
  );

  const result = await Video.aggregatePaginate(pipeline, {
    page: parseInt(page),
    limit: parseInt(limit),
  });

  res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

/**
 * POST /videos/publish
 */
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  const videoBuffer = req.files?.videoFile?.[0];
  const thumbnailBuffer = req.files?.thumbnail?.[0];

  if (!videoBuffer || !videoBuffer.buffer) {
    throw new ApiError(400, "Video file not found");
  }
  if (!thumbnailBuffer || !thumbnailBuffer.buffer) {
    throw new ApiError(400, "Thumbnail file not found");
  }
  if (!title || !description) {
    throw new ApiError(400, "Title and Description are required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoBuffer.buffer, {
    resource_type: "video",
  });
  const uploadedThumbnail = await uploadOnCloudinary(thumbnailBuffer.buffer);

  if (!uploadedVideo?.url || !uploadedThumbnail?.url) {
    throw new ApiError(500, "Error uploading files to Cloudinary");
  }

  const newVideo = await Video.create({
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    title,
    description,
    duration: uploadedVideo.duration,
    owner: req.user?._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video uploaded successfully"));
});

/**
 * GET /videos/:videoId
 */
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: { path: "$owner", preserveNullAndEmptyArrays: true },
    },
  ]);

  if (!video.length) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

/**
 * PATCH /videos/:videoId
 */
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const { title, description } = req.body;
  const thumbnailFile = req.file;

  if (!title && !description && !thumbnailFile) {
    throw new ApiError(400, "No fields provided for update");
  }

  const updateFields = {};
  if (title) updateFields.title = title;
  if (description) updateFields.description = description;

  if (thumbnailFile && thumbnailFile.buffer) {
    const uploadedThumb = await uploadOnCloudinary(thumbnailFile.buffer);
    if (!uploadedThumb?.url) {
      throw new ApiError(500, "Thumbnail upload failed");
    }
    updateFields.thumbnail = uploadedThumb.url;
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateFields },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

/**
 * DELETE /videos/:videoId
 */
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const userId = req.user._id;

  // Fetch the video first
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  // Check if the logged-in user is the owner
  if (!video.owner.equals(userId)) {
    throw new ApiError(403, "Invalid Access"); // use 403 (Forbidden), not 404
  }

  // Delete the video
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});


/**
 * PATCH /videos/:videoId/toggle
 */
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status updated"));
});

/**
 * PATCH /videos/:videoId/view
 */
const viewUpdate = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "View count incremented"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  viewUpdate,
};
