/** @format */

import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  getSubscribedChannels,
  getUserChannelSubscribers,
  toggleSubscription,
  checkIfSubscribed 
} from "../controller/subscription.controller.js";

const router = new Router();
router.use(verifyJWT);

router
  .route("/c/:channelId")
  .get(getSubscribedChannels)
  .post(toggleSubscription);
router.route("/u/:subscriptionId").get(getUserChannelSubscribers);


router.get("/check/:channelId", verifyJWT, checkIfSubscribed)

export default router;
