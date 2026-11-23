import { useState, useEffect, useCallback } from "react";
import { getTransactions } from "../api/transactions";
import { Transaction } from "../types";
import Navbar from "../components/common/Navbar";
import TransactionChart from "../components/dashboard/TransactionChart";
import TransactionForm from "../components/dashboard/TransactionForm";
import TransactionList from "../components/dashboard/TransactionList";

const EmisorPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions(page);
      setTransactions(data.items);
      setTotalPages(Math.ceil(data.total / data.page_size));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return (
    <div>
      <Navbar />
      <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
        <h2>Panel de Envíos y Transferencias</h2>
        <TransactionForm onSuccess={fetchTransactions} />
        <h3>Tendencia de Envíos</h3>
        {loading ? <p>Cargando gráfico...</p> : <TransactionChart transactions={transactions} />}
        <TransactionList transactions={transactions} onRefresh={fetchTransactions} />
        <div style={{ display: "flex", gap: "10px", marginTop: "20px", alignItems: "center" }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </button>
          <span>Página {page}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={loading || page >= totalPages}>
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmisorPage;
