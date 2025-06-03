/** @format */

// Import core dependencies
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config(); // loads from .env by default
// Initialize express app
const app = express();

// Middleware to parse cookies
app.use(cookieParser());



// ✅ Setup CORS for frontend origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://new-social-media-app-frontned.vercel.app"
  );
  // You can also add other CORS headers like:
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});
app.use(
  express.json({
    limit: "16kb", // limit the request body size
  })
);

// Middleware to parse URL-encoded data (form data)
app.use(
  express.urlencoded({
    extended: true, // allows nested objects in URL-encoded data
    limit: "16kb",
  })
);

// Serve static files from the 'public' folder
app.use(express.static("public"));

// Routes
import userRouter from "./route/user.route.js";
import videoRouter from "./route/video.route.js";
import tweetRouter from "./route/tweet.route.js";
import subRouter from "./route/subscription.route.js";
import playlistRouter from "./route/playlist.route.js";
import likeRouter from "./route/like.route.js";
import healthcheckRouter from "./route/healthcheck.route.js";
import dashboardRouter from "./route/dashboard.route.js";
import commentRouter from "./route/comment.route.js";

// Mount user routes under /api/v1/users
app.use("/api/v1/users", userRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscribe", subRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/dashboard", dashboardRouter);
// Global error handler middleware
app.use((err, req, res, next) => {
  console.error("ERROR:", err); // Log error details in the server console

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
    // Only expose stack trace in development
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// Export the app for use in server.js or for testing
export { app };
