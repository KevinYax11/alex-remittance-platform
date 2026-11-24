import { isAxiosError } from "axios";
import { useState } from "react";
import { registerApi } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

export default function RegisterForm() {
  const { login } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError("");

    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    if (password !== values.get("confirmation")) {
      setError("Las contraseñas deben coincidir.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("La contraseña supera el límite de 72 bytes.");
      return;
    }

    setPending(true);
    try {
      const user = await registerApi({
        full_name: String(values.get("name") ?? "").trim(),
        email: String(values.get("email") ?? "").trim(),
        password,
        accept_terms: values.get("terms") === "on",
      });
      login(user);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setError("Ese correo ya tiene una cuenta. Puedes iniciar sesión.");
      } else if (isAxiosError(error) && error.response?.status === 422) {
        setError("Revisa el nombre, el correo, la contraseña y la aceptación de condiciones.");
      } else {
        setError("No pudimos crear la cuenta. Inténtalo de nuevo.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {error && <p className="payments-login-error" role="alert">{error}</p>}
      <form className="payments-login-form" onSubmit={handleSubmit} aria-busy={pending}>
        <div className="payments-login-field">
          <label htmlFor="register-name">Nombre completo</label>
          <input id="register-name" name="name" autoComplete="name" minLength={2} maxLength={100}
            required disabled={pending} />
        </div>
        <div className="payments-login-field">
          <label htmlFor="register-email">Correo electrónico</label>
          <input id="register-email" name="email" type="email" autoComplete="email" required disabled={pending} />
        </div>
        <div className="payments-login-field">
          <label htmlFor="register-password">Contraseña</label>
          <input id="register-password" name="password" type="password" autoComplete="new-password"
            aria-describedby="register-password-hint" minLength={8} maxLength={72} required disabled={pending} />
          <small id="register-password-hint" className="payments-register-hint">Usa al menos 8 caracteres.</small>
        </div>
        <div className="payments-login-field">
          <label htmlFor="register-confirmation">Confirmar contraseña</label>
          <input id="register-confirmation" name="confirmation" type="password" autoComplete="new-password"
            required disabled={pending} />
        </div>
        <details className="payments-register-terms">
          <summary>Condiciones de uso de la demo</summary>
          <p>Senda Payments simula remesas con fines de prueba. Las operaciones no mueven dinero.
            Usa datos de prueba y evita incluir datos bancarios o información sensible en las notas.</p>
          <p>La aplicación guarda tu nombre, correo, hash de tu contraseña y el registro de tu aceptación
            para que puedas acceder y consultar el historial de tu cuenta.</p>
        </details>
        <label className="payments-register-consent">
          <input name="terms" type="checkbox" required disabled={pending} />
          <span>Acepto las condiciones de uso de la demo.</span>
        </label>
        <button className="payments-login-submit" type="submit" disabled={pending}>
          {pending ? "Creando cuenta…" : "Crear cuenta"} <span aria-hidden="true">→</span>
        </button>
      </form>
    </>
  );
}
