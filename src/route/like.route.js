/** @format */

import { Router } from "express";
import {
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
  getLikedVideos,
  checkIfVideoLiked,
  checkIfCommentLiked,
  checkIfTweetLiked,
  getVideoLikesCount,
  getCommentLikesCount,
  getTweetLikesCount,
} from "../controller/like.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();
router.use(verifyJWT); 

router.route("/toggle/v/:videoId").post(toggleVideoLike);
router.route("/toggle/c/:commentId").post(toggleCommentLike);
router.route("/toggle/t/:tweetId").post(toggleTweetLike);
router.route("/videos").get(getLikedVideos);

router.get("/check/v/:videoId", verifyJWT, checkIfVideoLiked)
router.get("/count/v/:videoId", getVideoLikesCount)
// Like routes
router.route("/check/v/:videoId").get(verifyJWT, checkIfVideoLiked);
router.route("/check/c/:commentId").get(verifyJWT, checkIfCommentLiked);
router.route("/check/t/:tweetId").get(verifyJWT, checkIfTweetLiked);

router.route("/count/v/:videoId").get(getVideoLikesCount);
router.route("/count/c/:commentId").get(getCommentLikesCount);
router.route("/count/t/:tweetId").get(getTweetLikesCount);
export default router;
