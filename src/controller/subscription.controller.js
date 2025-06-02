/** @format */

import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../model/user.model.js";
import { Subscription } from "../model/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const userId = req.user?._id;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }
  if (!mongoose.Types.ObjectId.isValid(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Channel Unsubscribed"));
  } else {
    const newSub = await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, newSub, "Channel Subscribed"));
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscribers = await Subscription.find({
    channel: subscriptionId,
  }).populate("subscriber");

  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribers, "Subscribers fetched successfully")
    );
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  console.log(channelId);
  const subscribedChannels = await Subscription.find({
    subscriber: channelId,
  }).populate("channel");

  if (subscribedChannels.length === 0) {
    throw new ApiError(400, "you didnt subscribed any channel");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribedChannels,
        "Subscribed channels fetched successfully"
      )
    );
});
// Add this function to your existing subscription controller file
const checkIfSubscribed = async (req, res) => {
  try {
    const { channelId } = req.params
    const userId = req.user._id

    const subscription = await Subscription.findOne({
      subscriber: userId,
      channel: channelId,
    })

    res.status(200).json({
      success: true,
      data: { isSubscribed: !!subscription }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error checking subscription status"
    })
  }
}

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels ,checkIfSubscribed};
