import { useState, useEffect } from "react";
import {
  HeartHandshake, MapPin, Users, Store, Shield,
  ArrowRight, PhoneCall, ChevronRight, Zap, CheckCircle2,
  Navigation, Eye, Clock, ShieldCheck, BookOpen, Calendar, Sparkles, X
} from "lucide-react";
import { QuickReportModal } from "../components/QuickReportModal";
import { api } from "../api/http";

const FALLBACK_BLOGS = [
  {
    _id: "blog-1",
    title: "Maraudes d'hiver en Île-de-France : Mobilisation générale avec Solid'Uni",
    summary: "Découvrez comment nos associations partenaires coordonnent leurs maraudes pour apporter aide alimentaire et soutien humain.",
    content: `Face au froid hivernal en Île-de-France, la plateforme SOS CONNECT by Solid'Uni renforce les dispositifs d'alerte et de maraude.

Grâce au signalement citoyen en temps réel, nos 24 associations partenaires ont pu distribuer plus de 1 200 repas chauds et kits d'urgence le mois dernier.

Notre objectif commun : réduire au maximum le temps entre le signalement d'une personne vulnérable et l'intervention de l'équipe terrain compétente.`,
    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
    category: "Action Terrain",
    author: "Équipe Solid'Uni",
    createdAt: new Date().toISOString()
  },
  {
    _id: "blog-2",
    title: "Valorisation des invendus alimentaires : Le rôle des commerces solidaires",
    summary: "Comment les boulangeries et restaurateurs d'Île-de-France luttent contre le gaspillage tout en aidant les plus démunis.",
    content: `Chaque soir, des dizaines de commerces alimentaires partenaires s'engagent à offrir leurs invendus aux maraudes locales.

SOS CONNECT permet d'évaluer automatiquement l'impact nutritionnel et fiscal des dons alimentaires. En 2026, plus de 8 tonnes de nourriture de qualité ont été redistribuées directement aux centres d'hébergement d'urgence.`,
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=800&q=80",
    category: "Commerces Solidaires",
    author: "Équipe SOS CONNECT",
    createdAt: new Date().toISOString()
  },
  {
    _id: "blog-3",
    title: "Guide du Signalement Citoyen : Comment agir efficacement et avec bienveillance",
    summary: "Les bons réflexes à adopter lorsqu'on signale une personne en situation de grande précarité.",
    content: `Signaler une personne en précarité est un acte de solidarité citoyenne essentiel.

Pour garantir une intervention rapide et respectueuse :
1. Privilégiez la précision géographique (repères, station de métro, porche).
2. Indiquez clairement les besoins observés (couverture, nourriture, soins).
3. En cas d'urgence médicale vitale, contactez toujours le 15 (SAMU) en priorité.`,
    imageUrl: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb9?auto=format&fit=crop&w=800&q=80",
    category: "Sensibilisation",
    author: "Solid'Uni Coordination",
    createdAt: new Date().toISOString()
  }
];

