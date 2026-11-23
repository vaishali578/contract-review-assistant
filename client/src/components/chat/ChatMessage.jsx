function ChatMessage({ message }) {

  const isUser = message.role === "user";

  return (
    <div
      className={`flex ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >

      <div
        className={`max-w-[85%] rounded-xl p-4 ${
          isUser
            ? "bg-blue-600 text-white"
            : "border border-slate-200 bg-white text-slate-800"
        }`}
      >

        <p className="mb-2 text-xs font-semibold opacity-70">
          {isUser ? "You" : "Contract AI"}
        </p>

        <p className="whitespace-pre-wrap text-sm leading-6">
          {message.content}
        </p>


        {/* Citation */}
        {!isUser && message.quote && (

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-slate-800">

            <p className="text-xs font-semibold text-slate-500">
              SOURCE CLAUSE
            </p>

            <p className="mt-2 text-sm italic">
              "{message.quote}"
            </p>

            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">

              {message.pageNumber != null && (
                <span>Page {message.pageNumber}</span>
              )}

              {message.section?.sectionNumber && (
                <span>
                  Section {message.section.sectionNumber}
                </span>
              )}

            </div>

          </div>

        )}


        {/* Not found */}
        {!isUser && message.status === "not_found" && (
          <p className="mt-2 text-xs text-amber-700">
            No supporting information was found in the contract.
          </p>
        )}


        {/* Unclear */}
        {!isUser && message.status === "unclear" && (
          <p className="mt-2 text-xs text-amber-700">
            This answer could not be verified.
          </p>
        )}

      </div>

    </div>
  );
}

export default ChatMessage;