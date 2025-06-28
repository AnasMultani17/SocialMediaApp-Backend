# Video Sharing Social Media App – Backend

## Overview

This is the **backend API** for the **Video Sharing Social Media App**, built with **Node.js, Express, and MongoDB** to support video publishing, user management, likes, comments, subscriptions, and watch history.

## Features

✅ User authentication and JWT-based authorization
✅ Video upload, management, and streaming support
✅ Likes, dislikes, and view count tracking
✅ Comments and comment moderation
✅ User subscriptions and channel management
✅ Watch history management
✅ Search, trending, and recommendation endpoints
✅ Scalable structure with controllers, models, and middlewares

## Tech Stack

* **Node.js + Express.js** – server and routing
* **MongoDB + Mongoose** – database
* **JWT** – authentication
* **Multer + Cloudinary** – for direct video and thumbnail uploads
* **Bcrypt** – password hashing
* **CORS** – cross-origin handling for frontend communication

## Project Structure

```
backend/
│
├── controllers/       # Route logic (user, video, auth, comment, subscription)
├── models/            # Mongoose schemas
├── routes/            # API route definitions
├── middlewares/       # Auth middlewares, error handlers
├── utils/             # Helper utilities (Cloudinary upload, etc.)
├── .env               # Environment variables
└── server.js          # Entry point
```

## Setup Instructions

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/video-social-app.git
cd video-social-app/backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create a `.env` file:**

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

4. **Run the server:**

```bash
npm run dev
```

Server will start on `http://localhost:5000`.

## API Endpoints Overview

* **Auth:** `/api/auth/register`, `/api/auth/login`
* **User:** `/api/users/:id`, `/api/users/sub/:id`
* **Video:** `/api/videos/`, `/api/videos/:id`
* **Comment:** `/api/comments/`
* **Search:** `/api/videos/search?q=`, `/api/videos/trending`

## Testing

Use **Postman** or **Thunder Client** for testing endpoints with JWT token headers.

## Future Improvements

✅ Rate limiting and request throttling
✅ Video transcoding for multiple resolutions
✅ Notifications and email support
✅ Analytics dashboard for creators

## License

This backend is provided for **educational and development purposes**.
You may extend it for your own projects.
