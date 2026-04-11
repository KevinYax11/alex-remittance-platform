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
    setLoading(true);
    try {
      await createTransaction({
        type: isEmisor ? "envio" : "solicitud",
        amount_usd: isEmisor ? parseFloat(amount) : undefined,
        amount_gtq: !isEmisor ? parseFloat(amount) : undefined,
        note,
      });
      setAmount("");
      setNote("");
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al procesar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
      <h3>{isEmisor ? "Registrar Envío (USD)" : "Solicitar Dinero (GTQ)"}</h3>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <input
          type="number"
          placeholder={isEmisor ? "Monto en USD" : "Monto en GTQ"}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0.01"
          step="0.01"
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="text"
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          style={{ padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: "8px 16px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {loading ? "Procesando..." : isEmisor ? "Enviar" : "Solicitar"}
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;