import { useState } from "react";
import { HeartHandshake, Building2, Utensils, User, Eye, EyeOff } from "lucide-react";
import { api } from "../api/http";
import { useSession } from "../store/session";

const ROLES = [
  { id: "citizen", label: "Citoyen", icon: User, desc: "Signalez des personnes en difficulté" },
  { id: "association", label: "Association", icon: Building2, desc: "Gérez les interventions terrain" },
  { id: "restaurant", label: "Restaurateur", icon: Utensils, desc: "Déclarez vos invendus alimentaires" }
];

const SERVICES = [
  { id: "food", label: "Alimentation" },
  { id: "shelter", label: "Hébergement" },
  { id: "health", label: "Soins médicaux" },
  { id: "clothes", label: "Vêtements" },
  { id: "hygiene", label: "Hygiène" },
  { id: "psychological", label: "Soutien psychologique" }
];

export function AuthPage({ initialMode = "login", onNavigate }) {
  const setSession = useSession((state) => state.setSession);
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const body =
        mode === "register"
          ? {
              ...payload,
              role,
              consentRgpd: payload.consentRgpd === "on",
              services: form.getAll("services"),
              interventionZone:
                role === "association"
                  ? {
                      center: {
                        coordinates: [Number(payload.lng || 2.3522), Number(payload.lat || 48.8566)]
                      },
                      radiusKm: Number(payload.radiusKm || 8)
                    }
                  : role === "restaurant"
                  ? {
                      center: {
                        coordinates: [Number(payload.lng || 2.3522), Number(payload.lat || 48.8566)]
                      },
                      radiusKm: 0
                    }
                  : undefined
            }
          : { email: payload.email, password: payload.password };
      const { data } = await api.post(`/auth/${mode === "register" ? "register" : "login"}`, body);
      setSession(data);
    } catch (err) {
      setError(err.response?.data?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-layout">
      {/* LEFT PANEL: Login / Registration Form */}
      <section className="auth-panel">
        {/* Back to landing */}
        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate("landing")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 0", marginBottom: 8, transition: "color var(--transition)"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--brand-500)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-muted)"}
          >
            ← Retour à l'accueil
          </button>
        )}
        <div className="auth-brand">
          <div className="brand-icon-lg">
            <HeartHandshake size={28} color="white" />
          </div>
          <div>
            <strong>SOS Link</strong>
            <span>Service of Solidarity — Île-de-France</span>
          </div>
        </div>

        <div className="segmented">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            Connexion
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
            Inscription
          </button>
        </div>

        {mode === "register" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Type de compte
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ROLES.map(({ id, label, icon: Icon, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 14px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${role === id ? "var(--brand-400)" : "var(--border)"}`,
                    background: role === id ? "var(--brand-50)" : "var(--surface-card)",
                    cursor: "pointer",
                    transition: "all var(--transition)",
                    textAlign: "left"
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: "var(--radius-sm)",
                    background: role === id ? "var(--brand-100)" : "var(--surface-subtle)",
                    color: role === id ? "var(--brand-500)" : "var(--text-muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "all var(--transition)"
                  }}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>{label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="form-grid">
          <label>
            Adresse email
            <input name="email" type="email" required placeholder="exemple@mail.com" />
          </label>
          <label>
            Mot de passe
            <div style={{ position: "relative" }}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                minLength="8"
                required
                placeholder={mode === "register" ? "Minimum 8 caractères" : "••••••••"}
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                  color: "var(--text-muted)", padding: 4, background: "none", border: "none"
                }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </label>

          {mode === "register" && role !== "citizen" && (
            <>
              <label>
                Nom de la structure
                <input name="organizationName" required placeholder={role === "restaurant" ? "Nom du restaurant / commerce" : "Nom de l'association"} />
              </label>
              <label>
                SIREN / SIRET
                <input name="sirenSiret" required placeholder="9 ou 14 chiffres" />
              </label>
              <label>
                Adresse
                <input name="address" placeholder="Adresse complète" />
              </label>
              <label>
                Téléphone
                <input name="phone" type="tel" placeholder="Optionnel" />
              </label>
            </>
          )}

          {mode === "register" && role === "association" && (
            <>
              <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: 14, border: "1.5px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  Zone d'intervention
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label>
                    Longitude (centre)
                    <input name="lng" type="number" step="0.0001" defaultValue="2.3522" />
                  </label>
                  <label>
                    Latitude (centre)
                    <input name="lat" type="number" step="0.0001" defaultValue="48.8566" />
                  </label>
                </div>
                <label style={{ marginTop: 10 }}>
                  Rayon d'intervention (km)
                  <input name="radiusKm" type="number" defaultValue="8" min="1" max="100" />
                </label>
              </div>
              <fieldset>
                <legend>Services proposés</legend>
                {SERVICES.map(({ id, label }) => (
                  <label key={id} className="check">
                    <input type="checkbox" name="services" value={id} />
                    {label}
                  </label>
                ))}
              </fieldset>
            </>
          )}

          {mode === "register" && role === "restaurant" && (
            <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: 14, border: "1.5px solid var(--border)" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                Localisation de votre établissement
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label>
                  Longitude
                  <input name="lng" type="number" step="0.0001" defaultValue="2.3522" />
                </label>
                <label>
                  Latitude
                  <input name="lat" type="number" step="0.0001" defaultValue="48.8566" />
                </label>
              </div>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                Ces coordonnées permettent d'associer automatiquement vos dons à l'association locale compétente.
              </p>
            </div>
          )}

          {mode === "register" && role === "association" && (
            <label>
              Lien HelloAsso (pour recevoir des dons — optionnel)
              <input name="helloAssoUrl" type="url" placeholder="https://www.helloasso.com/associations/..." />
            </label>
          )}

          {mode === "register" && (
            <label className="check full" style={{ padding: "10px 12px", background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", border: "1.5px solid var(--border)" }}>
              <input name="consentRgpd" type="checkbox" required />
              <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                J'accepte la collecte minimale des données nécessaires au service, conformément à la{" "}
                <a href="#" style={{ color: "var(--brand-500)" }}>politique de confidentialité</a>.
              </span>
            </label>
          )}

          {error && <p className="error">{error}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading
              ? "..."
              : mode === "login"
              ? "Se connecter"
              : role === "citizen"
              ? "Créer mon compte"
              : "Soumettre ma candidature"}
          </button>

          {mode === "register" && role !== "citizen" && (
            <p style={{ fontSize: 11, color: "var(--text-muted)", textAlign: "center" }}>
              Les comptes associations et restaurateurs sont activés après validation manuelle par l'administrateur.
            </p>
          )}
        </form>
      </section>

      {/* RIGHT PANEL: Classic image and badges layout matching the screenshot */}
      <section className="auth-visual" style={{ overflow: "hidden", display: "flex", alignItems: "flex-end" }}>
        <div style={{ zIndex: 2 }}>
          <div className="auth-badges" style={{ marginBottom: 20 }}>
            <span className="auth-badge" style={{ background: "rgba(34, 150, 243, 0.25)", borderColor: "rgba(34, 150, 243, 0.4)" }}>🗺️ Île-de-France</span>
            <span className="auth-badge" style={{ background: "rgba(234, 179, 8, 0.25)", borderColor: "rgba(234, 179, 8, 0.4)" }}>💛 Phase pilote</span>
            <span className="auth-badge" style={{ background: "rgba(108, 117, 125, 0.25)", borderColor: "rgba(108, 117, 125, 0.4)" }}>🔒 RGPD</span>
          </div>
          <h1 style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>Signaler, orienter, intervenir plus vite.</h1>
          <p style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)", margin: 0 }}>
            SOS Link coordonne citoyens, associations humanitaires et commerces alimentaires
            pour réduire les délais d'intervention auprès des personnes en grande précarité.
          </p>
        </div>
      </section>
    </main>
  );
}
