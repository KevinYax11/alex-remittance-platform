import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const roleLabel = user?.role === "emisor" ? "Emisor (Carlos)" : "Receptor (Don Alex)";

  return (
    <header
      style={{
        backgroundColor: "#1a1a2e",
        color: "#ffffff",
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600, color: "#ffffff" }}>
          Alex Remittance Platform
        </h2>
      </div>

      {user && (
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ textAlign: "right" }}>
            <span style={{ display: "block", fontSize: "0.95rem", fontWeight: 500 }}>
              {user.full_name}
            </span>
            <span style={{ display: "block", fontSize: "0.8rem", color: "#a0a0b0" }}>
              {roleLabel}
            </span>
          </div>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: "#e94560",
              color: "#ffffff",
              border: "none",
              borderRadius: "4px",
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 500,
              transition: "background-color 0.2s ease",
            }}
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </header>
  );
};

export default Navbar;
