import { useEffect, useState } from "react";
import { getTransactions } from "../../api/transactions";
import { DashboardRole, TransactionListResponse } from "../../types";
import Navbar from "../common/Navbar";
import DashboardPagination from "./DashboardPagination";
import TransactionChart from "./TransactionChart";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import "./payments-dashboard.css";

interface Props {
  role: DashboardRole;
}

export default function TransactionsDashboard({ role }: Props) {
  const isSender = role === "emisor";
  const [page, setPage] = useState(1);
  const [requestVersion, setRequestVersion] = useState(0);
  const [result, setResult] = useState<TransactionListResponse>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  function refresh() {
    setLoading(true);
    setError(false);
    setRequestVersion(version => version + 1);
  }

  function goTo(nextPage: number) {
    if (nextPage === page) return;
    setLoading(true);
    setError(false);
    setPage(nextPage);
  }

  function handleCreated() {
    setPage(1);
    refresh();
  }

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const data = await getTransactions(page, 10, controller.signal, role);
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.page_size));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setResult(data);
        setLoading(false);
      } catch {
        if (controller.signal.aborted) return;
        setError(true);
        setLoading(false);
      }
    }

    void load();
    return () => controller.abort();
  }, [page, requestVersion, role]);

  const current = result?.page === page ? result : undefined;

  return (
    <div className="payments-dashboard" data-role={role}>
      <Navbar />
      <main className="payments-wrap payments-main">
        <header className="payments-hero">
          <div>
            <p className="payments-role">{isSender ? "Remitente" : "Beneficiario"}</p>
            <h1>{isSender ? "Envíos y transferencias" : "Recepción de remesas"}</h1>
            <p>{isSender ? "Envía remesas en dólares y consulta su estado y el equivalente en quetzales."
              : "Consulta los envíos a tu cuenta, confirma su recepción o solicita fondos."}</p>
          </div>
          <span className="payments-currency-pair" aria-label={isSender ? "De USD a GTQ" : "De GTQ a USD"}>
            {isSender ? "USD" : "GTQ"} <span aria-hidden="true">→</span> {isSender ? "GTQ" : "USD"}
          </span>
        </header>

        <div className={isSender ? "payments-workspace payments-workspace-sender" : "payments-workspace"}>
          <TransactionForm view={role} onSuccess={handleCreated} />
          {isSender && (
            <section className="payments-panel payments-chart" aria-labelledby="payments-chart-title">
              <div className="payments-panel-heading">
                <div>
                  <h2 id="payments-chart-title">Tendencia de envíos</h2>
                  <p>Movimientos de la página actual</p>
                </div>
              </div>
              <div hidden={!current}>
                <TransactionChart transactions={current?.items.filter(item => item.type === "envio") ?? []} />
              </div>
              {!current && <p className="payments-empty">{error ? "Gráfico no disponible." : "Cargando gráfico…"}</p>}
            </section>
          )}
        </div>

        <section className="payments-panel payments-history" aria-labelledby="payments-history-title">
          <header className="payments-panel-heading payments-history-heading">
            <div>
              <h2 id="payments-history-title">Historial de transacciones</h2>
              <p>{isSender ? "Consulta tus envíos y las solicitudes dirigidas a tu cuenta."
                : "Consulta tus solicitudes y confirma los envíos que recibas."}</p>
            </div>
          </header>
          {error && (
            <div className="payments-history-state">
              <p role="alert">No pudimos cargar el historial.</p>
              <button className="payments-button payments-outline" type="button" onClick={refresh}>Reintentar</button>
            </div>
          )}
          <div aria-busy={loading}>
            {current && <TransactionList view={role} transactions={current.items} onRefresh={refresh} />}
          </div>
          {result && (
            <DashboardPagination page={page} pageSize={result.page_size} total={result.total} onPageChange={goTo} />
          )}
          {loading && <p className="payments-history-state" role="status">Cargando transacciones…</p>}
        </section>
      </main>
    </div>
  );
}
