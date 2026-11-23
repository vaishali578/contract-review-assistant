function ClauseViewer({ item, onClose }) {

  if (!item) return null;

  const fullText = item.fullClause || "";
  const quote = item.quote || "";

  const quoteIndex = fullText.indexOf(quote);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >

      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-start justify-between gap-4">

          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {item.label}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Full source text
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close clause viewer"
            className="rounded-lg px-3 py-1 text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>

        </div>


        {/* Document reference */}
        <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-500">

          {item.pageNumber != null && (
            <span>Page {item.pageNumber}</span>
          )}

          {item.section?.sectionNumber && (
            <span>
              Section {item.section.sectionNumber}
            </span>
          )}

        </div>


        {/* Complete source text */}
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">

          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800">

            {quoteIndex >= 0 && quote ? (
              <>
                {fullText.slice(0, quoteIndex)}

                <mark className="rounded bg-yellow-200 px-1">
                  {quote}
                </mark>

                {fullText.slice(
                  quoteIndex + quote.length
                )}
              </>
            ) : (
              fullText
            )}

          </p>

        </div>


        {/* Source quote */}
        <div className="mt-5">

          <p className="text-xs font-semibold uppercase text-slate-500">
            Verified quotation
          </p>

          <p className="mt-2 text-sm italic text-slate-700">
            "{quote}"
          </p>

        </div>


        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Close
        </button>

      </div>

    </div>
  );
}

export default ClauseViewer;