export function LandingPage({ onNavigate }) {
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [blogPosts, setBlogPosts] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    async function loadBlogs() {
      try {
        const { data } = await api.get("/blog");
        if (Array.isArray(data) && data.length > 0) {
          setBlogPosts(data);
        } else {
          setBlogPosts(FALLBACK_BLOGS);
        }
      } catch (err) {
        setBlogPosts(FALLBACK_BLOGS);
      }
    }
    loadBlogs();
  }, []);

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
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span className="landing-nav-name" style={{ fontSize: 19, fontWeight: 900, letterSpacing: "-0.3px" }}>SOS CONNECT</span>
                <span style={{ fontSize: 10, background: "var(--color-green-light)", color: "var(--color-primary-dark)", padding: "2px 7px", borderRadius: "var(--radius-full)", fontWeight: 800, border: "1px solid var(--color-border-strong)" }}>
                  By Solid’Uni
                </span>
              </div>
              <span className="landing-nav-sub" style={{ fontSize: 11, fontWeight: 600, color: "var(--color-primary-dark)" }}>
                Solidarité • Orientation • Soutien
              </span>
            </div>
          </div>

          <div className="landing-nav-links" style={{ display: "flex", gap: 24, alignItems: "center" }}>
            <button className="nav-link-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Accueil</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("comment-ca-marche")}>Comment ça marche</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("acteurs")}>Acteurs</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("carte")}>Carte</button>
            <button className="nav-link-btn" onClick={() => scrollToSection("blog")}>Blog</button>
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
                background: "var(--color-emergency)",
                color: "#FFFFFF",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                boxShadow: "0 4px 16px rgba(220,38,38,0.3)",
                border: "none"
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
              <Sparkles size={13} style={{ color: "var(--color-primary)" }} /> BY SOLID’UNI · ÎLE-DE-FRANCE
            </div>

            <h1 className="landing-hero-title" style={{ color: "var(--color-text)", fontSize: "clamp(42px, 5vw, 64px)", fontWeight: 800, lineHeight: 1.08 }}>
              Signaler.<br />
              Orienter.<br />
              <span style={{ color: "var(--color-primary)" }}>Intervenir plus vite.</span>
            </h1>

            <p style={{ fontSize: 15, fontWeight: 700, color: "var(--color-primary-dark)", letterSpacing: "0.5px", marginTop: -6 }}>
              Solidarité • Orientation • Soutien
            </p>

            <p className="landing-hero-desc" style={{ maxWidth: 600, color: "var(--color-text-secondary)", fontSize: 17, lineHeight: 1.65 }}>
              SOS CONNECT by Solid’Uni connecte citoyens, associations et commerces pour faciliter une intervention rapide auprès des personnes en situation de précarité en Île-de-France.
            </p>

            <div className="landing-hero-cta" style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
              <button
                onClick={() => setShowQuickReport(true)}
                style={{
                  background: "var(--color-emergency)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "14px 26px",
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 8px 24px rgba(220,38,38,0.28)"
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
              src="https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=80"
              alt="Solidarité, maraude et bénévoles en Île-de-France"
              className="landing-hero-img"
              style={{
                width: "100%",
                height: 440,
                objectFit: "cover",
                borderRadius: 24,
                border: "1.5px solid var(--color-border-strong)",
                boxShadow: "0 16px 45px rgba(6,78,59,0.12)",
                display: "block",
                position: "relative",
                zIndex: 2
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 20,
                background: "#FFFFFF",
                padding: "10px 18px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border-strong)",
                boxShadow: "0 4px 16px rgba(6,78,59,0.14)",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
                fontWeight: 700,
                color: "var(--color-text)",
                zIndex: 3
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
              GÉOLOCALISATION TERRAIN
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", marginTop: 8 }}>
              Les signalements, au bon endroit.
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 640, margin: "8px auto 0" }}>
              Une cartographie en temps réel pour orienter efficacement les équipes de maraude.
            </p>
          </div>

          <div
            style={{
              background: "var(--color-background-soft)",
              border: "1.5px solid var(--color-border)",
              borderRadius: "var(--radius-xl)",
              padding: 28,
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {/* Top Bar inside Map Card: Legend & Title */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, paddingBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-sm)", background: "var(--color-green-light)", color: "var(--color-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Navigation size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--color-text)" }}>Cartographie des maraudes</div>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>Orientation instantanée des secours humanitaires</div>
                </div>
              </div>

              {/* Map Legend */}
              <div style={{ display: "flex", alignItems: "center", gap: 20, background: "#FFFFFF", padding: "8px 16px", borderRadius: "var(--radius-full)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                  Signalement Normal
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--color-text)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--color-emergency)", display: "inline-block" }} />
                  Signalement Urgent
                </div>
              </div>
            </div>

            {/* Map Canvas Frame */}
            <div
              style={{
                width: "100%",
                height: 380,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(180deg, #E6F4EF 0%, #D4EBE3 100%)",
                border: "1.5px solid var(--color-border-strong)",
                position: "relative",
                overflow: "hidden",
                boxShadow: "inset 0 2px 10px rgba(6,78,59,0.04)"
              }}
            >
              {/* Background decorative map grid lines */}
              <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none" }}>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--color-primary-deep)" strokeWidth="1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Pin 1: Top-Left */}
              <div
                style={{
                  position: "absolute",
                  top: "22%",
                  left: "8%",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--color-border-strong)",
                  boxShadow: "0 6px 20px rgba(6,78,59,0.12)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  zIndex: 2
                }}
              >
                <MapPin size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} /> Paris 10e · Besoin alimentaire
              </div>

              {/* Pin 2: Top-Right */}
              <div
                style={{
                  position: "absolute",
                  top: "20%",
                  right: "8%",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--color-border-strong)",
                  boxShadow: "0 6px 20px rgba(6,78,59,0.12)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  zIndex: 2
                }}
              >
                <MapPin size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} /> Bobigny · Hébergement
              </div>

              {/* Pin 3: Bottom-Left (Urgent) */}
              <div
                style={{
                  position: "absolute",
                  bottom: "22%",
                  left: "14%",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "var(--color-emergency-light)",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--color-emergency-border)",
                  boxShadow: "0 6px 20px rgba(220,38,38,0.18)",
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--color-emergency-dark)",
                  zIndex: 2
                }}
              >
                <MapPin size={16} style={{ color: "var(--color-emergency)", flexShrink: 0 }} /> Urgence médicale · Paris 11e
              </div>

              {/* Pin 4: Bottom-Right */}
              <div
                style={{
                  position: "absolute",
                  bottom: "24%",
                  right: "12%",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FFFFFF",
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  border: "1.5px solid var(--color-border-strong)",
                  boxShadow: "0 6px 20px rgba(6,78,59,0.12)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--color-text)",
                  zIndex: 2
                }}
              >
                <MapPin size={16} style={{ color: "var(--color-primary)", flexShrink: 0 }} /> Saint-Denis · Vêtements
              </div>

              {/* Center Status Badge */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  background: "#FFFFFF",
                  border: "1.5px solid var(--color-border-strong)",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-full)",
                  boxShadow: "var(--shadow-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 800,
                  color: "var(--color-primary-dark)",
                  zIndex: 1
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--color-primary)", display: "inline-block" }} />
                Secteur Île-de-France · Active
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BLOG SECTION ── */}
      <section id="blog" style={{ background: "var(--color-background)", padding: "96px 0", borderTop: "1px solid var(--color-border)" }}>
        <div className="landing-section-inner">
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
              <BookOpen size={14} /> ACTUALITÉS & ARTICLES · SOS CONNECT
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "var(--color-text)", marginTop: 8 }}>
              Le Blog Solid’Uni
            </h2>
            <p style={{ fontSize: 16, color: "var(--color-text-secondary)", maxWidth: 640, margin: "12px auto 0" }}>
              Retrouvez nos retours de maraudes, articles de sensibilisation et actualités du réseau d'entraide.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {blogPosts.map((post) => (
              <div
                key={post._id}
                style={{
                  background: "#FFFFFF",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-lg)",
                  overflow: "hidden",
                  boxShadow: "var(--shadow-card)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "all 0.2s ease"
                }}
              >
                {post.imageUrl && (
                  <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
                    <img src={post.imageUrl} alt={post.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <span
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "var(--color-primary-deep)",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)"
                      }}
                    >
                      {post.category || "Actualité"}
                    </span>
                  </div>
                )}
                <div style={{ padding: 24, display: "flex", flexDirection: "column", flex: 1 }}>
                  <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Calendar size={12} /> {new Date(post.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--color-text)", marginBottom: 10, lineHeight: 1.35 }}>
                    {post.title}
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: 18, flex: 1 }}>
                    {post.summary}
                  </p>
                  <button
                    onClick={() => setSelectedArticle(post)}
                    style={{
                      background: "var(--color-green-light)",
                      color: "var(--color-primary-dark)",
                      border: "1px solid var(--color-border-strong)",
                      fontWeight: 700,
                      fontSize: 13,
                      padding: "9px 16px",
                      borderRadius: "var(--radius-md)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      marginTop: "auto"
                    }}
                  >
                    Lire l'article <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
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

      {/* ── ARTICLE READER MODAL ── */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={() => setSelectedArticle(null)} style={{ position: "fixed", inset: 0, background: "rgba(10, 31, 26, 0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, width: "100%", background: "#FFFFFF", borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1.5px solid var(--color-border-strong)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--color-border)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--color-background-soft)" }}>
              <span style={{ fontSize: 11, background: "var(--color-green-light)", color: "var(--color-primary-dark)", padding: "3px 10px", borderRadius: "var(--radius-full)", fontWeight: 800, border: "1px solid var(--color-border-strong)" }}>
                {selectedArticle.category || "Actualité"}
              </span>
              <button onClick={() => setSelectedArticle(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4 }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: 28, overflowY: "auto" }}>
              {selectedArticle.imageUrl && (
                <img src={selectedArticle.imageUrl} alt={selectedArticle.title} style={{ width: "100%", height: 260, objectFit: "cover", borderRadius: "var(--radius-lg)", marginBottom: 20 }} />
              )}
              <h2 style={{ fontSize: 24, fontWeight: 900, color: "var(--color-text)", marginBottom: 10, lineHeight: 1.3 }}>
                {selectedArticle.title}
              </h2>
              <div style={{ fontSize: 12, color: "var(--color-text-muted)", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span>Par <strong>{selectedArticle.author || "Équipe SOS CONNECT"}</strong></span>
                <span>•</span>
                <span><Calendar size={12} style={{ display: "inline-block", marginRight: 4 }} /> {new Date(selectedArticle.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>
              <div style={{ fontSize: 15, color: "var(--color-text-secondary)", lineHeight: 1.7, whitespace: "pre-line" }}>
                {selectedArticle.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── QUICK REPORT MODAL ── */}
      {showQuickReport && (
        <QuickReportModal onClose={() => setShowQuickReport(false)} />
      )}
    </div>
  );
}


