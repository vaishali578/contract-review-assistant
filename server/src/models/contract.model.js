import mongoose from "mongoose";

const contractSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true,
        },

        fileName: {
            type: String,
            required: true,
        },

        filePath: {
            type: String,
            required: true,
        },

        fileSize: {
            type: Number,
            required: true,
        },

        mimeType: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["processing", "reviewed", "failed"],
            default: "processing",
        },

        processingError: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const Contract = mongoose.model("Contract", contractSchema);

export default Contract;