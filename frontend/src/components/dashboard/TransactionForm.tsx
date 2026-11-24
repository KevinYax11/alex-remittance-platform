import { useState } from "react";
import { createTransaction } from "../../api/transactions";
import { DashboardRole } from "../../types";

interface Props {
  view: DashboardRole;
  onSuccess: () => void;
}

export default function TransactionForm({ view, onSuccess }: Props) {
  const [amount, setAmount] = useState("");
  const [beneficiaryEmail, setBeneficiaryEmail] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "error" | "success"; message: string }>();
  const isSender = view === "emisor";
  const currency = isSender ? "USD" : "GTQ";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFeedback(undefined);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFeedback({ kind: "error", message: "Ingresa un monto mayor a 0." });
      return;
    }

    setLoading(true);
    try {
      const transaction = await createTransaction({
        type: isSender ? "envio" : "solicitud",
        amount_usd: isSender ? parsedAmount : undefined,
        amount_gtq: !isSender ? parsedAmount : undefined,
        beneficiary_email: isSender ? beneficiaryEmail.trim() : undefined,
        note: note.trim() || undefined,
      });
      setAmount("");
      setBeneficiaryEmail("");
      setNote("");
      setFeedback({
        kind: "success",
        message: `${isSender ? "Remesa" : "Solicitud"} #${transaction.id} registrada.`,
      });
      onSuccess();
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      setFeedback({
        kind: "error",
        message: typeof detail === "string" ? detail : "No se pudo registrar la operación. Inténtalo de nuevo.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="payments-panel payments-form-panel" aria-labelledby="payments-form-title">
      <header className="payments-panel-heading">
        <div>
          <h2 id="payments-form-title">{isSender ? "Nueva remesa" : "Solicitar fondos"}</h2>
          <p>{isSender ? "Selecciona a quién enviar la remesa." : "Registra una solicitud en quetzales."}</p>
        </div>
      </header>
      <form className="payments-form" onSubmit={handleSubmit}>
        <label className="payments-field">
          <span>Monto</span>
          <span className="payments-money-field">
            <span aria-hidden="true">{isSender ? "$" : "Q"}</span>
            <input type="number" placeholder={isSender ? "150.00" : "1,000.00"}
              aria-label={`Monto en ${currency}`} min="0.01" step="0.01" required
              value={amount} onChange={event => setAmount(event.target.value)} disabled={loading} />
            <span aria-hidden="true">{currency}</span>
          </span>
        </label>
        {isSender && (
          <label className="payments-field">
            <span>Correo del beneficiario</span>
            <input type="email" value={beneficiaryEmail} onChange={event => setBeneficiaryEmail(event.target.value)}
              placeholder="correo@ejemplo.com" required disabled={loading} />
          </label>
        )}
        <label className="payments-field">
          <span>Nota <small>Opcional</small></span>
          <input type="text" placeholder="Motivo de la operación" value={note}
            onChange={event => setNote(event.target.value)} disabled={loading} />
        </label>
        <div className="payments-form-action">
          <button type="submit" className="payments-button payments-primary" disabled={loading}>
            {loading ? "Procesando…" : isSender ? "Enviar remesa" : "Solicitar dinero"}
            <span aria-hidden="true"> {isSender ? "↗" : "→"}</span>
          </button>
          {feedback && (
            <p className={`payments-feedback payments-${feedback.kind}`} role={feedback.kind === "error" ? "alert" : "status"}>
              {feedback.message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
