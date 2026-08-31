import { useState } from "react";
import {
  HeartHandshake, MapPin, Users, Store, Shield,
  ArrowRight, PhoneCall, ChevronRight, Zap, CheckCircle2,
  Navigation, Eye, Clock, ShieldCheck
} from "lucide-react";
import { QuickReportModal } from "../components/QuickReportModal";

export function LandingPage({ onNavigate }) {
  const [showQuickReport, setShowQuickReport] = useState(false);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-page">
      {/* ── HEADER ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand" style={{ cursor: "pointer" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="landing-nav-logo">
              <HeartHandshake size={22} color="white" />
            </div>
            <div>
              <span className="landing-nav-name">SOS Link</span>
              <span className="landing-nav-sub">Île-de-France · Phase pilote</span>
            </div>
          </div>

          <div className="landing-nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <button className="nav-link-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Accueil</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("comment-ca-marche")}>Comment ça marche</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("acteurs")}>Acteurs</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("carte")}>Carte</button>
          </div>

          <div className="landing-nav-actions">
            <button className="landing-nav-btn-ghost" onClick={() => onNavigate("register")}>
              S'inscrire
            </button>
            <button className="landing-nav-btn-ghost" onClick={() => onNavigate("login")}>
              Se connecter
            </button>
            <button
              className="landing-nav-btn-primary"
              onClick={() => setShowQuickReport(true)}
              style={{
                background: "var(--color-primary)",
                color: "#FFFFFF",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Zap size={16} /> Signaler
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="landing-hero" style={{ background: "var(--color-background)", padding: "72px 0 88px" }}>
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div
              className="landing-hero-badge"
              style={{
                background: "#FFFFFF",
                color: "var(--color-primary)",
                border: "1px solid var(--color-border-strong)",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: 12,
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <CheckCircle2 size={13} style={{ color: "var(--color-primary)" }} /> VERSION 1.1 · ÎLE-DE-FRANCE
            </div>

            <h1 className="landing-hero-title" style={{ color: "var(--color-text)", fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.08 }}>
              Signaler.<br />
              Orienter.<br />
              <span style={{ color: "var(--color-primary)" }}>Intervenir plus vite.</span>
            </h1>

            <p className="landing-hero-desc" style={{ maxWidth: 600, color: "var(--color-text-secondary)", fontSize: 17, lineHeight: 1.65 }}>
              SOS Link connecte citoyens, associations et commerces pour faciliter une intervention rapide auprès des personnes en situation de précarité en Île-de-France.
            </p>

            <div className="landing-hero-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
              <button
                onClick={() => setShowQuickReport(true)}
                style={{
                  background: "var(--color-primary)",
                  color: "#FFFFFF",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 26px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "var(--shadow-cta-green)"
                }}
              >
                <Zap size={18} /> Signaler maintenant
              </button>

              <button
                onClick={() => onNavigate("register")}
                style={{
                  background: "#FFFFFF",
                  color: "var(--color-primary)",
                  border: "1.5px solid var(--color-border-strong)",
                  fontWeight: 700,
                  fontSize: 15,
                  padding: "14px 24px",
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                Créer un compte <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="landing-hero-visual" style={{ position: "relative" }}>
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80"
              alt="Solidarité et maraude en Île-de-France"
              style={{
                width: "100%",
                height: 440,
                objectFit: "cover",
                borderRadius: 24,
                border: "1px solid var(--color-border)",
                boxShadow: "0 12px 40px rgba(6,78,59,0.10)"
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                background: "#FFFFFF",
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--shadow-md)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text)"
              }}
            >
              <MapPin size={15} style={{ color: "var(--color-primary)" }} /> Île-de-France · Phase pilote
            </div>
          </div>
        </div>
      </header>

      {/* ── STATISTICS ── */}
      <section style={{ background: "#FFFFFF", padding: "48px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
        <div className="landing-section-inner" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, textAlign: "center" }}>
          <div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "var(--color-primary-deep)", lineHeight: 1 }}>
              4
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)", marginTop: 6 }}>
              types d'acteurs
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
              Citoyens, associations, commerces et coordinateurs
            </div>
          </div>

          <div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "var(--color-primary-deep)", lineHeight: 1 }}>
              100%
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)", marginTop: 6 }}>
              service gratuit
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
              Sans publicité · Plateforme solidaire
            </div>
          </div>

          <div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "var(--color-primary-deep)", lineHeight: 1 }}>
              24/7
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-primary)", marginTop: 6 }}>
              signalement disponible
            </div>
            <div style={{ fontSize: 13, color: "var(--color-text-muted)", marginTop: 4 }}>
              Accessible sans création de compte
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="comment-ca-marche" style={{ background: "#FFFFFF", padding: "96px 0" }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: 1 }}>
              PARCOURS DE SIGNALEMENT
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", marginTop: 8 }}>
              Comment fonctionne SOS Link ?
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32, position: "relative" }}>
            {[
              {
                num: "01",
                title: "SIGNALER",
                desc: "Un citoyen signale rapidement une situation depuis son smartphone en précisant le besoin et la localisation.",
                icon: <MapPin size={24} />
              },
              {
                num: "02",
                title: "ORIENTER",
                desc: "Le signalement est transmis automatiquement au bon acteur (association ou maraude locale compétente).",
                icon: <Zap size={24} />
              },
              {
                num: "03",
                title: "INTERVENIR",
                desc: "Les acteurs concernés peuvent agir rapidement sur le terrain et mettre à jour le statut du dossier.",
                icon: <ShieldCheck size={24} />
              }
            ].map(({ num, title, desc, icon }) => (
              <div
                key={num}
                style={{
                  background: "var(--color-background-soft)",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "var(--radius-md)",
                      background: "var(--color-green-light)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    {icon}
                  </div>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "var(--color-primary)" }}>{num}</span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.65, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTORS ── */}
      <section id="acteurs" style={{ background: "var(--color-background)", padding: "96px 0" }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: 1 }}>
              ÉCOSYSTÈME SOLIDAIRE
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", marginTop: 8 }}>
              Un réseau d'acteurs mobilisés
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 640, margin: "12px auto 0" }}>
              Tous les acteurs partagent la même identité visuelle et la même plateforme pour une clarté optimale.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              {
                title: "CITOYENS",
                desc: "Signaler une situation rapidement sans création de compte obligatoire.",
                icon: <Users size={22} />
              },
              {
                title: "ASSOCIATIONS",
                desc: "Recevoir, traiter et suivre les signalements dans leur secteur géographique.",
                icon: <HeartHandshake size={22} />
              },
              {
                title: "COMMERCES",
                desc: "Participer aux actions de solidarité et faire des dons d'invendus alimentés par IA.",
                icon: <Store size={22} />
              },
              {
                title: "COORDINATEURS",
                desc: "Superviser les signalements et coordonner les interventions à l'échelle régionale.",
                icon: <Shield size={22} />
              }
            ].map(({ title, desc, icon }) => (
              <div
                key={title}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  padding: 28,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: "var(--shadow-card)",
                  transition: "all 0.2s ease"
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: "var(--radius-md)",
                    background: "var(--color-green-light)",
                    color: "var(--color-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {icon}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)", margin: 0 }}>{title}</h3>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, margin: 0 }}>{desc}</p>
                <button
                  onClick={() => onNavigate("register")}
                  style={{
                    marginTop: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    fontSize: 13,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Rejoindre <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MAP SECTION ── */}
      <section id="carte" style={{ background: "#FFFFFF", padding: "96px 0", borderTop: "1px solid var(--color-border)" }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: 1 }}>
              GEOLOCALISATION TERRAIN
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", marginTop: 8 }}>
              Les signalements, au bon endroit.
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 640, margin: "8px auto 0" }}>
              Une cartographie claire identifiant la priorité des interventions.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-background-soft)",
              border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {/* Map Legend */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, padding: "8px 0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                Signalement Normal (Vert)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "var(--color-text)" }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-emergency)", display: "inline-block" }} />
                Signalement Urgent (Rouge)
              </div>
            </div>

            {/* Simulated map placeholder container */}
            <div
              style={{
                width: "100%",
                height: 340,
                borderRadius: "var(--radius-lg)",
                background: "#E6F4EF",
                border: "1px solid var(--color-border-strong)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <div style={{ position: "absolute", top: "35%", left: "40%", display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", padding: "6px 12px", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-sm)", fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                <MapPin size={16} style={{ color: "var(--color-primary)", fill: "var(--color-green-light)" }} /> Paris 10e · Besoin alimentaire
              </div>

              <div style={{ position: "absolute", top: "55%", left: "60%", display: "flex", alignItems: "center", gap: 6, background: "var(--color-emergency-light)", padding: "6px 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-emergency-border)", boxShadow: "var(--shadow-sm)", fontSize: 12, fontWeight: 800, color: "var(--color-emergency-dark)" }}>
                <MapPin size={16} style={{ color: "var(--color-emergency)", fill: "var(--color-emergency-light)" }} /> Urgence médicale · Paris 11e
              </div>

              <div style={{ position: "absolute", top: "25%", left: "70%", display: "flex", alignItems: "center", gap: 6, background: "#FFFFFF", padding: "6px 12px", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-sm)", fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                <MapPin size={16} style={{ color: "var(--color-primary)", fill: "var(--color-green-light)" }} /> Bobigny · Hébergement
              </div>

              <div style={{ textAlign: "center", color: "var(--color-primary-dark)", background: "rgba(255,255,255,0.85)", padding: "16px 24px", borderRadius: "var(--radius-lg)", backdropFilter: "blur(4px)", border: "1px solid var(--color-border-strong)" }}>
                <Navigation size={28} style={{ margin: "0 auto 6px", color: "var(--color-primary)" }} />
                <div style={{ fontWeight: 800, fontSize: 15 }}>Cartographie des maraudes et signalements</div>
                <div style={{ fontSize: 13, color: "var(--color-text-secondary)", marginTop: 2 }}>Orientation instantanée des secours humanitaires</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REPORTING SYSTEM CTA SECTION ── */}
      <section style={{ background: "var(--color-primary-deep)", color: "#FFFFFF", padding: "88px 0", textAlign: "center" }}>
        <div className="landing-section-inner" style={{ maxWidth: 720, margin: "0 auto" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              color: "#FFFFFF",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 20
            }}
          >
            Simple · Rapide · Gratuit
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 800, color: "#FFFFFF", marginBottom: 16 }}>
            Une situation nécessite une intervention ?
          </h2>

          <p style={{ fontSize: 17, color: "#C8E5DC", marginBottom: 36, lineHeight: 1.6 }}>
            Signalez-la rapidement. Aucun compte n'est nécessaire.
          </p>

          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onClick={() => setShowQuickReport(true)}
              style={{
                background: "#FFFFFF",
                color: "var(--color-primary-deep)",
                fontWeight: 800,
                fontSize: 16,
                padding: "16px 36px",
                borderRadius: "var(--radius-md)",
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
              }}
            >
              <Zap size={20} style={{ color: "var(--color-primary)" }} /> Faire un signalement
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer" style={{ background: "var(--color-primary-deep)", borderTop: "1px solid rgba(255,255,255,0.1)", padding: "48px 0 32px" }}>
        <div className="landing-section-inner">
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr repeat(4, 1fr)", gap: 40, marginBottom: 40 }}>
            <div>
              <div className="landing-nav-brand" style={{ marginBottom: 14 }}>
                <div className="landing-nav-logo" style={{ width: 34, height: 34 }}>
                  <HeartHandshake size={18} color="white" />
                </div>
                <span className="landing-nav-name" style={{ color: "#FFFFFF", fontSize: 20 }}>SOS Link</span>
              </div>
              <p style={{ color: "#C8E5DC", fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
                Coordonner les bonnes personnes au bon moment.
              </p>
            </div>

            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>SOS Link</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <a href="#" style={{ color: "#C8E5DC" }}>À propos</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Phase pilote</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Île-de-France</a>
              </div>
            </div>

            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Navigation</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <button onClick={() => scrollToSection("comment-ca-marche")} style={{ color: "#C8E5DC", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Comment ça marche</button>
                <button onClick={() => scrollToSection("acteurs")} style={{ color: "#C8E5DC", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Acteurs</button>
                <button onClick={() => scrollToSection("carte")} style={{ color: "#C8E5DC", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>Carte des maraudes</button>
              </div>
            </div>

            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Ressources</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <a href="#" style={{ color: "#C8E5DC" }}>Guide maraudes</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Numéros d'urgence</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Faire un don</a>
              </div>
            </div>

            <div>
              <div style={{ color: "#FFFFFF", fontWeight: 700, fontSize: 14, marginBottom: 14 }}>Légal</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <a href="#" style={{ color: "#C8E5DC" }}>Confidentialité</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Mentions légales</a>
                <a href="#" style={{ color: "#C8E5DC" }}>Contact</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#C8E5DC", fontSize: 12 }}>
            <div>© {new Date().getFullYear()} SOS Link · Plateforme de solidarité Île-de-France</div>
            <div style={{ display: "flex", gap: 20 }}>
              <a href="#" style={{ color: "#C8E5DC" }}>RGPD</a>
              <a href="mailto:contact@soslink.fr" style={{ color: "#C8E5DC" }}>contact@soslink.fr</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── QUICK REPORT MODAL ── */}
      {showQuickReport && (
        <QuickReportModal onClose={() => setShowQuickReport(false)} />
      )}
    </div>
  );
}


