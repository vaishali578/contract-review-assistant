import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
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

    chunkIndex: {
      type: Number,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },

    pageNumber: {
      type: Number,
      default: null,
    },

    section: {
      sectionNumber: String,
      sectionTitle: String,
    },

    embedding: {
      type: [Number],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

chunkSchema.index({
  userId: 1,
  contractId: 1,
  chunkIndex: 1,
});

const Chunk = mongoose.model("Chunk", chunkSchema);

export default Chunk;