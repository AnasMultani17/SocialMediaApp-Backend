/** @format */

import mongoose, { isValidObjectId } from "mongoose";
import { playlist } from "../model/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createplaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user?._id;

  if (!name || !description) {
    throw new ApiError(400, "All details are required");
  }

  const playlist = await playlist.create({
    name,
    description,
    userId,
    owner: userId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist created successfully"));
});

const getUserplaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  const playlists = await playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    username: 1,
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$videos.views",
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
  ]);

  if (!playlists || playlists.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No playlists found for this user"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlists fetched successfully"));
});

const getplaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // Validate playlistId
  if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    username: 1,
                    _id: 1,
                  },
                },
              ],
            },
          },
          {
            $unwind: "$owner",
          },
        ],
      },
    },
    {
      $addFields: {
        totalViews: {
          $sum: "$videos.views",
        },
        totalVideos: {
          $size: "$videos",
        },
      },
    },
  ]);

  if (!playlist || playlist.length === 0) {
    throw new ApiError(404, "playlist not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "playlist fetched successfully"));
});

const addVideoToplaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId && !videoId) {
    throw new ApiError(404, "playlistId and videoId not found");
  }
  const playlist = await playlist
    .findByIdAndUpdate(
      playlistId,
      {
        $push: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    )
    .populate("videos")
    .populate("owner");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video added to playlist"));
});

const removeVideoFromplaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!playlistId && !videoId) {
    throw new ApiError(404, "playlistId and videoId not found");
  }
  const playlist = await playlist
    .findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          videos: videoId,
        },
      },
      {
        new: true,
      }
    )
    .populate("videos");

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "video removed from playlist"));
});

const deleteplaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!playlistId && !videoId) {
    throw new ApiError(404, "playlistId and videoId not found");
  }
  const playlist = await playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "playlist deleted successfully"));
});

const updateplaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!playlistId && !name && !description) {
    throw new ApiError(400, "Missing playlist or name or description");
  }
  const playlist = await playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        name: name,
        description: description,
      },
    },
    {
      new: true,
    }
  );
  playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Update playlist successFully"));
});

export {
  createplaylist,
  getUserplaylists,
  getplaylistById,
  addVideoToplaylist,
  removeVideoFromplaylist,
  deleteplaylist,
  updateplaylist,
};
