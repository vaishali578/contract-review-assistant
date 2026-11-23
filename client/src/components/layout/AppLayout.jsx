import { UserButton } from "@clerk/react";
import { Link, Outlet } from "react-router-dom";

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50">

      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <Link
            to="/dashboard"
            className="text-xl font-bold text-slate-900"
          >
            Contract AI
          </Link>

          <UserButton />

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Outlet />
      </main>

    </div>
  );
}

export default AppLayout;