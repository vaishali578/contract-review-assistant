import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ContractReview from "./pages/ContractReview";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* Public route */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/contracts/:id"
              element={<ContractReview />}
            />

          </Route>
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;