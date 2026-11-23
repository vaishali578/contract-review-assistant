import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.OPENROUTER_API_KEY = "test-key";
process.env.OPENROUTER_CHAT_MODELS = "test/limited,test/backup";
process.env.OPENROUTER_EMBEDDING_MODEL =
  "nvidia/nemotron-3.5-embed-1b:free";
process.env.EMBEDDING_DIMENSIONS = "2048";

const originalFetch = globalThis.fetch;
const { generateChatAnswer } = await import("../src/services/chat.service.js");
const { generateEmbeddings } = await import(
  "../src/services/embedding.service.js"
);
const { verifyChatAnswer } = await import(
  "../src/services/chatVerification.service.js"
);
const { verifyReviewFindings } = await import(
  "../src/services/quoteVerification.service.js"
);

after(() => {
  globalThis.fetch = originalFetch;
});

test("chat retries a rate-limited model and uses the configured fallback", async () => {
  const originalTestFetch = globalThis.fetch;
  const requestedModels = [];
  const statuses = [];
  let limitedAttempts = 0;
  const answer = {
    status: "answered",
    answer: "The service starts on 1 January 2027.",
    quote: "The Effective Date is 1 January 2027.",
    sourceChunkIndex: 4,
  };
  const streamedResponse =
    `data: ${JSON.stringify({
      choices: [{ delta: { content: JSON.stringify(answer) } }],
    })}\n\ndata: [DONE]\n\n`;

  globalThis.fetch = async (_url, options) => {
    const body = JSON.parse(options.body);
    requestedModels.push(body.model);

    if (body.model === "test/limited" && limitedAttempts++ < 2) {
      return new Response(
        JSON.stringify({ error: { message: "Service is busy" } }),
        {
          status: 429,
          headers: {
            "content-type": "application/json",
            "retry-after": "0",
          },
        }
      );
    }

    return new Response(streamedResponse, { status: 200 });
  };

  try {
    const result = await generateChatAnswer({
      question: "When does the service start?",
      evidence: [],
      onStatus: (status) => statuses.push(status),
    });

    assert.deepEqual(result, answer);
    assert.deepEqual(requestedModels, [
      "test/limited",
      "test/limited",
      "test/backup",
    ]);
    assert.ok(statuses.includes("Trying another available AI model..."));
  } finally {
    globalThis.fetch = originalTestFetch;
  }
});

test("chat findings without evidence are unclear", () => {
  const result = verifyChatAnswer(
    {
      status: "not_found",
      answer: "Not found",
      quote: "",
    },
    []
  );

  assert.equal(result.status, "unclear");
});

test("chat accepts a complete response when the provider omits the done marker", async () => {
  const originalTestFetch = globalThis.fetch;
  const answer = {
    status: "answered",
    answer: "The monthly fee is INR 2,50,000.",
    quote: "a monthly fee of INR 2,50,000",
    sourceChunkIndex: 2,
  };
  const event =
    `data: ${JSON.stringify({
      choices: [{ delta: { content: JSON.stringify(answer) } }],
    })}\r\n\r\n`;

  globalThis.fetch = async () => new Response(event, { status: 200 });

  try {
    const result = await generateChatAnswer({
      question: "What is the monthly fee?",
      evidence: [],
    });
    assert.deepEqual(result, answer);
  } finally {
    globalThis.fetch = originalTestFetch;
  }
});

test("chat falls back when a model closes its stream without content", async () => {
  const originalTestFetch = globalThis.fetch;
  const models = [];
  const answer = {
    status: "answered",
    answer: "The Client pays the monthly fee.",
    quote: "The Client shall pay the Service Provider a monthly fee",
    sourceChunkIndex: 4,
  };
  const content =
    `data: ${JSON.stringify({
      choices: [{ delta: { content: JSON.stringify(answer) } }],
    })}\n\ndata: [DONE]\n\n`;

  globalThis.fetch = async (_url, options) => {
    const model = JSON.parse(options.body).model;
    models.push(model);
    return new Response(
      model === "test/limited" ? "data: [DONE]\n\n" : content,
      { status: 200 }
    );
  };

  try {
    const result = await generateChatAnswer({
      question: "What are the payment terms?",
      evidence: [],
    });

    assert.deepEqual(result, answer);
    assert.deepEqual(models, ["test/limited", "test/backup"]);
  } finally {
    globalThis.fetch = originalTestFetch;
  }
});

test("chat respects the provider cooldown after all models are rate-limited", async () => {
  const originalTestFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    return new Response(
      JSON.stringify({ error: { message: "Provider returned error" } }),
      {
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "60",
        },
      },
    );
  };

  try {
    await assert.rejects(
      generateChatAnswer({
        question: "What are the payment terms?",
        evidence: [],
      }),
      (error) => {
        assert.equal(error.code, "AI_RATE_LIMIT");
        assert.equal(error.status, 429);
        assert.equal(error.retryAfterMs, 60000);
        return true;
      }
    );
    assert.equal(attempts, 4);
  } finally {
    globalThis.fetch = originalTestFetch;
  }
});

test("review findings without evidence are unclear", () => {
  const [result] = verifyReviewFindings(
    [{ key: "auto_renewal", status: "not_found" }],
    { auto_renewal: [] },
    [{ key: "auto_renewal", label: "Auto-renewal" }]
  );

  assert.equal(result.status, "unclear");
});

test("embedding retries a transient provider overload", async () => {
  const originalTestFetch = globalThis.fetch;
  let attempts = 0;
  globalThis.fetch = async () => {
    attempts += 1;
    if (attempts === 1) {
      return new Response(
        JSON.stringify({ error: { message: "Service is overloaded" } }),
        {
          status: 503,
          headers: {
            "content-type": "application/json",
            "retry-after": "0",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: [{ index: 0, embedding: Array(2048).fill(0.25) }],
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  };

  try {
    const [embedding] = await generateEmbeddings(["contract clause"]);
    assert.equal(attempts, 2);
    assert.equal(embedding.length, 2048);
  } finally {
    globalThis.fetch = originalTestFetch;
  }
});
