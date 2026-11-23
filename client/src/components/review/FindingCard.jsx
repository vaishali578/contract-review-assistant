const statusStyles = {
  found: {
    label: "Found",
    classes: "bg-green-100 text-green-800",
  },

  not_found: {
    label: "Not Found",
    classes: "bg-red-100 text-red-800",
  },

  unclear: {
    label: "Unclear",
    classes: "bg-amber-100 text-amber-800",
  },
};


function FindingCard({ item, onViewClause }) {

  const status = statusStyles[item.status] || statusStyles.unclear;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">

      {/* Heading and status */}
      <div className="flex flex-wrap items-center justify-between gap-3">

        <h3 className="font-semibold text-slate-900">
          {item.label}
        </h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${status.classes}`}
        >
          {status.label}
        </span>

      </div>


      {/* Summary */}
      <p className="mt-4 text-sm leading-6 text-slate-700">
        {item.summary}
      </p>


      {/* Quoted clause */}
      {item.quote ? (

        <div className="mt-4 rounded-lg bg-slate-50 p-4">

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Exact clause
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-800">
            "{item.quote}"
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">

            {item.pageNumber != null && (
              <span>Page {item.pageNumber}</span>
            )}

            {item.section?.sectionNumber && (
              <span>
                Section {item.section.sectionNumber}
              </span>
            )}

          </div>

          <button
            onClick={() => onViewClause(item)}
            className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View full clause →
          </button>

        </div>

      ) : (

        <div className="mt-4 rounded-lg bg-slate-50 p-4">

          <p className="text-sm text-slate-500">
            {item.status === "not_found"
              ? "Not found in the contract."
              : "No verified quotation is available."}
          </p>

        </div>

      )}

    </div>
  );
}

export default FindingCard;