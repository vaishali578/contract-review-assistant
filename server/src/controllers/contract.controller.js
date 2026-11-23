import Contract from "../models/contract.model.js";
import fs from "fs/promises";
import path from "path";

// Upload contract
export const uploadContract = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a contract",
      });
    }

    const contract = await Contract.create({
      userId: req.userId,
      fileName: req.file.originalname,
      filePath: path.posix.join("uploads", req.file.filename),
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: "processing",
    });

    return res.status(201).json({
      success: true,
      message: "Contract uploaded successfully",
      contract,
    });
  } catch (error) {
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }

    return res.status(500).json({
      success: false,
      message: "Contract upload failed",
    });
  }
};


// Get all user's contracts
export const getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      contracts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch contracts",
    });
  }
};


// Delete contract
export const deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    const filePath = path.resolve(
      process.cwd(),
      contract.filePath
    );

    await Contract.deleteOne({ _id: contract._id });

    await fs.unlink(filePath).catch((error) => {
      if (error.code !== "ENOENT") {
        console.error("File deletion failed:", error);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Contract deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete contract",
    });
  }
};