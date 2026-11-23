import mongoose from "mongoose";

import Chunk from "../models/chunk.model.js";
import Contract from "../models/contract.model.js";

import {
  generateEmbeddings,
} from "./embedding.service.js";


export const retrieveRelevantChunks = async ({
  query,
  userId,
  contractId,
  limit = 8,
}) => {

  // Validate inputs
  if (!query?.trim()) {
    throw new Error("Search query is required");
  }

  if (!mongoose.Types.ObjectId.isValid(contractId)) {
    throw new Error("Invalid contract ID");
  }

  // Verify contract ownership
  const contractExists = await Contract.exists({
    _id: contractId,
    userId,
  });

  if (!contractExists) {
    const error = new Error("Contract not found");
    error.statusCode = 404;
    throw error;
  }

  // Step 1: Convert user question into embedding
  const [queryEmbedding] = await generateEmbeddings([
    query,
  ]);

  // Step 2: Search relevant chunks
  const results = await Chunk.aggregate([
    {
      $vectorSearch: {
        index: "contract_chunks_vector_index",

        path: "embedding",

        queryVector: queryEmbedding,

        numCandidates: Math.max(limit * 20, 100),

        limit,

        // Security filters
        filter: {
          userId,
          contractId: new mongoose.Types.ObjectId(contractId),
        },
      },
    },

    {
      $project: {
        text: 1,
        pageNumber: 1,
        section: 1,
        chunkIndex: 1,

        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  return results;
};