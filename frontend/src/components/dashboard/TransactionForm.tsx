import { useState } from "react";
import { createTransaction } from "../../api/transactions";
import { useAuth } from "../../context/AuthContext";

interface Props {
  onSuccess: () => void;
}

const TransactionForm = ({ onSuccess }: Props) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isEmisor = user?.role === "emisor";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Por favor ingresa un monto válido mayor a 0.");
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        type: isEmisor ? "envio" : "solicitud",
        amount_usd: isEmisor ? parsedAmount : undefined,
        amount_gtq: !isEmisor ? parsedAmount : undefined,
        note: note.trim() || undefined,
      });
      setAmount("");
      setNote("");
      onSuccess();
    } catch (err: any) {
      const detail =
        err.response?.data?.detail ||
        (typeof err.response?.data === "string" ? err.response.data : null) ||
        "Error al procesar la transacción. Intenta nuevamente.";
      setError(typeof detail === "string" ? detail : JSON.stringify(detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "20px",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        marginBottom: "24px",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "14px", color: "#111827", fontSize: "1.1rem" }}>
        {isEmisor ? "Registrar Envío de Remesa (USD)" : "Solicitar Envío de Remesa (GTQ)"}
      </h3>

      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "14px",
            fontSize: "0.875rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ flex: "1 1 180px" }}>
            <input
              type="number"
              placeholder={isEmisor ? "Monto en USD (ej. 150.00)" : "Monto en GTQ (ej. 1000.00)"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              disabled={loading}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                boxSizing: "border-box",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <div style={{ flex: "2 1 240px" }}>
            <input
              type="text"
              placeholder="Nota o motivo (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={loading}
              style={{
                width: "100%",
                padding: "9px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                boxSizing: "border-box",
                fontSize: "0.9rem",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "9px 20px",
              backgroundColor: loading ? "#9ca3af" : "#1a1a2e",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              transition: "background-color 0.2s ease",
            }}
          >
            {loading ? "Procesando..." : isEmisor ? "Enviar Remesa" : "Solicitar Dinero"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;