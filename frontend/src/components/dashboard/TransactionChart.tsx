import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import { Transaction } from "../../types";

interface Props {
  transactions: Transaction[];
}

const TransactionChart = ({ transactions }: Props) => {
  const [currency, setCurrency] = useState<"usd" | "gtq">("usd");

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
        <div style={{ backgroundColor: "#fff", padding: "10px", border: "1px solid #ccc" }}>
          <p><strong>{label}</strong></p>
          <p>USD: ${payload[0]?.payload.amount_usd}</p>
          <p>GTQ: Q{payload[0]?.payload.amount_gtq}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button
          onClick={() => setCurrency("usd")}
          style={{ backgroundColor: currency === "usd" ? "#1a1a2e" : "#ccc", color: currency === "usd" ? "white" : "black", padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          USD
        </button>
        <button
          onClick={() => setCurrency("gtq")}
          style={{ backgroundColor: currency === "gtq" ? "#1a1a2e" : "#ccc", color: currency === "gtq" ? "white" : "black", padding: "6px 12px", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          GTQ
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="amount" stroke="#e94560" strokeWidth={2} dot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionChart;