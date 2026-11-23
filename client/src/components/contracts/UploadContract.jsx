import { useState } from "react";
import { useAuth } from "@clerk/react";

import { apiRequest } from "../../services/api";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function UploadContract({ onUploaded }) {

  const { getToken } = useAuth();

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {

    const selectedFile = event.target.files?.[0];

    setError("");
    setFile(null);

    if (!selectedFile) return;

    const extension = selectedFile.name
      .split(".")
      .pop()
      .toLowerCase();

    if (!["pdf", "docx", "txt"].includes(extension)) {
      setError("Only PDF, DOCX and TXT files are allowed.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size cannot exceed 20 MB.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size === 0) {
      setError("Empty files are not allowed.");
      event.target.value = "";
      return;
    }

    setFile(selectedFile);
  };


  const handleUpload = async () => {

    if (!file) {
      setError("Please select a contract first.");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const formData = new FormData();

      // Must match upload.single("contract") in backend
      formData.append("contract", file);

      const response = await apiRequest(
        getToken,
        "/contracts",
        {
          method: "POST",
          body: formData,
        }
      );

      setFile(null);

      onUploaded?.(response.contract);

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6">

      <h2 className="text-lg font-semibold">
        Upload Contract
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        Upload a PDF, DOCX or TXT file (maximum 20 MB).
      </p>

      <div className="mt-5">

        <input
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full rounded-lg border border-slate-300 p-3 text-sm"
        />

      </div>

      {file && (
        <p className="mt-3 text-sm text-slate-700">
          Selected: {file.name}
        </p>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || loading}
        className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Contract"}
      </button>

    </div>
  );
}

export default UploadContract;