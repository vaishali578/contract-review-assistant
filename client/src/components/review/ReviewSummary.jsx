function ReviewSummary({ items = [] }) {

  const found = items.filter(
    (item) => item.status === "found"
  ).length;

  const notFound = items.filter(
    (item) => item.status === "not_found"
  ).length;

  const unclear = items.filter(
    (item) => item.status === "unclear"
  ).length;

  const stats = [
    {
      label: "Found",
      count: found,
      color: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Not Found",
      count: notFound,
      color: "text-red-700",
      bg: "bg-red-50",
    },
    {
      label: "Unclear",
      count: unclear,
      color: "text-amber-700",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-xl border border-slate-200 p-5 ${stat.bg}`}
        >
          <p className="text-sm text-slate-600">
            {stat.label}
          </p>

          <p className={`mt-2 text-3xl font-bold ${stat.color}`}>
            {stat.count}
          </p>
        </div>
      ))}

    </div>
  );
}

export default ReviewSummary;