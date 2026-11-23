import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/react";

import { apiRequest } from "../services/api";

import UploadContract from "../components/contracts/UploadContract";
import ContractCard from "../components/contracts/ContractCard";

function Dashboard() {

  const { getToken } = useAuth();

  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch contracts from backend
  const loadContracts = useCallback(async () => {

    try {

      setError("");

      const response = await apiRequest(
        getToken,
        "/contracts"
      );

      setContracts(response.contracts);

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }

  }, [getToken]);


  // Load contracts when dashboard opens
  useEffect(() => {
    loadContracts();
  }, [loadContracts]);


  // Refresh processing contracts periodically
  useEffect(() => {

    const hasProcessing = contracts.some(
      (contract) => contract.status === "processing"
    );

    if (!hasProcessing) return;

    const interval = setInterval(() => {
      loadContracts();
    }, 5000);

    return () => clearInterval(interval);

  }, [contracts, loadContracts]);


  // Handle contract upload
  const handleUploaded = () => {
    loadContracts();
  };


  // Delete contract
  const handleDelete = async (contractId) => {

    const confirmed = window.confirm(
      "Are you sure you want to delete this contract?"
    );

    if (!confirmed) return;

    try {

      await apiRequest(
        getToken,
        `/contracts/${contractId}`,
        {
          method: "DELETE",
        }
      );

      setContracts((previous) =>
        previous.filter(
          (contract) => contract._id !== contractId
        )
      );

    } catch (error) {

      setError(error.message);

    }

  };


  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          My Contracts
        </h1>

        <p className="mt-2 text-slate-500">
          Upload and manage your contract reviews.
        </p>
      </div>


      <UploadContract onUploaded={handleUploaded} />


      <div>

        <div className="mb-5 flex items-center justify-between">

          <h2 className="text-xl font-semibold">
            Uploaded Contracts
          </h2>

          <button
            onClick={loadContracts}
            className="text-sm font-medium text-blue-600"
          >
            Refresh
          </button>

        </div>


        {error && (
          <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}


        {loading ? (

          <p className="text-slate-500">
            Loading contracts...
          </p>

        ) : contracts.length === 0 ? (

          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">

            <h3 className="font-semibold text-slate-700">
              No contracts uploaded yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Upload your first contract to get started.
            </p>

          </div>

        ) : (

          <div className="space-y-4">

            {contracts.map((contract) => (
              <ContractCard
                key={contract._id}
                contract={contract}
                onDelete={handleDelete}
              />
            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Dashboard;