import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Transaction } from "../../types";

interface Props {
  transactions: Transaction[];
}

const TransactionChart = ({ transactions }: Props) => {
  const [currency, setCurrency] = useState<"usd" | "gtq">("usd");

  if (!transactions || transactions.length === 0) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          border: "1px dashed #d1d5db",
          borderRadius: "8px",
          color: "#6b7280",
          margin: "16px 0",
        }}
      >
        <p style={{ margin: "0 0 6px 0", fontWeight: 600, fontSize: "1rem", color: "#374151" }}>
          No hay remesas registradas para graficar
        </p>
        <p style={{ margin: 0, fontSize: "0.875rem" }}>
          La tendencia visual de tus envíos y solicitudes aparecerá aquí al registrar transacciones.
        </p>
      </div>
    );
  }

  const data = transactions
    .slice()
    .reverse()
    .map((t) => ({
      date: new Date(t.created_at).toLocaleDateString(),
      amount: currency === "usd" ? t.amount_usd : t.amount_gtq,
      amount_usd: t.amount_usd,
      amount_gtq: t.amount_gtq,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "10px 14px",
            border: "1px solid #e5e7eb",
            borderRadius: "6px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
          }}
        >
          <p style={{ margin: "0 0 6px 0", fontWeight: 600, color: "#111827" }}>{label}</p>
          <p style={{ margin: "0 0 4px 0", color: "#2563eb", fontSize: "0.875rem" }}>
            USD: ${payload[0]?.payload.amount_usd.toFixed(2)}
          </p>
          <p style={{ margin: 0, color: "#059669", fontSize: "0.875rem" }}>
            GTQ: Q{payload[0]?.payload.amount_gtq.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "0.9rem", color: "#6b7280", fontWeight: 500 }}>
          Visualizar moneda en el gráfico:
        </span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setCurrency("usd")}
            style={{
              backgroundColor: currency === "usd" ? "#1a1a2e" : "#f3f4f6",
              color: currency === "usd" ? "#ffffff" : "#374151",
              padding: "6px 14px",
              border: "1px solid",
              borderColor: currency === "usd" ? "#1a1a2e" : "#d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency("gtq")}
            style={{
              backgroundColor: currency === "gtq" ? "#1a1a2e" : "#f3f4f6",
              color: currency === "gtq" ? "#ffffff" : "#374151",
              padding: "6px 14px",
              border: "1px solid",
              borderColor: currency === "gtq" ? "#1a1a2e" : "#d1d5db",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: 600,
            }}
          >
            GTQ (Q)
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#e94560"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#e94560" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;