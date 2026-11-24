import { useState } from "react";
import { confirmTransaction } from "../../api/transactions";
import { useAuth } from "../../context/AuthContext";
import { DashboardRole, Transaction } from "../../types";

interface Props {
  view: DashboardRole;
  transactions: Transaction[];
  onRefresh: () => void;
}

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const decimals = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dates = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "short", year: "numeric", timeZone: "America/Guatemala" });

export default function TransactionList({ view, transactions, onRefresh }: Props) {
  const { user } = useAuth();
  const [confirming, setConfirming] = useState<number>();
  const [actionError, setActionError] = useState("");

  async function handleConfirm(id: number) {
    setActionError("");
    setConfirming(id);
    try {
      await confirmTransaction(id);
      onRefresh();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      setActionError(typeof detail === "string" ? detail : "No se pudo confirmar la transacción.");
    } finally {
      setConfirming(undefined);
    }
  }

  if (!transactions.length) {
    return <p className="payments-empty payments-history-empty">Aún no hay transacciones en tu historial.</p>;
  }

  return (
    <>
      {actionError && <p className="payments-feedback payments-error payments-history-state" role="alert">{actionError}</p>}
      <ul className="payments-transactions" aria-label="Transacciones">
        {transactions.map(transaction => {
          const isTransfer = transaction.type === "envio";
          const receivedRequest = transaction.requested_from_id === user?.user_id;
          const isConfirmed = transaction.status === "confirmado";
          const canConfirm = view === "receptor" && isTransfer && !isConfirmed
            && transaction.beneficiary_id === user?.user_id;

          return (
            <li key={transaction.id} className="payments-transaction">
              <div className="payments-transaction-detail">
                <span className={`payments-transaction-icon${!isTransfer ? " payments-request-icon" : ""}`} aria-hidden="true">
                  {isTransfer ? "↗" : "↙"}
                </span>
                <div>
                  <div className="payments-transaction-name">
                    <strong>{isTransfer ? "Envío de remesa" : receivedRequest ? "Solicitud recibida" : "Solicitud enviada"}</strong>
                    <span>#{transaction.id}</span>
                  </div>
                  <time dateTime={transaction.created_at}>{dates.format(new Date(transaction.created_at))}</time>
                  {!isTransfer && (
                    <p className="payments-transaction-note">
                      {receivedRequest ? `De: ${transaction.requester_email}`
                        : transaction.requested_from_email ? `Para: ${transaction.requested_from_email}`
                          : "Solicitud anterior sin destinatario"}
                    </p>
                  )}
                  {transaction.note && <p className="payments-transaction-note">{transaction.note}</p>}
                </div>
              </div>

              <div className="payments-amounts">
                <strong>{dollars.format(transaction.amount_usd)} <small>USD</small></strong>
                <strong>Q{decimals.format(transaction.amount_gtq)} <small>GTQ</small></strong>
                <span>Tasa Q{decimals.format(transaction.exchange_rate)} por USD</span>
              </div>

              <div className="payments-transaction-actions">
                <span className={`payments-badge ${isConfirmed ? "payments-confirmed" : "payments-pending"}`}>
                  {isConfirmed ? "Confirmado" : "Pendiente"}
                </span>
                {canConfirm && (
                  <button type="button" className="payments-button payments-outline"
                    disabled={confirming !== undefined} onClick={() => handleConfirm(transaction.id)}>
                    {confirming === transaction.id ? "Confirmando…" : "Confirmar recepción"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
