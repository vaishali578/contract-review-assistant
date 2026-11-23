import { getAuth } from "@clerk/express";

const requireUser = (req, res, next) => {
  const { isAuthenticated, userId } = getAuth(req);

  if (!isAuthenticated || !userId) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  // Trusted ID from verified Clerk session
  req.userId = userId;

  next();
};

export default requireUser;