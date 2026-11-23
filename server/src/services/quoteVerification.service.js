const normalizeWhitespace = (text) => {
    return text.replace(/\s+/g, " ").trim();
};


export const verifyReviewFindings = (
    aiItems,
    evidenceByKey,
    checklist
) => {

    const verifiedItems = checklist.map((checklistItem) => {

        const aiItem = aiItems.find(
            (item) => item.key === checklistItem.key
        );

        // AI missed this checklist item
        if (!aiItem) {
            return {
                key: checklistItem.key,
                label: checklistItem.label,
                status: "unclear",
                summary: "The review could not determine this item.",
                quote: "",
                fullClause: "",
            };
        }

        // Handle not found
        if (aiItem.status === "not_found") {
            return {
                key: checklistItem.key,
                label: checklistItem.label,
                status: "not_found",
                summary: "Not found in the contract.",
                quote: "",
                fullClause: "",
            };
        }

        // Find source chunk provided to AI
        const sourceIndex = Number.isInteger(
            aiItem.sourceChunkIndex
        )
            ? aiItem.sourceChunkIndex
            : -1;

        const candidates = evidenceByKey[checklistItem.key] || [];

        const sourceChunk = candidates.find(
            (chunk) => chunk.chunkIndex === sourceIndex
        );

        const quote = aiItem.quote?.trim() || "";

        // Missing source or quotation
        if (!sourceChunk || !quote) {
            return {
                key: checklistItem.key,
                label: checklistItem.label,
                status: "unclear",
                summary: "The quoted clause could not be verified.",
                quote: "",
                fullClause: "",
            };
        }

        // Verify exact wording, allowing whitespace differences only
        const normalizedQuote = normalizeWhitespace(quote);

        const normalizedContractText = normalizeWhitespace(
            sourceChunk.text
        );

        const quoteExists = normalizedContractText.includes(
            normalizedQuote
        );

        // Quote verification failed
        if (!quoteExists) {
            return {
                key: checklistItem.key,
                label: checklistItem.label,
                status: "unclear",
                summary: "The quoted clause could not be verified.",
                quote: "",
                fullClause: "",
            };
        }

        // Verified quotation
        return {
            key: checklistItem.key,
            label: checklistItem.label,
            status:
                aiItem.status === "found" ? "found" : "unclear",

            summary:
                (aiItem.summary || "The clause requires further review.")
                    .replace(/\s+/g, " ")
                    .trim(),

            quote,

            // Full source chunk for clause viewer
            fullClause: sourceChunk.text,

            sourceChunkId: sourceChunk._id,

            sourceChunkIndex: sourceChunk.chunkIndex,

            // Use database metadata, never AI-generated page numbers
            pageNumber: sourceChunk.pageNumber ?? null,

            section: sourceChunk.section || null,
        };
    });

    return verifiedItems;
};