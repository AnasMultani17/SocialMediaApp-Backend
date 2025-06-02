/** @format */

import { Router } from "express";
import {
  registerUser,
  loginUser,
  logOutUser, // ✅ was `logOutUser`
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails, // ✅ was `updateaccountDetails`
  updateUserAvatar,
  updateUsercoverimage,
  getUserChannelProfile,
  getWatchHistory, // ✅ was `getWatchhistory`
  addVideoToWatchHistory,
  clearWatchHistory,
  removeFromWatchHistory,
} from "../controller/user.controller.js";

import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

// Secured routes
router.route("/logout").post(verifyJWT, logOutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
  .route("/avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router
  .route("/coverimage")
  .patch(verifyJWT, upload.single("coverimage"), updateUsercoverimage);
router.route("/c/:username").get(verifyJWT, getUserChannelProfile);
router.route("/history").get(verifyJWT, getWatchHistory);
router.route("/addVideoToWatchHistory").post(verifyJWT, addVideoToWatchHistory);
router.route("/clear-history").delete(verifyJWT, clearWatchHistory);
router.route("/remove-from-history").delete(verifyJWT, removeFromWatchHistory);

export default router;
