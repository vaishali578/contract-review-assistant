import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@clerk/react";

import { apiRequest } from "../../services/api";

import { sendChatMessage } from "../../services/chat.api";

import ChatMessage from "./ChatMessage";

import ChatInput from "./ChatInput";


function ChatPanel({ contractId }) {

  const { getToken } = useAuth();

  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [status, setStatus] = useState("");


  // Fetch previous chat history
  const loadHistory = useCallback(async () => {

    try {

      const response = await apiRequest(
        getToken,
        `/contracts/${contractId}/chat`
      );

      setMessages(response.messages);
      return true;

    } catch (error) {

      setError(error.message);
      return false;

    }

  }, [contractId, getToken]);


  useEffect(() => {
    loadHistory();
  }, [loadHistory]);


  // Send user question
  const handleSend = async () => {

    const userQuestion = question.trim();

    if (!userQuestion || loading) return;

    setQuestion("");
    setError("");
    setStatus("");
    setLoading(true);

    // Add user message immediately
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: userQuestion,
      },
      {
        role: "assistant",
        content: "",
        isStreaming: true,
      },
    ]);

    try {

      await sendChatMessage({

        contractId,

        question: userQuestion,

        getToken,

        onEvent: (event, data) => {

          // Status updates
          if (event === "status") {
            setStatus(data.message);
          }


          // Incremental answer
          if (event === "token") {

            setMessages((previous) =>
              previous.map((message, index) => {

                if (
                  index === previous.length - 1 &&
                  message.isStreaming
                ) {
                  return {
                    ...message,
                    content: message.content + data.text,
                  };
                }

                return message;
              })
            );

          }


          // Verified quotation and source
          if (event === "citation") {

            setMessages((previous) =>
              previous.map((message, index) => {

                if (
                  index === previous.length - 1 &&
                  message.isStreaming
                ) {
                  return {
                    ...message,
                    ...data,
                  };
                }

                return message;
              })
            );

          }


          // Stream completed
          if (event === "done") {

            setMessages((previous) =>
              previous.map((message, index) => {

                if (
                  index === previous.length - 1 &&
                  message.isStreaming
                ) {
                  return {
                    ...message,
                    isStreaming: false,
                    _id: data.messageId,
                    status: data.status,
                  };
                }

                return message;
              })
            );

            setStatus("");

          }


          // Backend error
          if (event === "error") {
            throw new Error(data.message);
          }

        },

      });

      // Sync with saved MongoDB history
      await loadHistory();

    } catch (error) {

      setError(error.message);

      // Remove incomplete AI response
      setMessages((previous) =>
        previous.filter(
          (message) => !message.isStreaming
        )
      );
      if (await loadHistory()) {
        setError("");
      }

    } finally {

      setLoading(false);
      setStatus("");

    }

  };


  return (
    <div className="flex h-[650px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

      {/* Header */}
      <div className="border-b border-slate-200 bg-white p-5">

        <h2 className="text-lg font-semibold">
          Ask about your contract
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Answers are based only on your uploaded contract.
        </p>

      </div>


      {/* Messages */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">

        {messages.length === 0 && (

          <div className="flex h-full flex-col items-center justify-center text-center">

            <div className="text-4xl">💬</div>

            <h3 className="mt-4 font-semibold">
              Ask your first question
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              Ask about payment terms, termination,
              confidentiality or any other contract clause.
            </p>

          </div>

        )}


        {messages.map((message, index) => (

          <ChatMessage
            key={message._id || index}
            message={message}
          />

        ))}


        {/* Loading indicator */}
        {loading && status && (

          <p className="text-xs text-slate-500">
            {status}
          </p>

        )}

        {error && (

          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>

        )}

      </div>


      {/* Input */}
      <ChatInput
        question={question}
        setQuestion={setQuestion}
        onSend={handleSend}
        loading={loading}
      />

    </div>
  );
}

export default ChatPanel;