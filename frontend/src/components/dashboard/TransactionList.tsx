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
  const [actionError, setActionError] = useState<string>("");

  const handleConfirm = async (id: number) => {
    setActionError("");
    setLoading(id);
    try {
      await confirmTransaction(id);
      onRefresh();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "No se pudo confirmar la transacción.";
      setActionError(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <h3 style={{ marginBottom: "14px", color: "#111827", fontSize: "1.1rem" }}>
        Historial de Transacciones
      </h3>

      {actionError && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            padding: "8px 12px",
            borderRadius: "6px",
            marginBottom: "12px",
            fontSize: "0.875rem",
          }}
        >
          {actionError}
        </div>
      )}

      {transactions.length === 0 ? (
        <div
          style={{
            padding: "40px 20px",
            textAlign: "center",
            backgroundColor: "#f9fafb",
            border: "1px dashed #d1d5db",
            borderRadius: "8px",
            color: "#6b7280",
          }}
        >
          <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "1rem", color: "#374151" }}>
            No hay transacciones registradas aún
          </p>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            Aquí podrás visualizar el desglose, estado y montos en cuanto se registre actividad.
          </p>
        </div>
      ) : (
        transactions.map((t) => (
          <div
            key={t.id}
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <strong style={{ fontSize: "1rem", color: "#111827" }}>
                  {t.type === "envio" ? "Envío de Remesa" : "Solicitud de Dinero"}
                </strong>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>#{t.id}</span>
              </div>
              <p style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#374151" }}>
                <strong>USD:</strong> ${t.amount_usd.toFixed(2)} | <strong>GTQ:</strong> Q
                {t.amount_gtq.toFixed(2)}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
                Tipo de cambio: Q{t.exchange_rate.toFixed(2)} por USD | Fecha:{" "}
                {new Date(t.created_at).toLocaleDateString()}
              </p>
              {t.note && (
                <p style={{ margin: "6px 0 0 0", fontSize: "0.85rem", color: "#4b5563", fontStyle: "italic" }}>
                  Nota: &ldquo;{t.note}&rdquo;
                </p>
              )}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: "9999px",
                  backgroundColor: t.status === "confirmado" ? "#ecfdf5" : "#fffbeb",
                  color: t.status === "confirmado" ? "#065f46" : "#b45309",
                  border: `1px solid ${t.status === "confirmado" ? "#a7f3d0" : "#fde68a"}`,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                {t.status === "confirmado" ? "Confirmado" : "Pendiente"}
              </span>

              {user?.role === "receptor" &&
                t.type === "envio" &&
                t.beneficiary_id === user.user_id &&
                t.status === "pendiente" && (
                <button
                  onClick={() => handleConfirm(t.id)}
                  disabled={loading === t.id}
                  style={{
                    padding: "6px 14px",
                    backgroundColor: loading === t.id ? "#9ca3af" : "#1a1a2e",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: loading === t.id ? "not-allowed" : "pointer",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    transition: "background-color 0.2s ease",
                  }}
                >
                  {loading === t.id ? "Confirmando..." : "Confirmar Recepción"}
                </button>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TransactionList;
