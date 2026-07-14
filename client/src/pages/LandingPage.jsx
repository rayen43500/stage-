import {
  HeartHandshake, MapPin, Users, Store, Shield,
  ArrowRight, PhoneCall, ChevronRight, Star, Zap, Globe2
} from "lucide-react";

export function LandingPage({ onNavigate }) {
  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-brand">
            <div className="landing-nav-logo">
              <HeartHandshake size={22} color="white" />
            </div>
            <div>
              <span className="landing-nav-name">SOS Link</span>
              <span className="landing-nav-sub">Île-de-France · Phase pilote</span>
            </div>
          </div>
          <div className="landing-nav-actions">
            <button className="landing-nav-btn-ghost" onClick={() => onNavigate("register")}>
              S'inscrire
            </button>
            <button className="landing-nav-btn-primary" onClick={() => onNavigate("login")}>
              Se connecter <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-content">
            <div className="landing-hero-badge">
              <Star size={12} /> Version 1.1 &nbsp;·&nbsp; Île-de-France
            </div>
            <h1 className="landing-hero-title">
              Signaler, orienter,<br />
              <span className="landing-hero-accent">intervenir plus vite.</span>
            </h1>
            <p className="landing-hero-desc">
              SOS Link coordonne citoyens, associations humanitaires et commerces
              alimentaires pour réduire les délais d'intervention auprès des personnes
              en grande précarité en Île-de-France.
            </p>
            <div className="landing-hero-cta">
              <button className="landing-cta-primary" onClick={() => onNavigate("register")}>
                Créer un compte gratuitement <ArrowRight size={16} />
              </button>
              <button className="landing-cta-secondary" onClick={() => onNavigate("login")}>
                Se connecter
              </button>
            </div>
            <div className="landing-hero-stats">
              <div className="landing-stat">
                <strong>4</strong>
                <span>types d'acteurs</span>
              </div>
              <div className="landing-stat-sep" />
              <div className="landing-stat">
                <strong>100%</strong>
                <span>sans publicité</span>
              </div>
              <div className="landing-stat-sep" />
              <div className="landing-stat">
                <strong>RGPD</strong>
                <span>conforme</span>
              </div>
            </div>
          </div>
          <div className="landing-hero-visual">
            <img
              src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=900&q=80"
              alt="Solidarité et aide humanitaire"
              className="landing-hero-img"
            />
            <div className="landing-hero-img-badge">
              <MapPin size={14} />
              Île-de-France · Phase pilote
            </div>
          </div>
        </div>
      </header>

      {/* ── Features ── */}
      <section className="landing-features">
        <div className="landing-section-inner">
          <div className="landing-section-label">FONCTIONNALITÉS</div>
          <h2 className="landing-section-title">
            Une plateforme solidaire complète
          </h2>
          <p className="landing-section-desc">
            SOS Link réunit quatre types d'acteurs autour d'une interface commune pour maximiser
            l'efficacité des interventions humanitaires sur le terrain.
          </p>
          <div className="landing-features-grid">
            {[
              {
                icon: "👤",
                color: "#1b8a6b",
                bg: "#d0f0e5",
                title: "Citoyen",
                desc: "Signalez une personne ou un groupe en difficulté en quelques secondes depuis votre téléphone. Choisissez entre un signalement individuel ou de groupe avec des informations de besoins détaillées."
              },
              {
                icon: "🤝",
                color: "#2563eb",
                bg: "#dbeafe",
                title: "Association Humanitaire",
                desc: "Définissez votre secteur d'intervention géographique, recevez les alertes correspondant à votre périmètre et gérez vos interventions depuis votre tableau de bord dédié."
              },
              {
                icon: "🍽️",
                color: "#d97706",
                bg: "#fef3c7",
                title: "Restaurateur Partenaire",
                desc: "Déclarez vos invendus alimentaires en fin de journée. L'IA valorise automatiquement vos dons et l'administrateur vous envoie votre reçu fiscal de déduction d'impôt en fin d'année."
              },
              {
                icon: "🛡️",
                color: "#7c3aed",
                bg: "#ede9fe",
                title: "Administrateur",
                desc: "Validez les inscriptions des associations et restaurateurs, modérez les signalements, consultez les valorisations IA en temps réel et émettez les reçus fiscaux annuels."
              }
            ].map(({ icon, color, bg, title, desc }) => (
              <div key={title} className="landing-feature-card">
                <div className="landing-feature-icon" style={{ background: bg, color }}>
                  {icon}
                </div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
                <button
                  className="landing-feature-link"
                  style={{ color }}
                  onClick={() => onNavigate("register")}
                >
                  Commencer <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="landing-steps">
        <div className="landing-section-inner">
          <div className="landing-section-label">COMMENT ÇA MARCHE</div>
          <h2 className="landing-section-title">En 3 étapes simples</h2>
          <div className="landing-steps-grid">
            {[
              { step: "01", icon: <MapPin size={22} />, title: "Signalez", desc: "Un citoyen localise une personne en difficulté et soumet un formulaire détaillant ses besoins (alimentation, hébergement, santé, etc.) et le niveau d'urgence." },
              { step: "02", icon: <Zap size={22} />, title: "L'algorithme redirige", desc: "SOS Link identifie automatiquement l'association locale dont le secteur couvre le lieu du signalement et dont les services correspondent aux besoins identifiés." },
              { step: "03", icon: <Shield size={22} />, title: "L'association intervient", desc: "L'association reçoit une alerte email, prend en charge le signalement et met à jour le statut de l'intervention pour clôturer le dossier." }
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="landing-step">
                <div className="landing-step-number">{step}</div>
                <div className="landing-step-icon">{icon}</div>
                <h3 className="landing-step-title">{title}</h3>
                <p className="landing-step-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="landing-cta-banner">
        <div className="landing-section-inner" style={{ textAlign: "center" }}>
          <div className="landing-cta-icon">🤝</div>
          <h2 className="landing-cta-title">
            Rejoignez le réseau solidaire SOS Link
          </h2>
          <p className="landing-cta-desc">
            Sans publicité · Sans vente de données · Plateforme 100% solidaire
          </p>
          <div className="landing-cta-buttons">
            <button className="landing-cta-primary" onClick={() => onNavigate("register")}>
              Créer un compte <ArrowRight size={16} />
            </button>
            <button className="landing-cta-secondary" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => onNavigate("login")}>
              Se connecter
            </button>
          </div>
          <div className="landing-cta-emergency">
            <PhoneCall size={13} />
            En cas d'urgence médicale, appelez directement le <strong>15 (SAMU)</strong> ou le <strong>18 (Pompiers)</strong>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <div className="landing-footer-brand">
            <div className="landing-nav-logo" style={{ width: 30, height: 30 }}>
              <HeartHandshake size={16} color="white" />
            </div>
            <span style={{ fontWeight: 700 }}>SOS Link</span>
          </div>
          <div className="landing-footer-links">
            <a href="#">Politique de confidentialité</a>
            <a href="#">Mentions légales</a>
            <a href="#">RGPD</a>
            <a href="mailto:contact@soslink.fr">contact@soslink.fr</a>
          </div>
          <div className="landing-footer-copy">
            © {new Date().getFullYear()} SOS Link · Service of Solidarity · Île-de-France
          </div>
        </div>
      </footer>
    </div>
  );
}
