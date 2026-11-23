import Contract from "../models/contract.model.js";
import Review from "../models/review.model.js";

import {
  retrieveChecklistEvidence,
} from "./reviewRetrieval.service.js";

import {
  generateContractReview,
} from "./aiReview.service.js";

import {
  verifyReviewFindings,
} from "./quoteVerification.service.js";

import {
  REVIEW_CHECKLIST,
} from "../config/reviewChecklist.js";


export const runContractReview = async (contract) => {

  // Step 1: Retrieve relevant contract evidence
  const evidenceByKey = await retrieveChecklistEvidence({
    userId: contract.userId,
    contractId: contract._id,
  });

  // Step 2: Check contract still exists
  const contractExists = await Contract.exists({
    _id: contract._id,
    userId: contract.userId,
  });

  if (!contractExists) {
    return null;
  }

  // Step 3: Send evidence to AI
  const aiResult = await generateContractReview(
    evidenceByKey
  );

  // Step 4: Verify every AI finding
  const verifiedItems = verifyReviewFindings(
    aiResult.items,
    evidenceByKey,
    REVIEW_CHECKLIST
  );

  // Step 5: Save review in MongoDB
  const review = await Review.findOneAndUpdate(
    {
      contractId: contract._id,
      userId: contract.userId,
    },
    {
      $set: {
        items: verifiedItems,
        model: aiResult.model,
        reviewedAt: new Date(),
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  // Step 6: Update contract status
  await Contract.updateOne(
    {
      _id: contract._id,
      userId: contract.userId,
    },
    {
      $set: {
        status: "reviewed",
        processingError: null,
      },
    }
  );

  console.log("Contract review completed successfully");

  return review;
};