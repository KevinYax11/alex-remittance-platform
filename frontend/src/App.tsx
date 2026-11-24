import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/common/PrivateRoute";
import LoginPage from "./pages/LoginPage";
import EmisorPage from "./pages/EmisorPage";
import ReceptorPage from "./pages/ReceptorPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/registro" element={<LoginPage registration />} />
          <Route
            path="/dashboard/emisor"
            element={
              <PrivateRoute allowedRole="emisor">
                <EmisorPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/receptor"
            element={
              <PrivateRoute allowedRole="receptor">
                <ReceptorPage />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
