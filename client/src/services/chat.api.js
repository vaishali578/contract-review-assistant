export const sendChatMessage = async ({
  contractId,
  question,
  getToken,
  onEvent,
}) => {

  const token = await getToken();

  const response = await fetch(
    `http://localhost:5000/api/contracts/${contractId}/chat`,
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
    const error = await response.json();

    throw new Error(
      error.message || "Failed to send message"
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

        if (!block.trim()) continue;

        const lines = block.split(/\r?\n/);

        let eventName = "message";
        const dataLines = [];

        for (const line of lines) {

          if (line.startsWith("event:")) {
            eventName = line.slice(6).trim();
          }

          if (line.startsWith("data:")) {
            dataLines.push(line.slice(5).trim());
          }
        }

        if (dataLines.length === 0) continue;

        try {
          const data = JSON.parse(
            dataLines.join("\n")
          );

          onEvent(eventName, data);

        } catch (error) {
          console.error("SSE parsing error:", error);
        }
      }
    }

  } finally {
    reader.releaseLock();
  }
};