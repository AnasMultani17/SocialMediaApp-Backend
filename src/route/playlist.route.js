/** @format */

import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  addVideoToplaylist,
  createplaylist,
  deleteplaylist,
  getplaylistById,
  getUserplaylists,
  removeVideoFromplaylist,
  updateplaylist,
} from "../controller/playlist.controller.js";

const router = new Router();
router.use(verifyJWT);

router.route("/").post(createplaylist);

router
  .route("/:playlistId")
  .get(getplaylistById)
  .patch(updateplaylist)
  .delete(deleteplaylist);

router.route("/add/:videoId/:playlistId").patch(addVideoToplaylist);
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromplaylist);

router.route("/user/:userId").get(getUserplaylists);

export default router;
