import mongoose from "mongoose";

import Chunk from "../models/chunk.model.js";
import Contract from "../models/contract.model.js";

import {
  generateEmbeddings,
} from "./embedding.service.js";

import {
  REVIEW_CHECKLIST,
} from "../config/reviewChecklist.js";


export const retrieveChecklistEvidence = async ({
  userId,
  contractId,
}) => {

  // Step 1: Verify contract ownership
  const contract = await Contract.exists({
    _id: contractId,
    userId,
  });

  if (!contract) {
    const error = new Error("Contract not found");
    error.statusCode = 404;
    throw error;
  }

  // Step 2: Prepare all 8 search queries
  const queries = REVIEW_CHECKLIST.map(
    (item) => item.searchQuery
  );

  // Step 3: Generate all query embeddings in batch
  const queryEmbeddings = await generateEmbeddings(
    queries
  );

  // Step 4: Search relevant chunks for each checklist item
  const evidenceEntries = await Promise.all(
    REVIEW_CHECKLIST.map(async (item, index) => {

      const results = await Chunk.aggregate([
        {
          $vectorSearch: {
            index: "contract_chunks_vector_index",

            path: "embedding",

            queryVector: queryEmbeddings[index],

            numCandidates: 100,

            limit: 6,

            filter: {
              userId,
              contractId: new mongoose.Types.ObjectId(
                contractId
              ),
            },
          },
        },

        {
          $project: {
            text: 1,
            chunkIndex: 1,
            pageNumber: 1,
            section: 1,
            score: {
              $meta: "vectorSearchScore",
            },
          },
        },
      ]);

      return [item.key, results];
    })
  );

  return Object.fromEntries(evidenceEntries);
};