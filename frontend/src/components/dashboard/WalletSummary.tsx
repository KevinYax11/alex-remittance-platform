import { WalletBalance } from "../../types";

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const quetzales = new Intl.NumberFormat("es-GT", { style: "currency", currency: "GTQ" });

export default function WalletSummary({ balance }: { balance?: WalletBalance }) {
  return (
    <section className="payments-wallet" aria-labelledby="payments-wallet-title" aria-busy={!balance}>
      <header className="payments-wallet-heading">
        <h2 id="payments-wallet-title">Saldo de prueba</h2>
        <p>{balance && Number(balance.demo_credit_usd) > 0
          ? `Esta cuenta recibió un crédito único de prueba de ${dollars.format(Number(balance.demo_credit_usd))} USD.`
          : "Cada cuenta nueva empieza con USD 1,000 para enviar remesas."}</p>
      </header>
      <dl className="payments-wallet-grid" aria-live="polite">
        <div>
          <dt>Disponible para enviar <span>USD</span></dt>
          <dd>{balance ? dollars.format(Number(balance.available_usd)) : "—"}</dd>
        </div>
        <div>
          <dt>Recibido y disponible <span>GTQ</span></dt>
          <dd>{balance ? quetzales.format(Number(balance.available_gtq)) : "—"}</dd>
        </div>
        <div>
          <dt>Por confirmar <span>GTQ</span></dt>
          <dd>{balance ? quetzales.format(Number(balance.pending_gtq)) : "—"}</dd>
        </div>
      </dl>
    </section>
  );
}
