import {
  retrieveRelevantChunks,
} from "../services/retrieval.service.js";


export const searchContractChunks = async (req, res) => {
  try {
    const { query } = req.body;

    const results = await retrieveRelevantChunks({
      query,
      userId: req.userId,
      contractId: req.params.id,
      limit: 8,
    });

    return res.status(200).json({
      success: true,
      results,
    });

  } catch (error) {

    console.error("Vector search error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to search contract",
    });
  }
};