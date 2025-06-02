/** @format */

import connectdb from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";

dotenv.config(); // loads from .env by default

const PORT = process.env.PORT || 5000;

connectdb()
  .then(() => {
    app.on("error", (error) => {
      console.error("App encountered an error:", error);
    });
    app.listen(PORT, () => {
      console.log(`App is listening now on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Optional: handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
