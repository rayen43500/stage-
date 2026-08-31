import { useEffect, useState } from "react";
import {
  HeartHandshake,
  LogOut,
  MapPinned,
  ShieldCheck,
  Store,
  Trash2,
  AlertCircle,
  Home,
  Clock,
  XCircle
} from "lucide-react";
import { api } from "./api/http";
import { useSession } from "./store/session";
import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { ReportsPage } from "./pages/ReportsPage";
import { DonationsPage } from "./pages/DonationsPage";
import { AdminPage } from "./pages/AdminPage";

const tabs = [
  { id: "home", label: "Accueil", icon: Home, roles: ["citizen", "association", "restaurant", "admin"] },
  { id: "reports", label: "Signalements", icon: MapPinned, roles: ["citizen", "association", "admin"] },
  { id: "donations", label: "Invendus", icon: Store, roles: ["restaurant", "association", "admin"] },
  { id: "admin", label: "Administration", icon: ShieldCheck, roles: ["admin"] }
];

export function App() {
  const { user, token, logout, setSession } = useSession();
  const [activeTab, setActiveTab] = useState("home");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Controls the public routing before login: 'landing' | 'login' | 'register'
  const [publicPage, setPublicPage] = useState("landing");

  useEffect(() => {
    if (!token) return;
    api.get("/auth/me")
      .then(({ data }) => setSession({ token, user: data.user }))
      .catch(logout);
  }, [token]);

  // Set default tab on login
  useEffect(() => {
    if (user) setActiveTab("home");
  }, [user?.role]);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/auth/me");
      logout();
    } catch {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  // ── Public pages (not logged in) ──────────────────────────────
  if (!user) {
    if (publicPage === "landing") {
      return <LandingPage onNavigate={(mode) => setPublicPage(mode)} />;
    }
    // login or register → show AuthPage with initial mode passed as prop
    return (
      <AuthPage
        initialMode={publicPage}
        onNavigate={(mode) => setPublicPage(mode)}
      />
    );
  }

  // Show pending/rejected screen for organizations awaiting validation
  if (["association", "restaurant"].includes(user.role) && user.status === "pending") {
    return (
      <div className="pending-screen">
        <div className="pending-box">
          <div className="pending-icon">
            <Clock size={34} />
          </div>
          <h1>Compte en attente de validation</h1>
          <p>
            Votre inscription sur SOS Link est en cours d'examen par notre équipe.
            Vous recevrez un email dès que votre compte sera activé.
          </p>
          <p className="text-sm text-muted">
            Organisation : <strong>{user.organizationName}</strong><br />
            Email : {user.email}
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-secondary" onClick={logout}>
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (["association", "restaurant"].includes(user.role) && user.status === "rejected") {
    return (
      <div className="pending-screen">
        <div className="pending-box">
          <div className="pending-icon" style={{ background: "var(--red-100)", color: "var(--red-500)" }}>
            <XCircle size={34} />
          </div>
          <h1>Compte refusé</h1>
          <p>
            Votre demande d'inscription n'a pas pu être validée.
            Si vous pensez qu'il s'agit d'une erreur, contactez-nous à{" "}
            <strong>contact@soslink.fr</strong>.
          </p>
          <div style={{ marginTop: 24, display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn-secondary" onClick={logout}>
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        </div>
      </div>
    );
  }

  const visibleTabs = tabs.filter((tab) => tab.roles.includes(user.role));
  const CurrentPage =
    activeTab === "home" ? HomePage
    : activeTab === "donations" ? DonationsPage
    : activeTab === "admin" ? AdminPage
    : ReportsPage;

  return (
    <>
      <main className="app-shell">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-icon">
              <HeartHandshake size={22} color="white" />
            </div>
            <div>
              <strong>SOS Link</strong>
              <span>Île-de-France · Pilote</span>
            </div>
          </div>
          <nav>
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={activeTab === tab.id ? "active" : ""}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="nav-icon">
                    <Icon size={15} />
                  </span>
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="profile-card">
            <div className="profile-name">{user.organizationName || user.email}</div>
            <div className="profile-role">
              <span className="status-dot"></span>
              {user.role === "citizen" ? "Citoyen"
               : user.role === "association" ? "Association"
               : user.role === "restaurant" ? "Restaurateur"
               : "Administrateur"}
              {" · "}
              {user.status === "active" ? "Actif" : user.status}
            </div>
          </div>

          {user.role === "citizen" && (
            <button className="btn-delete-account" onClick={() => setShowDeleteConfirm(true)}>
              <Trash2 size={13} /> Supprimer mon compte
            </button>
          )}

          <button className="btn-ghost" onClick={logout}>
            <LogOut size={16} /> Déconnexion
          </button>
        </aside>
        <section className="workspace">
          <CurrentPage user={user} />
        </section>
      </main>

      {showDeleteConfirm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: "var(--radius-md)", background: "var(--red-100)", color: "var(--red-500)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <AlertCircle size={22} />
              </div>
              <h2 style={{ margin: 0 }}>Supprimer mon compte</h2>
            </div>
            <p>
              Cette action est <strong>irréversible</strong>. Votre compte et tous vos signalements seront supprimés définitivement conformément au RGPD.
            </p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</button>
              <button className="btn-danger" disabled={deleting} onClick={handleDeleteAccount}>
                {deleting ? "Suppression..." : "Confirmer la suppression"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
