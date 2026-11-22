import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { loginApi } from "../../api/auth";

const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginApi({ email: email.trim(), password });
      login(user);
    } catch (err: any) {
      const backendError =
        err.response?.data?.detail ||
        (err.message === "Network Error"
          ? "No se pudo conectar con el servidor. Verifica que el backend esté en ejecución."
          : "Credenciales incorrectas o error en el inicio de sesión.");
      setError(backendError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: "#ffffff",
        padding: "24px",
        borderRadius: "8px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        border: "1px solid #e5e7eb",
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: "16px", color: "#111827", fontSize: "1.25rem" }}>
        Iniciar Sesión
      </h2>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "10px 12px",
            borderRadius: "6px",
            marginBottom: "16px",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          Correo Electrónico
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="usuario@ejemplo.com"
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box",
            fontSize: "0.95rem",
          }}
        />
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "6px",
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "#374151",
          }}
        >
          Contraseña
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "6px",
            border: "1px solid #d1d5db",
            boxSizing: "border-box",
            fontSize: "0.95rem",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "10px 16px",
          backgroundColor: loading ? "#9ca3af" : "#1a1a2e",
          color: "#ffffff",
          border: "none",
          borderRadius: "6px",
          fontSize: "0.95rem",
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background-color 0.2s ease",
        }}
      >
        {loading ? "Iniciando sesión..." : "Entrar al Sistema"}
      </button>
    </form>
  );
};

export default LoginForm;