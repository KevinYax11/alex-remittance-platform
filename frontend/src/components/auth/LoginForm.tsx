import { isAxiosError } from "axios";
import { useState } from "react";
import { loginApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

const demoAccounts = [
  { email: "sender@sendapayments.com", name: "Remitente", detail: "Enviar una remesa" },
  { email: "receiver@sendapayments.com", name: "Beneficiario", detail: "Confirmar una remesa" },
];
const demoEnabled = process.env.REACT_APP_DEMO_MODE === "true";

export default function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string>();
  const busy = pending !== undefined;

  async function signIn(signInEmail: string, signInPassword: string, method: string) {
    if (busy) return;
    setError("");
    if (!signInEmail.trim() || !signInPassword) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }

    setPending(method);
    try {
      const user = await loginApi({ email: signInEmail.trim(), password: signInPassword });
      login(user);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 401) {
        setError("El correo o la contraseña son incorrectos.");
      } else if (isAxiosError(error) && !error.response) {
        setError("No pudimos conectar con el servidor. Inténtalo de nuevo.");
      } else {
        setError("No pudimos iniciar sesión. Inténtalo de nuevo.");
      }
    } finally {
      setPending(undefined);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void signIn(email, password, "manual");
  }

  return (
    <>
      {error && <p className="payments-login-error" role="alert">{error}</p>}
      <form className="payments-login-form" onSubmit={handleSubmit} aria-busy={pending === "manual"}>
        <div className="payments-login-field">
          <label htmlFor="login-email">Correo electrónico</label>
          <input id="login-email" name="email" type="email" inputMode="email" autoComplete="username"
            value={email} onChange={event => setEmail(event.target.value)} required disabled={busy} />
        </div>
        <div className="payments-login-field">
          <label htmlFor="login-password">Contraseña</label>
          <div className="payments-password-field">
            <input id="login-password" name="password" type={passwordVisible ? "text" : "password"}
              autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)}
              required disabled={busy} />
            <button type="button" className="payments-password-toggle" aria-controls="login-password"
              aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
              disabled={busy} onClick={() => setPasswordVisible(visible => !visible)}>
              {passwordVisible ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>
        <button type="submit" className="payments-login-submit" disabled={busy}>
          {pending === "manual" ? "Entrando…" : "Entrar"}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      {demoEnabled && (
        <section className="payments-demo" aria-labelledby="payments-demo-title">
          <h2 id="payments-demo-title">Probar la demo</h2>
          <div className="payments-demo-options">
            {demoAccounts.map(account => (
              <button key={account.email} type="button" aria-label={`Probar como ${account.name}`}
                disabled={busy} onClick={() => void signIn(account.email, "SendaPass123!", account.email)}>
                <span>
                  <strong>{account.name}</strong>
                  <small>{pending === account.email ? "Entrando…" : account.detail}</small>
                </span>
                <span className="payments-demo-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
          <p className="payments-demo-note">Las operaciones de demo son simuladas.</p>
        </section>
      )}
    </>
  );
}
