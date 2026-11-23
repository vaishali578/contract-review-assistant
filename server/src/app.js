import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";

import {
  clerkMiddleware,
  getAuth,
} from "@clerk/express";

const app = express();

// Clerk checks session tokens on incoming requests
app.use(
  clerkMiddleware({
    authorizedParties: ["http://localhost:5173"],
  })
);

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  })
);

app.use(express.json());

// Protected route
app.get("/api/auth/me", (req, res) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  return res.status(200).json({
    success: true,
    userId,
    message: "Authenticated successfully",
  });
});

export default app;