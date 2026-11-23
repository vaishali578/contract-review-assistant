const API_URL = "https://openrouter.ai/api/v1/embeddings";

const MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL ||
  "nvidia/nemotron-3-embed-1b:free";

const DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS || 2048
);

const BATCH_SIZE = 16;


// Generate embeddings for multiple texts
export const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is missing");
  }

  const allEmbeddings = [];

  // Process texts in batches
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        model: MODEL,
        input: batch,
        encoding_format: "float",
      }),

      signal: AbortSignal.timeout(60000),
    });

    const result = await response.json().catch(() => ({}));

    // Handle API errors
    if (!response.ok) {
      if (response.status === 429) {
        throw new Error(
          "EMBEDDING_RATE_LIMIT: OpenRouter rate limit reached. Please retry later."
        );
      }

      throw new Error(
        result.error?.message || "Embedding generation failed"
      );
    }

    if (!Array.isArray(result.data) || result.data.length !== batch.length) {
      throw new Error("Invalid embedding response from OpenRouter");
    }

    // Restore original input order
    const sortedResults = [...result.data].sort(
      (a, b) => a.index - b.index
    );

    const embeddings = sortedResults.map((item) => item.embedding);

    // Validate embedding dimensions
    for (const embedding of embeddings) {
      if (
        !Array.isArray(embedding) ||
        embedding.length !== DIMENSIONS ||
        !embedding.every(Number.isFinite)
      ) {
        throw new Error(
          `Invalid embedding dimensions. Expected ${DIMENSIONS}`
        );
      }
    }

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
};

export const EMBEDDING_MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL ||
  "nvidia/nemotron-3-embed-1b:free";