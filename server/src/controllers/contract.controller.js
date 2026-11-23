import Contract from "../models/contract.model.js";
import Chunk from "../models/chunk.model.js";

import fs from "fs/promises";
import path from "path";

import {
    extractDocumentText,
} from "../services/document.service.js";

import {
    createChunks,
} from "../services/chunking.service.js";

import {
    generateEmbeddings,
    EMBEDDING_MODEL,
} from "../services/embedding.service.js";

import Review from "../models/review.model.js";

import ChatMessage from "../models/chatMessage.model.js";
import Review from "../models/review.model.js";

// Background contract processing
const processContract = async (contract) => {
    try {
        const absolutePath = path.resolve(
            process.cwd(),
            contract.filePath
        );

        // Step 1: Extract document text
        const pages = await extractDocumentText(
            absolutePath,
            contract.mimeType
        );

        // Check whether document contains readable text
        const hasText = pages.some(
            (page) => page.text?.trim()
        );

        if (!hasText) {
            throw new Error("No readable text found");
        }

        // Step 2: Create chunks
        const chunks = createChunks(pages);

        if (chunks.length === 0) {
            throw new Error("No chunks generated");
        }

        // Step 3: Check whether contract still exists
        const contractExists = await Contract.exists({
            _id: contract._id,
            userId: contract.userId,
        });

        if (!contractExists) {
            return;
        }

        // Step 4: Extract text from all chunks
        const texts = chunks.map((chunk) => chunk.text);

        // Step 5: Generate embeddings using OpenRouter
        const embeddings = await generateEmbeddings(texts);

        // Validate embedding count
        if (embeddings.length !== chunks.length) {
            throw new Error(
                "Embedding count does not match chunk count"
            );
        }

        // Step 6: Prepare MongoDB documents
        const documents = chunks.map((chunk, index) => ({
            ...chunk,

            userId: contract.userId,
            contractId: contract._id,

            embedding: embeddings[index],
            embeddingModel: EMBEDDING_MODEL,
        }));

        // Step 7: Save chunks with embeddings
        await Chunk.insertMany(documents);

        // Step 8: Run AI contract review
        await runContractReview(contract);

        // Check if contract was deleted during processing
        const stillExists = await Contract.exists({
            _id: contract._id,
            userId: contract.userId,
        });

        if (!stillExists) {
            await Chunk.deleteMany({
                contractId: contract._id,
                userId: contract.userId,
            });

            return;
        }

        console.log(
            `Contract processed successfully:
      ${chunks.length} chunks created
      ${embeddings.length} embeddings generated`
        );

    } catch (error) {

        console.error("Contract processing failed:", error);

        // Clean up any partially saved chunks
        await Chunk.deleteMany({
            contractId: contract._id,
            userId: contract.userId,
        }).catch((dbError) => {
            console.error("Chunk cleanup failed:", dbError);
        });

        // Mark contract as failed
        await Contract.updateOne(
            {
                _id: contract._id,
                userId: contract.userId,
            },
            {
                $set: {
                    status: "failed",
                },
            }
        ).catch((dbError) => {
            console.error(
                "Failed to update contract status:",
                dbError
            );
        });
    }
};


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
            filePath: path.posix.join(
                "uploads",
                req.file.filename
            ),
            fileSize: req.file.size,
            mimeType: req.file.mimetype,
            status: "processing",
        });

        // Start background processing
        setImmediate(() => {
            processContract(contract);
        });

        return res.status(201).json({
            success: true,
            message: "Contract uploaded successfully",
            contract: {
                _id: contract._id,
                fileName: contract.fileName,
                fileSize: contract.fileSize,
                status: contract.status,
                createdAt: contract.createdAt,
            },
        });

    } catch (error) {
        console.error("Upload error:", error);

        if (req.file) {
            await fs.unlink(req.file.path).catch(() => { });
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
        })
            .select("-filePath")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            contracts,
        });

    } catch (error) {
        console.error("Fetch contracts error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch contracts",
        });
    }
};


// Delete contract

export const deleteContract = async (req, res) => {
    try {
        // Find contract belonging to the logged-in user
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

        // Get uploaded file path
        const filePath = path.resolve(
            process.cwd(),
            contract.filePath
        );

        // Delete all associated data
        await Promise.all([
            Chunk.deleteMany({
                contractId: contract._id,
                userId: req.userId,
            }),

            Review.deleteOne({
                contractId: contract._id,
                userId: req.userId,
            }),

            ChatMessage.deleteMany({
                contractId: contract._id,
                userId: req.userId,
            }),
        ]);

        // Delete contract document
        await Contract.deleteOne({
            _id: contract._id,
            userId: req.userId,
        });

        // Delete uploaded file
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
        console.error("Delete contract error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete contract",
        });
    }
};
