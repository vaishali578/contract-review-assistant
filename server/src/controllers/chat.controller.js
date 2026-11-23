import Contract from "../models/contract.model.js";
import ChatMessage from "../models/chatMessage.model.js";

import {
  retrieveRelevantChunks,
} from "../services/retrieval.service.js";

import {
  generateChatAnswer,
} from "../services/chat.service.js";

import {
  verifyChatAnswer,
} from "../services/chatVerification.service.js";


// SSE helper
const sendEvent = (res, event, data) => {
  if (res.writableEnded) return;

  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
};


// Send message and stream answer
export const sendContractMessage = async (req, res) => {

  let userMessage = null;
  let controller = null;

  try {

    const { question } = req.body;

    const { id: contractId } = req.params;

    // Validate question
    if (
      typeof question !== "string" ||
      !question.trim() ||
      question.length > 2000
    ) {
      return res.status(400).json({
        success: false,
        message: "Question must be between 1 and 2000 characters",
      });
    }

    // Verify contract ownership
    const contract = await Contract.findOne({
      _id: contractId,
      userId: req.userId,
    });

    if (!contract) {
      return res.status(404).json({
        success: false,
        message: "Contract not found",
      });
    }

    // Save user message
    userMessage = await ChatMessage.create({
      userId: req.userId,
      contractId: contract._id,
      role: "user",
      content: question.trim(),
    });

    // Initialize SSE headers
    res.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });

    res.flushHeaders();

    controller = new AbortController();

    // Handle client disconnect
    res.on("close", () => {
      if (!res.writableEnded) {
        controller.abort();
      }
    });

    // Step 1: Tell frontend that search started
    sendEvent(res, "status", {
      message: "Searching your contract...",
    });

    // Step 2: Retrieve relevant chunks
    const evidence = await retrieveRelevantChunks({
      query: question.trim(),
      userId: req.userId,
      contractId: contract._id,
      limit: 8,
    });

    if (controller.signal.aborted) return;

    sendEvent(res, "status", {
      message: "Checking relevant contract clauses...",
    });

    // Step 3: Generate AI answer
    const aiResult = await generateChatAnswer({
      question: question.trim(),
      evidence,
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    // Step 4: Verify quotation
    const verified = verifyChatAnswer(
      aiResult,
      evidence
    );

    // Step 5: Save verified assistant message
    const assistantMessage = await ChatMessage.create({
      userId: req.userId,
      contractId: contract._id,

      role: "assistant",

      content: verified.answer,

      status: verified.status,

      quote: verified.quote || "",

      fullClause: verified.fullClause || "",

      sourceChunkId: verified.sourceChunkId || null,

      sourceChunkIndex:
        verified.sourceChunkIndex ?? null,

      pageNumber: verified.pageNumber ?? null,

      section: verified.section || null,
    });

    // Step 6: Stream verified answer incrementally
    sendEvent(res, "status", {
      message: "Sending verified answer...",
    });

    const answer = verified.answer;

    // Send small pieces progressively
    for (let i = 0; i < answer.length; i += 24) {

      if (controller.signal.aborted) return;

      sendEvent(res, "token", {
        text: answer.slice(i, i + 24),
      });

      await new Promise((resolve) =>
        setTimeout(resolve, 15)
      );
    }

    // Send verified quotation and source
    sendEvent(res, "citation", {
      status: verified.status,
      quote: verified.quote || "",
      fullClause: verified.fullClause || "",
      pageNumber: verified.pageNumber ?? null,
      section: verified.section || null,
      sourceChunkIndex: verified.sourceChunkIndex ?? null,
    });

    // Complete stream
    sendEvent(res, "done", {
      messageId: assistantMessage._id,
      status: verified.status,
    });

    res.end();

  } catch (error) {

    console.error("Chat error:", error);

    if (controller?.signal.aborted) {
      return;
    }

    if (res.headersSent) {

      sendEvent(res, "error", {
        message:
          error.message.includes("AI_RATE_LIMIT")
            ? "AI service is busy. Please try again later."
            : "Unable to process your question. Please try again.",
      });

      res.end();

    } else {

      return res.status(500).json({
        success: false,
        message: "Unable to process chat request",
      });
    }
  }
};