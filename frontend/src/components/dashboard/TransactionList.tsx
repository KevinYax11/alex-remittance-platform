import { Transaction } from "../../types";
import { confirmTransaction } from "../../api/transactions";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";

interface Props {
  transactions: Transaction[];
  onRefresh: () => void;
}

const TransactionList = ({ transactions, onRefresh }: Props) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<number | null>(null);

  const handleConfirm = async (id: number) => {
    setLoading(id);
    try {
      await confirmTransaction(id);
      onRefresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h3>Historial de Transacciones</h3>
      {transactions.length === 0 && <p>No hay transacciones aún.</p>}
      {transactions.map((t) => (
        <div key={t.id} style={{
          border: "1px solid #ccc",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <p><strong>{t.type === "envio" ? "Envío" : "Solicitud"}</strong></p>
            <p>USD: ${t.amount_usd} | GTQ: Q{t.amount_gtq}</p>
            <p>Tasa: {t.exchange_rate} | {new Date(t.created_at).toLocaleDateString()}</p>
            {t.note && <p>Nota: {t.note}</p>}
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <span style={{
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: t.status === "confirmado" ? "#4caf50" : "#ff9800",
              color: "white",
              fontSize: "12px"
            }}>
              {t.status === "confirmado" ? "Confirmado" : "Pendiente"}
            </span>
            {user?.role === "receptor" && t.status === "pendiente" && (
              <button
                onClick={() => handleConfirm(t.id)}
                disabled={loading === t.id}
                style={{ padding: "6px 12px", backgroundColor: "#1a1a2e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
              >
                {loading === t.id ? "..." : "Confirmar"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TransactionList;