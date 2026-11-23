import Review from "../models/review.model.js";

export const getContractReview = async (req, res) => {
  try {

    const review = await Review.findOne({
      contractId: req.params.id,
      userId: req.userId,
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    return res.status(200).json({
      success: true,
      review,
    });

  } catch (error) {

    console.error("Fetch review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch review",
    });
  }
};