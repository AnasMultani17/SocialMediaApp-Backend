/** @format */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/user.model.js";
import { Subscription } from "../model/subscription.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccesssAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = async (req, res) => {
  try {
    const { avatar, coverimage } = req.files;

    const avatarUpload = avatar
      ? await uploadOnCloudinary(avatar[0].buffer, avatar[0].originalname)
      : null;

    const coverUpload = coverimage
      ? await uploadOnCloudinary(
          coverimage[0].buffer,
          coverimage[0].originalname
        )
      : null;

    const user = await User.create({
      ...req.body,
      avatar: avatarUpload?.secure_url || null,
      coverimage: coverUpload?.secure_url || null,
    });

    res.status(201).json(user);
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "username or email required");
  }
  if (!password) {
    throw new ApiError(400, "Password required");
  }
  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const passCheck = await user.isPasswordCorrect(password);
  if (!passCheck) {
    throw new ApiError(401, "Wrong Password");
  }
  const { accessToken, refreshToken } = await generateAccesssAndRefreshTokens(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request ");
  }
  const decoded = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  const user = await User.findById(decoded._id);
  if (!user) {
    throw new ApiError(401, "Unauthorized Access");
  }
  if (incomingRefreshToken != user?.refreshToken) {
    throw new ApiError(401, "Refresh token is expired or used");
  }
  const options = { httpOnly: true, secure: true };
  const { accessToken, newrefreshToken } =
    await generateAccesssAndRefreshTokens(user._id);
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newrefreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken: accessToken, refreshToken: newrefreshToken },
        "Acces Token Refreshed successfully"
      )
    );
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  if (newPassword != confirmPassword) {
    throw new ApiError(400, "Password and confirm password is not matching");
  }
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is incorrect");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email } },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account detailed updated successfully"));
});

const updateUserAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await uploadOnCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    await User.findByIdAndUpdate(req.user._id, { avatar: result.secure_url });

    res.status(200).json({ message: "Avatar updated", url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: "Failed to update avatar" });
  }
};

const updateUsercoverimage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const result = await uploadOnCloudinary(
      req.file.buffer,
      req.file.originalname
    );

    await User.findByIdAndUpdate(req.user._id, {
      coverimage: result.secure_url,
    });

    res
      .status(200)
      .json({ message: "Cover image updated", url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: "Failed to update cover image" });
  }
};

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "Username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverimage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "Channel does not exist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const userId = req.user._id;
  const userData = await User.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: "videos",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchhistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { fullname: 1, username: 1, avatar: 1 } }],
            },
          },
          { $addFields: { owner: { $arrayElemAt: ["$owner", 0] } } },
        ],
      },
    },
    { $project: { watchhistory: 1, _id: 0 } },
  ]);
  if (!userData.length) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json(userData[0].watchhistory);
});

const addVideoToWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;
  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }
  const videoObjectId = new mongoose.Types.ObjectId(videoId);
  const user = await User.findById(req.user._id);
  const isVideoAlreadyInHistory = user.watchhistory.some((id) =>
    id.equals(videoObjectId)
  );
  if (!isVideoAlreadyInHistory) {
    user.watchhistory.unshift(videoObjectId);
    await user.save({ validateBeforeSave: false });
  }
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Watch history updated"));
});
const clearWatchHistory = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { watchhistory: [] } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Watch history cleared successfully"));
});

const removeFromWatchHistory = asyncHandler(async (req, res) => {
  const { videoId } = req.body;

  if (!videoId) {
    throw new ApiError(400, "Video ID is required");
  }

  await User.findByIdAndUpdate(
    req.user._id,
    { $pull: { watchhistory: new mongoose.Types.ObjectId(videoId) } },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video removed from watch history"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUsercoverimage,
  getUserChannelProfile,
  getWatchHistory,
  addVideoToWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory,
};
