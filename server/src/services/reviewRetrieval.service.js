import mongoose from "mongoose";

import Chunk from "../models/chunk.model.js";
import Contract from "../models/contract.model.js";

import {
  generateEmbeddings,
} from "./embedding.service.js";

import {
  REVIEW_CHECKLIST,
} from "../config/reviewChecklist.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const retrieveChecklistEvidence = async ({
  userId,
  contractId,
}) => {
  // Step 1: Validate contract ID
  if (!mongoose.Types.ObjectId.isValid(contractId)) {
    throw new Error("Invalid contract ID");
  }

  // Step 2: Verify contract ownership
  const contract = await Contract.exists({
    _id: contractId,
    userId,
  });

  if (!contract) {
    const error = new Error("Contract not found");
    error.statusCode = 404;
    throw error;
  }

  // Step 3: Check that the contract has extracted text
  const totalChunks = await Chunk.countDocuments({
    userId,
    contractId: new mongoose.Types.ObjectId(contractId),
  });

  if (totalChunks === 0) {
    throw new Error("No extracted contract text is available for review");
  }

  // Step 4: Prepare all checklist search queries
  const queries = REVIEW_CHECKLIST.map(
    (item) => item.searchQuery
  );

  let queryEmbeddings = [];
  try {
    queryEmbeddings = await generateEmbeddings(queries);
    if (queryEmbeddings.length !== REVIEW_CHECKLIST.length) {
      throw new Error("Query embedding count mismatch");
    }
  } catch (error) {
    console.warn(
      "Checklist vector search unavailable; using text search:",
      error.message
    );
  }

  // Step 5: Search relevant chunks for each checklist item
  const evidenceEntries = await Promise.all(
    REVIEW_CHECKLIST.map(async (item, index) => {
      let results = [];
      if (queryEmbeddings[index]) {
        try {
          results = await Chunk.aggregate([
            {
              $vectorSearch: {
                index: "contract_chunks_vector_index",
                path: "embedding",
                queryVector: queryEmbeddings[index],
                numCandidates: 100,
                limit: 6,
                filter: {
                  userId,
                  contractId: new mongoose.Types.ObjectId(contractId),
                },
              },
            },
            {
              $project: {
                text: 1,
                chunkIndex: 1,
                pageNumber: 1,
                section: 1,
                score: { $meta: "vectorSearchScore" },
              },
            },
          ]);
        } catch (error) {
          console.warn(
            `Vector search unavailable for ${item.key}; using text search:`,
            error.message
          );
        }
      }

      const terms = item.fallbackTerms || [item.label];
      const fallbackChunks = await Chunk.find({
        userId,
        contractId: new mongoose.Types.ObjectId(contractId),
        $or: terms.map((term) => ({
          text: { $regex: escapeRegex(term), $options: "i" },
        })),
      })
        .select("text chunkIndex pageNumber section")
        .sort({ chunkIndex: 1 })
        .limit(6)
        .lean();

      const mergedResults = [...results];
      const seenChunkIndexes = new Set(
        results.map((chunk) => chunk.chunkIndex)
      );

      for (const chunk of fallbackChunks) {
        if (!seenChunkIndexes.has(chunk.chunkIndex)) {
          mergedResults.push(chunk);
          seenChunkIndexes.add(chunk.chunkIndex);
        }
        if (mergedResults.length >= 12) break;
      }

      // Debug logs
      console.log(
        `Checklist: ${item.key} | Retrieved chunks: ${mergedResults.length}`
      );

      if (mergedResults.length === 0) {
        console.warn(`No evidence found for: ${item.key}`);
      }

      return [item.key, mergedResults];
    })
  );

  const evidence = Object.fromEntries(evidenceEntries);

  return evidence;
};
