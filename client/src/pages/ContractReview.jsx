import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  useAuth,
} from "@clerk/react";

import {
  apiRequest,
} from "../services/api";

import ReviewSummary from "../components/review/ReviewSummary";

import FindingCard from "../components/review/FindingCard";

import ClauseViewer from "../components/review/ClauseViewer";
import ChatPanel from "../components/chat/ChatPanel";

function ContractReview() {

  const { id } = useParams();

  const { getToken } = useAuth();

  const [contract, setContract] = useState(null);

  const [review, setReview] = useState(null);

  const [selectedClause, setSelectedClause] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  // Load contract and its review
  const loadReview = useCallback(async () => {

    try {

      setError("");

      // Fetch user's contracts
      const contractResponse = await apiRequest(
        getToken,
        "/contracts"
      );

      // Find requested contract
      const selectedContract =
        contractResponse.contracts.find(
          (item) => item._id === id
        );

      if (!selectedContract) {
        setContract(null);
        setReview(null);
        setError("Contract not found");
        return;
      }

      setContract(selectedContract);

      // Wait for background processing
      if (selectedContract.status === "processing") {
        setReview(null);
        return;
      }

      // Show processing failure
      if (selectedContract.status === "failed") {
        setReview(null);

        setError(
          selectedContract.processingError ||
          "Contract processing failed"
        );

        return;
      }

      // Fetch AI review
      const reviewResponse = await apiRequest(
        getToken,
        `/contracts/${id}/review`
      );

      setReview(reviewResponse.review);

    } catch (error) {

      setError(error.message);

    } finally {

      setLoading(false);

    }

  }, [id, getToken]);


  // Initial load
  useEffect(() => {
    loadReview();
  }, [loadReview]);


  // Poll while review is processing
  useEffect(() => {

    if (contract?.status !== "processing") {
      return;
    }

    const interval = setInterval(() => {
      loadReview();
    }, 5000);

    return () => clearInterval(interval);

  }, [contract?.status, loadReview]);


  // Loading UI
  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        Loading contract review...
      </div>
    );
  }


  // Contract error
  if (error && !contract) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error}
      </div>
    );
  }


  // Processing UI
  if (contract?.status === "processing") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">

        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />

        <h2 className="text-xl font-semibold">
          Reviewing your contract...
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Extracting clauses and analysing all 8 checklist items.
        </p>

      </div>
    );
  }


  // Failed UI
  if (contract?.status === "failed") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">

        <h2 className="font-semibold text-red-800">
          Contract review failed
        </h2>

        <p className="mt-2 text-sm text-red-700">
          {error || contract.processingError || "Unable to process the contract."}
        </p>

      </div>
    );
  }


  if (!review) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Review is not available yet. Please refresh and try again.
      </div>
    );
  }


  return (
    <div className="space-y-8">

      {/* Header */}
      <div>

        <h1 className="text-3xl font-bold text-slate-900">
          Contract Review
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {contract.fileName}
        </p>

      </div>


      {/* Summary */}
      <section>

        <h2 className="mb-4 text-lg font-semibold">
          Review Summary
        </h2>

        <ReviewSummary items={review.items} />

      </section>


      {/* Checklist findings */}
      <section>

        <div className="mb-5">

          <h2 className="text-xl font-semibold">
            Contract Checklist
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Each item is checked against the contract's extracted content.
          </p>

        </div>


        <div className="space-y-4">

          {review.items.map((item) => (

            <FindingCard
              key={item.key}
              item={item}
              onViewClause={setSelectedClause}
            />

          ))}

        </div>

      </section>

      {/* AI Chat */}
<section className="space-y-4">

  <div>
    <h2 className="text-xl font-semibold">
      Contract Assistant
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      Ask follow-up questions about this contract.
    </p>
  </div>

  <ChatPanel contractId={id} />

</section>


      {/* Clause viewer modal */}
      {selectedClause && (

        <ClauseViewer
          item={selectedClause}
          onClose={() => setSelectedClause(null)}
        />

      )}

    </div>
  );
}

export default ContractReview;