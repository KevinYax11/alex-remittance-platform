import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/auth/LoginForm";

const LoginPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div style={{ maxWidth: "400px", margin: "100px auto", padding: "20px" }}>
      <h1>Alex Remittance Platform</h1>
      <LoginForm />
    </div>
  );
};

export default LoginPage;