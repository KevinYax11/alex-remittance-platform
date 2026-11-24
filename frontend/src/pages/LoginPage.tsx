import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginForm from "../components/auth/LoginForm";
import "./payments-login.css";

export default function LoginPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  return (
    <main className="payments-login">
      <div className="payments-login-visual" aria-hidden="true">
        <div className="payments-login-story">
          <p className="payments-corridor">USD <span>↔</span> GTQ</p>
          <p className="payments-login-display">Remesas entre dólares y quetzales.</p>
        </div>
      </div>
      <div className="payments-login-side">
        <header className="payments-login-brand">
          <span className="payments-login-mark" aria-hidden="true">↗</span>
          <strong>Senda <span>Payments</span></strong>
        </header>
        <section className="payments-login-content" aria-labelledby="payments-login-title">
          <h1 id="payments-login-title">Iniciar sesión</h1>
          <LoginForm />
        </section>
      </div>
    </main>
  );
}
