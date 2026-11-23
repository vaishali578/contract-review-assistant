import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        contractId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contract",
            required: true,
            index: true,
        },

        role: {
            type: String,
            enum: ["user", "assistant"],
            required: true,
        },

        content: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "answered",
                "not_found",
                "unclear",
                "error",
                null,
            ],
            default: null,
        },

        quote: {
            type: String,
            default: "",
        },

        sourceChunkId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chunk",
            default: null,
        },

        sourceChunkIndex: {
            type: Number,
            default: null,
        },

        pageNumber: {
            type: Number,
            default: null,
        },

        section: {
            sectionNumber: String,
            sectionTitle: String,
        },
        fullClause: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

chatMessageSchema.index({
    userId: 1,
    contractId: 1,
    createdAt: 1,
});

const ChatMessage = mongoose.model(
    "ChatMessage",
    chatMessageSchema
);

export default ChatMessage;