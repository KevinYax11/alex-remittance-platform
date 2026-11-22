import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/auth/LoginForm";

const LoginPage = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === "emisor") {
        navigate("/dashboard/emisor");
      } else {
        navigate("/dashboard/receptor");
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center", color: "#1a1a2e", marginBottom: "24px" }}>Senda Payments</h1>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
