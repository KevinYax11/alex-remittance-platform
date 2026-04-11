import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Bienvenido, {user?.full_name}</h1>
        <button onClick={handleLogout}>Cerrar Sesión</button>
      </div>
      <p>Rol: {user?.role === "emisor" ? "Carlos (Hijo)" : "Don Alex"}</p>
      {user?.role === "emisor" ? (
        <div>
          <h2>Panel de Envíos</h2>
          <p>Aquí podrás registrar y ver tus envíos.</p>
        </div>
      ) : (
        <div>
          <h2>Panel de Solicitudes</h2>
          <p>Aquí podrás solicitar dinero y confirmar recepciones.</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;