import { useParams } from "react-router-dom";

function ContractReview() {
  const { id } = useParams();

  return (
    <div>
      <h1 className="text-2xl font-bold">
        Contract Review
      </h1>

      <p className="mt-2 text-slate-500">
        Contract ID: {id}
      </p>

      <p className="mt-4">
        Review interface coming next.
      </p>
    </div>
  );
}

export default ContractReview;