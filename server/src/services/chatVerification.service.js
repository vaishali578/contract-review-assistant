const normalizeText = (text) =>
  text.replace(/\s+/g, " ").trim();


export const verifyChatAnswer = (aiResult, evidence) => {

  const allowedStatuses = [
    "answered",
    "not_found",
    "unclear",
  ];

  if (!Array.isArray(evidence) || evidence.length === 0) {
    return {
      status: "unclear",
      answer: "There was not enough contract text to verify an answer.",
      quote: "",
    };
  }

  if (!aiResult || !allowedStatuses.includes(aiResult.status)) {
    return {
      status: "unclear",
      answer: "I could not verify the answer from the contract.",
      quote: "",
    };
  }

  // Contract evidence could not answer the question
  if (aiResult.status === "not_found") {
    return {
      status: "not_found",
      answer: "I couldn't find this information in the contract.",
      quote: "",
    };
  }

  // Ambiguous evidence
  if (aiResult.status === "unclear") {
    return {
      status: "unclear",
      answer:
        "The available contract text is ambiguous. I cannot confirm the answer.",
      quote: "",
    };
  }

  // Find the exact source chunk
  const quote = typeof aiResult.quote === "string"
    ? aiResult.quote.trim()
    : "";
  let sourceChunk = evidence.find(
    (chunk) =>
      Number.isInteger(aiResult.sourceChunkIndex) &&
      chunk.chunkIndex === aiResult.sourceChunkIndex
  );

  if (!sourceChunk && quote) {
    const normalizedQuote = normalizeText(quote);
    sourceChunk = evidence.find((chunk) =>
      normalizeText(chunk.text).includes(normalizedQuote)
    );
  }

  if (
    !sourceChunk ||
    !quote ||
    typeof aiResult.answer !== "string" ||
    !aiResult.answer.trim()
  ) {
    return {
      status: "unclear",
      answer: "The quoted clause could not be verified.",
      quote: "",
    };
  }

  // Verify exact quotation
  const quoteExists = normalizeText(
    sourceChunk.text
  ).includes(
    normalizeText(quote)
  );

  if (!quoteExists) {
    return {
      status: "unclear",
      answer: "The quoted clause could not be verified.",
      quote: "",
    };
  }

  return {
    status: "answered",

    answer: aiResult.answer.trim(),

    quote,

    fullClause: sourceChunk.text,

    sourceChunkId: sourceChunk._id,

    sourceChunkIndex: sourceChunk.chunkIndex,

    pageNumber: sourceChunk.pageNumber ?? null,

    section: sourceChunk.section || null,
  };
};