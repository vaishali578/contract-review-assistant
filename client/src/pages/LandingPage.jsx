import {
  SignInButton,
  SignUpButton,
  useAuth,
} from "@clerk/react";

import { Navigate } from "react-router-dom";

function LandingPage() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <p className="p-8">Loading...</p>;
  }

  if (isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">

      <div className="max-w-2xl text-center">

        <div className="mb-6 text-5xl">
          <span>📄</span>
          <span> AI</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
          Contract Review Assistant
        </h1>

        <p className="mt-5 text-lg text-slate-600">
          Upload your contracts and let AI identify
          important clauses with verified evidence.
        </p>

        <div className="mt-8 flex justify-center gap-4">

          <SignUpButton mode="modal">
            <button className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700">
              Get Started
            </button>
          </SignUpButton>

          <SignInButton mode="modal">
            <button className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-medium hover:bg-slate-100">
              Sign In
            </button>
          </SignInButton>

        </div>

      </div>
    </div>
  );
}

export default LandingPage;