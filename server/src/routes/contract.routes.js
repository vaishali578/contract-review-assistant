import express from "express";

import requireUser from "../middleware/requireUser.js";
import upload from "../middleware/upload.middleware.js";

import {
  uploadContract,
  getContracts,
  deleteContract,
} from "../controllers/contract.controller.js";

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

export default router;