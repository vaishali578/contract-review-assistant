import mongoose from "mongoose";

const reviewItemSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
        },

        label: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["found", "not_found", "unclear"],
            required: true,
        },

        summary: {
            type: String,
            required: true,
        },

        quote: {
            type: String,
            default: "",
        },

        fullClause: {
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
    },
    {
        _id: false,
    }
);


const reviewSchema = new mongoose.Schema(
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
        },

        items: {
            type: [reviewItemSchema],
            required: true,
        },

        model: {
            type: String,
            required: true,
        },

        reviewedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);


reviewSchema.index(
    {
        userId: 1,
        contractId: 1,
    },
    {
        unique: true,
    }
);


const Review = mongoose.model("Review", reviewSchema);

export default Review;