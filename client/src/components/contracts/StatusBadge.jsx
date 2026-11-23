function StatusBadge({ status }) {

  const styles = {
    processing: "bg-yellow-100 text-yellow-800",
    reviewed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;