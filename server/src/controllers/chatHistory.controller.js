import Contract from "../models/contract.model.js";
import ChatMessage from "../models/chatMessage.model.js";


export const getContractChatHistory = async (req, res) => {
  try {

    // Verify contract ownership
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

    // Fetch conversation history
    const messages = await ChatMessage.find({
      contractId: contract._id,
      userId: req.userId,
    })
      .sort({ createdAt: 1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      messages,
    });

  } catch (error) {

    console.error("Chat history error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch chat history",
    });
  }
};