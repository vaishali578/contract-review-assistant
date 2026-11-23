import mongoose from "mongoose";

import Chunk from "../models/chunk.model.js";
import Contract from "../models/contract.model.js";

import {
  generateEmbeddings,
} from "./embedding.service.js";

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const STOP_WORDS = new Set([
  "about", "and", "are", "can", "does", "for", "from", "have",
  "how", "not", "our", "the", "that", "there", "they", "this",
  "was", "what", "when", "where", "which", "who", "why", "with",
  "would", "you", "your",
]);

const retrieveLexicalChunks = async ({
  query,
  userId,
  contractId,
  limit,
}) => {
  const terms = [...new Set(
    query.toLowerCase().match(/[a-z0-9]{3,}/g) || []
  )]
    .filter((term) => !STOP_WORDS.has(term))
    .slice(0, 12);

  if (terms.length === 0) return [];

  const chunks = await Chunk.find({
    userId,
    contractId,
    $or: terms.map((term) => ({
      text: { $regex: escapeRegex(term), $options: "i" },
    })),
  })
    .select("text pageNumber section chunkIndex")
    .sort({ chunkIndex: 1 })
    .limit(200)
    .lean();

  return chunks
    .map((chunk) => ({
      chunk,
      matchCount: terms.reduce(
        (count, term) =>
          count + Number(chunk.text.toLowerCase().includes(term)),
        0
      ),
    }))
    .sort((a, b) =>
      b.matchCount - a.matchCount ||
      a.chunk.chunkIndex - b.chunk.chunkIndex
    )
    .slice(0, limit)
    .map(({ chunk }) => chunk);
};

export const retrieveRelevantChunks = async ({
  query,
  userId,
  contractId,
  limit = 8,
}) => {

  // Validate inputs
  if (typeof query !== "string" || !query.trim()) {
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

  const contractObjectId = new mongoose.Types.ObjectId(contractId);

  try {
    // Step 1: Convert user question into an embedding
    const [queryEmbedding] = await generateEmbeddings([query]);
    if (!queryEmbedding) {
      throw new Error("Embedding service returned no query vector");
    }

    // Step 2: Search relevant chunks using the contract- and user-scoped index
    return await Chunk.aggregate([
      {
        $vectorSearch: {
          index: "contract_chunks_vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: Math.max(limit * 20, 100),
          limit,
          filter: {
            userId,
            contractId: contractObjectId,
          },
        },
      },
      {
        $project: {
          text: 1,
          pageNumber: 1,
          section: 1,
          chunkIndex: 1,
          score: { $meta: "vectorSearchScore" },
        },
      },
    ]);
  } catch (error) {
    console.warn(
      "Vector retrieval unavailable; falling back to contract text search:",
      error.message
    );
    return retrieveLexicalChunks({
      query,
      userId,
      contractId: contractObjectId,
      limit,
    });
  }

};