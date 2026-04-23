import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import FormField from "../components/FormField";
import { useAuth } from "../hooks/useAuth";

const INITIAL_FORM = {
  username: "",
  email: "",
  password: "",
  password_confirm: "",
};

function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [successMessage, setSuccessMessage] = useState("");

  function handleChange(event) {
    clearError();
    setSuccessMessage("");
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      await register(formData);
      setSuccessMessage("Compte cree avec succes. Connecte-toi maintenant.");
      setFormData(INITIAL_FORM);
      window.setTimeout(() => navigate("/login"), 800);
    } catch (submitError) {
      // L'erreur est deja geree par le contexte.
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-shell auth-shell-register">
        <section className="auth-panel">
          <div className="auth-panel-header">
            <h2>Inscription</h2>
          </div>

          <form className="auth-modern-form" onSubmit={handleSubmit}>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">👤</span>
              <FormField
                id="username"
                label=""
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Nom d'utilisateur"
                autoComplete="username"
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉️</span>
              <FormField
                id="email"
                label=""
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                autoComplete="email"
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
                autoComplete="new-password"
              />
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">🔐</span>
              <FormField
                id="password_confirm"
                label=""
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                placeholder="Confirmer le mot de passe"
                autoComplete="new-password"
              />
            </div>

            {error ? <p className="banner-error">{error}</p> : null}
            {successMessage ? <p className="banner-success">{successMessage}</p> : null}

            <button type="submit" className="auth-solid-button" disabled={isLoading}>
              {isLoading ? "Creation..." : "S'inscrire"}
            </button>
          </form>

          {/* <div className="auth-social-block">
            <p>ou inscrivez-vous avec les reseaux sociaux</p>
            <div className="auth-social-row">
              <button type="button" className="auth-social-btn">G</button>
              <button type="button" className="auth-social-btn">f</button>
              <button type="button" className="auth-social-btn">◎</button>
              <button type="button" className="auth-social-btn">in</button>
            </div>
          </div> */}
        </section>

        <section className="auth-showcase">
          <div className="auth-showcase-content">
            <h1>Bon retour !</h1>
            <p>Vous avez deja un compte ?</p>
            <Link to="/login" className="auth-outline-button">
              Se connecter
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

export default RegisterPage;
