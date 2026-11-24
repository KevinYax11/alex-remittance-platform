import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="payments-nav">
      <div className="payments-wrap payments-nav-inner">
        <div className="payments-brand">
          <span className="payments-brand-mark" aria-hidden="true">↗</span>
          <strong>Senda Payments</strong>
        </div>
        {user?.role === "ambos" && (
          <nav className="payments-view-nav" aria-label="Vistas de la cuenta">
            <NavLink to="/dashboard/emisor">Enviar</NavLink>
            <NavLink to="/dashboard/receptor">Recibir</NavLink>
          </nav>
        )}
        {user && (
          <div className="payments-account">
            <div className="payments-account-name">
              <strong>{user.full_name}</strong>
              {user.role !== "ambos" && <span>{user.role === "emisor" ? "Remitente" : "Beneficiario"}</span>}
            </div>
            <button type="button" className="payments-button payments-logout" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
