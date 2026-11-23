const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const dispatchEventBlock = (block, onEvent) => {
  if (!block.trim()) return;

  const lines = block.split(/\r?\n/);
  let eventName = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return;

  let data;
  try {
    data = JSON.parse(dataLines.join("\n"));
  } catch {
    throw new Error("Received an invalid chat stream response");
  }

  onEvent(eventName, data);
};

export const sendChatMessage = async ({
  contractId,
  question,
  getToken,
  onEvent,
}) => {

  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch(
    `${API_URL}/api/contracts/${contractId}/chat`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        question,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    throw new Error(
      error?.message || "Failed to send message"
    );
  }

  if (!response.body) {
    throw new Error("Streaming response not supported");
  }

  const reader = response.body.getReader();

  const decoder = new TextDecoder();

  let buffer = "";

  try {

    while (true) {

      const { value, done } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, {
        stream: true,
      });

      const events = buffer.split(/\r?\n\r?\n/);

      buffer = events.pop() || "";

      for (const block of events) {
        dispatchEventBlock(block, onEvent);
      }
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      dispatchEventBlock(buffer, onEvent);
    }

  } finally {
    reader.releaseLock();
  }
};