import express from "express";

import requireUser from "../middleware/requireUser.js";
import upload from "../middleware/upload.middleware.js";

import {
  uploadContract,
  getContracts,
  deleteContract,
} from "../controllers/contract.controller.js";
import {
  searchContractChunks,
} from "../controllers/search.controller.js";
import {
  runContractReview,
} from "../services/review.service.js";
import {
  getContractReview,
} from "../controllers/review.controller.js";

const router = express.Router();

// Upload contract
router.post(
  "/",
  requireUser,
  upload.single("contract"),
  uploadContract
);

// Get user's contracts
router.get(
  "/",
  requireUser,
  getContracts
);

// Delete contract
router.delete(
  "/:id",
  requireUser,
  deleteContract
);

router.post(
  "/:id/search",
  requireUser,
  searchContractChunks
);

router.get(
  "/:id/review",
  requireUser,
  getContractReview
);

export default router;