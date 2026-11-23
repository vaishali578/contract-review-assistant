const API_URL = "https://openrouter.ai/api/v1/embeddings";

const MODEL =
  process.env.OPENROUTER_EMBEDDING_MODEL ||
  "nvidia/nemotron-3.5-embed-1b:free";

const DEFAULT_DIMENSIONS = MODEL.startsWith("nvidia/nemotron-3.5-embed-1b")
  ? 2048
  : 1536;
const DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS || DEFAULT_DIMENSIONS
);

if (!Number.isInteger(DIMENSIONS) || DIMENSIONS <= 0) {
  throw new Error("EMBEDDING_DIMENSIONS must be a positive integer");
}

const BATCH_SIZE = 16;
const MAX_RETRIES = 5;
const REQUEST_TIMEOUT_MS = 60000;
const MAX_DELAY_MS = 60000;

const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

export const EMBEDDING_MODEL = MODEL;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Exponential backoff with jitter
const getBackoff = (attempt) =>
  Math.min(1000 * 2 ** attempt, 10000) + Math.random() * 500;

// Honors Retry-After if the provider sends it, otherwise falls back to backoff
const getRetryDelay = (response, attempt) => {
  const retryAfter = response.headers.get("retry-after");

  if (retryAfter) {
    const seconds = Number(retryAfter);

    if (Number.isFinite(seconds)) {
      return Math.min(seconds * 1000, MAX_DELAY_MS);
    }

    const retryDate = Date.parse(retryAfter);

    if (!Number.isNaN(retryDate)) {
      return Math.min(Math.max(retryDate - Date.now(), 1000), MAX_DELAY_MS);
    }
  }

  return getBackoff(attempt);
};

// Embeds a single batch, with retries for transient failures
const embedBatch = async (batch) => {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const isLastAttempt = attempt === MAX_RETRIES;
    let response;

    // 1. Network-level failures (timeout, DNS, connection reset)
    try {
      response = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          input: batch,
          dimensions: DIMENSIONS,
          encoding_format: "float",
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (err) {
      if (!isLastAttempt) {
        const delay = getBackoff(attempt);
        console.warn(
          `Embedding network error (${err.message}). Retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`
        );
        await sleep(delay);
        continue;
      }
      throw new Error(`EMBEDDING_NETWORK_ERROR: ${err.message}`);
    }

    const result = await response.json().catch(() => ({}));

    // 2. Success (OpenRouter can occasionally return 200 with an error body)
    if (response.ok && !result.error) {
      return result;
    }

    const status = response.ok ? 503 : response.status;
    const message = result.error?.message || `HTTP ${status}`;

    // 3. Transient HTTP failures
    if (RETRYABLE_STATUSES.has(status) && !isLastAttempt) {
      const delay = getRetryDelay(response, attempt);
      console.warn(
        `Embedding ${status} (${message}). Retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`
      );
      await sleep(delay);
      continue;
    }

    // 4. Out of retries or non-retryable
    if (status === 429) {
      throw new Error(`EMBEDDING_RATE_LIMIT: ${message}`);
    }

    if (status >= 500) {
      throw new Error(`EMBEDDING_PROVIDER_UNAVAILABLE: ${message}`);
    }

    // 400 / 401 / 402 / 404 etc. - retrying won't help
    throw new Error(`EMBEDDING_REQUEST_FAILED: ${message}`);
  }

  throw new Error("EMBEDDING_PROVIDER_UNAVAILABLE: failed after retries");
};

// Generate embeddings for multiple texts
export const generateEmbeddings = async (texts) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OpenRouter API key is missing");
  }

  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const result = await embedBatch(batch);

    if (!Array.isArray(result.data) || result.data.length !== batch.length) {
      throw new Error("Invalid embedding response from OpenRouter");
    }

    const embeddings = [...result.data]
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    for (const embedding of embeddings) {
      if (
        !Array.isArray(embedding) ||
        embedding.length !== DIMENSIONS ||
        !embedding.every(Number.isFinite)
      ) {
        throw new Error(`Invalid embedding dimensions. Expected ${DIMENSIONS}`);
      }
    }

    allEmbeddings.push(...embeddings);
  }

  return allEmbeddings;
};