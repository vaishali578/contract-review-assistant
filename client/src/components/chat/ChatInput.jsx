function ChatInput({
  question,
  setQuestion,
  onSend,
  loading,
}) {

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!question.trim() || loading) return;

    onSend();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-3 border-t border-slate-200 bg-white p-4"
    >

      <textarea
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Ask anything about your contract..."
        rows={2}
        maxLength={2000}
        disabled={loading}
        className="flex-1 resize-none rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-100"
      />

      <button
        type="submit"
        disabled={!question.trim() || loading}
        className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send"}
      </button>

    </form>
  );
}

export default ChatInput;