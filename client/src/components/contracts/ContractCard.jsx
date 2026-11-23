import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge";

function formatBytes(bytes) {

  if (bytes === 0) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB"];

  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return (
    Math.round(
      (bytes / Math.pow(1024, index)) * 100
    ) / 100
  ) + " " + units[index];
}


function ContractCard({ contract, onDelete }) {

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">

      <div className="flex flex-col justify-between gap-4 sm:flex-row">

        <div className="min-w-0">

          <h3 className="truncate font-semibold text-slate-900">
            {contract.fileName}
          </h3>

          <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">

            <span>
              {formatBytes(contract.fileSize)}
            </span>

            <span>
              {new Date(contract.createdAt).toLocaleDateString()}
            </span>

          </div>

          <div className="mt-3">
            <StatusBadge status={contract.status} />
          </div>

        </div>

        <div className="flex items-center gap-3">

          {contract.status === "reviewed" && (
            <Link
              to={`/contracts/${contract._id}`}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              View Review
            </Link>
          )}

          {contract.status === "failed" && (
            <span className="text-xs text-red-600">
              {contract.processingError || "Processing failed"}
            </span>
          )}

          <button
            onClick={() => onDelete(contract._id)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
}

export default ContractCard;