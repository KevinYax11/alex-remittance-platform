import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Transaction } from "../../types";

interface Props {
  transactions: Transaction[];
}

const chartDates = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", timeZone: "America/Guatemala" });

export default function TransactionChart({ transactions }: Props) {
  const [currency, setCurrency] = useState<"USD" | "GTQ">("USD");
  if (!transactions.length) {
    return <p className="payments-empty payments-chart-empty">Registra una remesa para ver la tendencia.</p>;
  }

  const data = transactions.slice().reverse().map(transaction => ({
    date: chartDates.format(new Date(transaction.created_at)),
    amount: currency === "USD" ? transaction.amount_usd : transaction.amount_gtq,
  }));
  const money = new Intl.NumberFormat("es-GT", { style: "currency", currency });

  return (
    <>
      <div className="payments-chart-toolbar">
        <div className="payments-currency-toggle" role="group" aria-label="Moneda del gráfico">
          {(["USD", "GTQ"] as const).map(option => (
            <button key={option} type="button" aria-pressed={currency === option} onClick={() => setCurrency(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={208} minWidth={0}>
        <LineChart data={data} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 4" stroke="#dfe7e4" />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#526460" }} />
          <YAxis width={54} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#526460" }} />
          <Tooltip formatter={(value: number) => [money.format(value), currency]} />
          <Line type="monotone" dataKey="amount" stroke="#0e6656" strokeWidth={2.5}
            dot={{ r: 3, fill: "#0e6656" }} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </>
  );
}
