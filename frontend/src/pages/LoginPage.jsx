import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const redirectTo = location.state?.from?.pathname || "/dashboard";

  function handleChange(event) {
    clearError();
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await login(formData);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      // L'erreur est deja remontee dans le contexte.
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-login">
        <section className="auth-showcase">
          <div className="auth-showcase-content">
            <h1>Bonjour, bienvenue !</h1>
            <p>Vous n'avez pas de compte ?</p>
            <Link to="/register" className="auth-outline-button">
              S'inscrire
            </Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Connexion</h2>
          </div>

          <form className="auth-modern-form" onSubmit={handleSubmit}>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <FormField
                id="identifier"
                label=""
                name="identifier"
                value={formData.identifier}
                onChange={handleChange}
                placeholder="Nom d'utilisateur ou email"
                autoComplete="username"
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔒</span>
              <FormField
                id="password"
                label=""
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mot de passe"
                autoComplete="current-password"
              />
            </div>

            <button type="button" className="auth-text-link">
              Mot de passe oublie ?
            </button>

            {error ? <p className="banner-error">{error}</p> : null}

            <button type="submit" className="auth-solid-button" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </button>
          </form>

          {/* <div className="auth-social-block">
            <p>ou connectez-vous avec les reseaux sociaux</p>
            <div className="auth-social-row">
              <button type="button" className="auth-social-btn">G</button>
              <button type="button" className="auth-social-btn">f</button>
              <button type="button" className="auth-social-btn">◎</button>
              <button type="button" className="auth-social-btn">in</button>
            </div>
          </div> */}
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
