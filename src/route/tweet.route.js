/** @format */

import { Router } from "express";
import {
  createTweet,
  getUserTweets,
  updateTweet,
  deleteTweet,
} from "../controller/tweet.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { get } from "mongoose";

const router = new Router();
router.use(verifyJWT);

router.route("/").post(createTweet);
// router.route('/user-tweets').post(getUserTweets)
router.route("/user/:userId").get(getUserTweets);
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet);
export default router;
