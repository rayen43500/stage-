import { useEffect, useState } from "react";
import {
  Heart, Shield, Info, MapPin, Store, Users,
  Activity, ArrowRight, PlusCircle, CheckCircle2,
  Calendar, FileText, Sparkles, PhoneCall, Lightbulb, BadgeEuro,
  HeartHandshake, UserRound, Crown, BookOpen, Zap
} from "lucide-react";
import { api } from "../api/http";
import { QuickReportModal } from "../components/QuickReportModal";

export function HomePage({ user }) {
  const [stats, setStats] = useState({ reportsCount: 0, donationsCount: 0, resolvedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [showQuickModal, setShowQuickModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        if (user.role === "admin") {
          const { data } = await api.get("/admin/dashboard");
          setStats({
            reportsCount: data.reports,
            donationsCount: data.donations,
            resolvedCount: data.resolvedReports
          });
        } else {
          const [{ data: reports }, { data: donations }] = await Promise.all([
            api.get("/reports").catch(() => ({ data: [] })),
            api.get("/donations").catch(() => ({ data: [] }))
          ]);
          setStats({
            reportsCount: reports.length,
            donationsCount: donations.length,
            resolvedCount: reports.filter((r) => r.status === "resolved").length
          });
        }
      } catch (err) {
        console.error("Error loading home stats", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const roleLabel =
    user.role === "citizen" ? "Citoyen"
    : user.role === "association" ? "Association Partenaire"
    : user.role === "restaurant" ? "Restaurateur / Commerce"
    : "Administrateur SOS Link";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 1100 }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, var(--color-primary-deep) 0%, var(--color-primary-dark) 100%)",
          color: "#FFFFFF",
          padding: "36px",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 2, maxWidth: 740 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.12)",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 16
            }}
          >
            <Sparkles size={12} /> SOS CONNECT · By Solid’Uni
          </span>
          <h1 style={{ fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 900, marginBottom: 8, letterSpacing: "-0.5px", color: "white" }}>
            Bonjour, {user.organizationName || user.email}
          </h1>
          <p style={{ fontSize: 15, color: "#C8E5DC", lineHeight: 1.5, marginBottom: 0 }}>
            Bienvenue sur votre espace <strong>{roleLabel}</strong>. Vous trouverez ci-dessous le récapitulatif
            de votre activité, des actions rapides, ainsi que la description détaillée du projet.
          </p>
        </div>
        <HeartHandshake
          size={148}
          strokeWidth={1.25}
          style={{
            position: "absolute",
            right: "-18px",
            bottom: "-34px",
            opacity: 0.08,
            userSelect: "none",
            pointerEvents: "none"
          }}
        />
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        {user.role === "citizen" && (
          <>
            <div className="stat-card">
              <div className="stat-icon"><MapPin size={18} /></div>
              <div className="stat-label">Vos signalements</div>
              <div className="stat-value">{stats.reportsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle2 size={18} /></div>
              <div className="stat-label">Signalements résolus</div>
              <div className="stat-value">{stats.resolvedCount}</div>
            </div>
          </>
        )}
        {user.role === "association" && (
          <>
            <div className="stat-card">
              <div className="stat-icon"><MapPin size={18} /></div>
              <div className="stat-label">Signalements affectés</div>
              <div className="stat-value">{stats.reportsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><CheckCircle2 size={18} /></div>
              <div className="stat-label">Signalements résolus</div>
              <div className="stat-value" style={{ color: "var(--brand-500)" }}>{stats.resolvedCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Store size={18} /></div>
              <div className="stat-label">Collectes d'invendus</div>
              <div className="stat-value">{stats.donationsCount}</div>
            </div>
          </>
        )}
        {user.role === "restaurant" && (
          <>
            <div className="stat-card">
              <div className="stat-icon"><Store size={18} /></div>
              <div className="stat-label">Vos déclarations de dons</div>
              <div className="stat-value">{stats.donationsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Calendar size={18} /></div>
              <div className="stat-label">Année en cours</div>
              <div className="stat-value">{new Date().getFullYear()}</div>
            </div>
          </>
        )}
        {user.role === "admin" && (
          <>
            <div className="stat-card">
              <div className="stat-icon"><Users size={18} /></div>
              <div className="stat-label">Utilisateurs totaux</div>
              <div className="stat-value">{stats.reportsCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><MapPin size={18} /></div>
              <div className="stat-label">Signalements actifs</div>
              <div className="stat-value">{stats.resolvedCount}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon"><Store size={18} /></div>
              <div className="stat-label">Dons alimentaires déclarés</div>
              <div className="stat-value">{stats.donationsCount}</div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions & Privacy (Two Columns) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        <div className="admin-section" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <h2><Activity size={16} /> Actions rapides</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {user.role === "citizen" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => setShowQuickModal(true)}
                  style={{
                    justifyContent: "flex-start",
                    width: "100%",
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                    border: "none",
                    boxShadow: "0 3px 12px rgba(79, 70, 229, 0.28)"
                  }}
                >
                  <Zap size={16} /> Signalement rapide (GPS & photo)
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => {
                    document.querySelector("nav button:nth-child(2)")?.click();
                    setTimeout(() => {
                      const addBtn = document.querySelector(".section-header .btn-primary");
                      if (addBtn) addBtn.click();
                    }, 200);
                  }}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <PlusCircle size={16} /> Nouveau signalement détaillé
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => document.querySelector("nav button:nth-child(2)")?.click()}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <MapPin size={16} /> Voir la carte de mes signalements
                </button>
              </>
            )}
            {user.role === "association" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => document.querySelector("nav button:nth-child(2)")?.click()}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <MapPin size={16} /> Voir la carte de mon secteur
                </button>
                <button
                  className="btn-secondary"
                  onClick={() => document.querySelector("nav button:nth-child(3)")?.click()}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <Store size={16} /> Gérer les collectes d'invendus
                </button>
              </>
            )}
            {user.role === "restaurant" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => document.querySelector("nav button:nth-child(2)")?.click()}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <PlusCircle size={16} /> Déclarer des invendus
                </button>
              </>
            )}
            {user.role === "admin" && (
              <>
                <button
                  className="btn-primary"
                  onClick={() => document.querySelector("nav button:nth-child(4)")?.click()}
                  style={{ justifyContent: "flex-start", width: "100%" }}
                >
                  <Shield size={16} /> Ouvrir le panneau de supervision
                </button>
              </>
            )}
          </div>
        </div>

        <div className="admin-section" style={{ margin: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          <h2><Shield size={16} /> Confidentialité & Engagements RGPD</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, lineHeight: 1.5 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckCircle2 size={16} style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 2 }} />
              <span><strong>Pas de collecte abusive</strong> : Pas de nom ni de numéro de téléphone collectés pour les comptes citoyens.</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckCircle2 size={16} style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 2 }} />
              <span><strong>Accès sécurisé et restreint</strong> : Les citoyens voient exclusivement leurs propres signalements géolocalisés.</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <CheckCircle2 size={16} style={{ color: "var(--brand-500)", flexShrink: 0, marginTop: 2 }} />
              <span><strong>Droit à l'effacement immédiat</strong> : Suppression de compte et d'alertes instantanée à la demande.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Project Description & Cahier des Charges */}
      <div className="admin-section" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <h2 style={{ fontSize: 18, borderBottom: "2px solid var(--border)", paddingBottom: 8 }}>
          <BookOpen size={18} /> Cahier des Charges & Description du Projet SOS Link
        </h2>

        {/* Section 1: Concept */}
        <div>
          <strong style={{ fontSize: 14, display: "block", marginBottom: 6, color: "var(--brand-600)" }}>
            1. Présentation générale du projet
          </strong>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
            En Île-de-France, de nombreuses personnes en situation de grande précarité se retrouvent sans assistance
            faute de coordination structurée. SOS Link résout ce problème en interconnectant citoyens, associations humanitaires 
            et acteurs de la restauration. Tout citoyen peut signaler un besoin, l'algorithme le transmet à l'association locale 
            la plus adaptée, et les restaurateurs partenaires distribuent leurs invendus alimentaires, valorisés par IA.
          </p>
        </div>

        {/* Section 2: Stakeholders Description */}
        <div>
          <strong style={{ fontSize: 14, display: "block", marginBottom: 8, color: "var(--brand-600)" }}>
            2. Spécifications fonctionnelles par profil
          </strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
            <div style={{ background: "var(--surface-subtle)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                <UserRound size={14} /> Citoyen
              </strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                - Inscription et validation automatique par e-mail.<br />
                - Signalements géolocalisés individuels ou groupés (avec jauges, estimation et sélecteur couleur d'urgence).<br />
                - Obtention du numéro de l'association assignée ou redirection dons facultatifs HelloAsso.
              </p>
            </div>
            <div style={{ background: "var(--surface-subtle)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                <HeartHandshake size={14} /> Association
              </strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                - Inscription avec numéro SIREN et validation manuelle par l'administrateur.<br />
                - Définition d'un secteur d'intervention via cercle ajustable.<br />
                - Accès à la carte filtrée de sa zone, mise à jour des besoins satisfaits, notes et statistiques.
              </p>
            </div>
            <div style={{ background: "var(--surface-subtle)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                <Store size={14} /> Restaurateur
              </strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                - Inscription avec SIREN, adresse et validation admin.<br />
                - Déclaration d'invendus avec photo, description et créneau horaire.<br />
                - Valorisation IA cachée durant l'année et affichée globalement en fin d'année pour émission de reçu fiscal.
              </p>
            </div>
            <div style={{ background: "var(--surface-subtle)", padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, marginBottom: 4 }}>
                <Crown size={14} /> Administrateur
              </strong>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5, margin: 0 }}>
                - Validation manuelle des comptes.<br />
                - Supervision globale et suppression de comptes/signalements.<br />
                - Accès permanent à la valorisation IA de chaque don.<br />
                - Génération et envoi des reçus fiscaux annuels.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: IA & Algorithm */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginTop: 10 }}>
          <div>
            <strong style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <Lightbulb size={16} style={{ color: "var(--yellow-500)" }} />
              Algorithme de Redirection
            </strong>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Les signalements et les dons d'invendus alimentaires sont redirigés automatiquement. 
              L'algorithme calcule l'intersection géographique entre la position déclarée et le secteur 
              d'intervention de l'association, tout en vérifiant la correspondance des besoins identifiés.
            </p>
          </div>
          <div>
            <strong style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <BadgeEuro size={16} style={{ color: "var(--brand-500)" }} />
              Module d'Intelligence Artificielle
            </strong>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
              Dès la soumission d'une photo de don alimentaire (pain, viande, plats préparés, etc.), le module 
              d'IA estime la nature et la quantité en kilogrammes afin de calculer un équivalent financier 
              basé sur les prix moyens du marché. Cette valorisation est stockée de manière sécurisée.
            </p>
          </div>
        </div>
      </div>

      {/* SAMU Warning */}
      <div className="alert alert-red" style={{ padding: 18 }}>
        <PhoneCall size={20} style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>
          <strong>Rappel de sécurité urgent</strong> : SOS Link n'est pas un service d'urgence médicale.
          Si vous êtes face à une personne blessée, inconsciente ou en détresse vitale immédiate,
          appelez immédiatement le <strong>15 (SAMU)</strong> ou le <strong>18 (Pompiers)</strong>.
        </div>
      </div>
      {/* Quick Report Modal */}
      {showQuickModal && (
        <QuickReportModal onClose={() => setShowQuickModal(false)} />
      )}
    </div>
  );
}

