import { useEffect, useState } from "react";
import {
  ShieldCheck, Users, MapPin, Store, BarChart3, FileText,
  CheckCircle2, XCircle, Trash2, Send, RefreshCw, Filter
} from "lucide-react";
import { api } from "../api/http";

const TABS = [
  { id: "dashboard", label: "Supervision", icon: BarChart3 },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "reports", label: "Signalements", icon: MapPin },
  { id: "donations", label: "Dons & IA", icon: Store },
  { id: "fiscal", label: "Reçus Fiscaux", icon: FileText }
];

export function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [pending, setPending] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  async function loadDashboard() {
    const [{ data: stats }, { data: orgs }] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/organizations/pending")
    ]);
    setDashboard(stats);
    setPending(orgs);
  }

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1>Administration</h1>
          <p>Supervision globale de la plateforme SOS Link.</p>
        </div>
        <button className="btn-secondary" onClick={loadDashboard}>
          <RefreshCw size={14} /> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`admin-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>
            <Icon size={15} />
            {label}
            {id === "dashboard" && pending.length > 0 && (
              <span className="tab-badge">{pending.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "dashboard" && <DashboardTab dashboard={dashboard} pending={pending} onChanged={loadDashboard} />}
      {tab === "users" && <UsersTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "donations" && <DonationsTab />}
      {tab === "fiscal" && <FiscalTab />}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ dashboard, pending, onChanged }) {
  async function setStatus(id, status) {
    await api.patch(`/admin/organizations/${id}/status`, { status });
    onChanged();
  }

  const stats = dashboard
    ? [
        { label: "Utilisateurs", value: dashboard.users, icon: "👥" },
        { label: "Signalements", value: dashboard.reports, icon: "📍" },
        { label: "Résolus", value: dashboard.resolvedReports, icon: "✅" },
        { label: "Dons déclarés", value: dashboard.donations, icon: "🥘" }
      ]
    : [];

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ fontSize: 20 }}>{icon}</div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Pending validations */}
      <div className="admin-section">
        <h2><ShieldCheck size={16} /> Comptes à valider ({pending.length})</h2>
        {pending.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
            <CheckCircle2 size={16} style={{ display: "inline", marginRight: 6 }} />
            Aucun compte en attente de validation.
          </div>
        ) : (
          <div className="list-grid">
            {pending.map((org) => (
              <div key={org._id} className="data-card">
                <div className="data-card-body">
                  <strong>{org.organizationName || org.email}</strong>
                  <span>{org.role === "association" ? "🤝 Association" : "🍽️ Restaurateur"} · {org.sirenSiret} · {org.email}</span>
                  {org.address && <small>{org.address}</small>}
                </div>
                <div className="data-card-actions">
                  <button className="btn-success" onClick={() => setStatus(org._id, "active")}>
                    <CheckCircle2 size={14} /> Valider
                  </button>
                  <button className="btn-danger" onClick={() => setStatus(org._id, "rejected")}>
                    <XCircle size={14} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  async function load() {
    const params = roleFilter ? `?role=${roleFilter}` : "";
    const { data } = await api.get(`/admin/users${params}`);
    setUsers(data);
  }

  useEffect(() => { load(); }, [roleFilter]);

  async function deleteUser(id) {
    await api.delete(`/admin/users/${id}`);
    setConfirmDelete(null);
    load();
  }

  const roleLabel = { citizen: "Citoyen", association: "Association", restaurant: "Restaurateur", admin: "Admin" };
  const statusLabel = { active: "Actif", pending: "En attente", rejected: "Refusé" };

  return (
    <>
      <div className="admin-section">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0 }}><Users size={16} /> Tous les utilisateurs ({users.length})</h2>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ fontSize: 13, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
            <option value="">Tous les rôles</option>
            <option value="citizen">Citoyens</option>
            <option value="association">Associations</option>
            <option value="restaurant">Restaurateurs</option>
          </select>
        </div>
        <div className="list-grid">
          {users.map((u) => (
            <div key={u._id} className="data-card">
              <div className="data-card-body">
                <strong>{u.organizationName || u.email}</strong>
                <span>
                  {roleLabel[u.role] || u.role} ·{" "}
                  <span style={{ color: u.status === "active" ? "var(--green-500)" : u.status === "pending" ? "var(--yellow-500)" : "var(--red-500)", fontWeight: 700 }}>
                    {statusLabel[u.status] || u.status}
                  </span>
                  {u.sirenSiret && ` · SIRET: ${u.sirenSiret}`}
                </span>
                <small>{u.email} · {new Date(u.createdAt).toLocaleDateString("fr-FR")}</small>
              </div>
              <div className="data-card-actions">
                {u.role !== "admin" && (
                  <button className="btn-danger" style={{ padding: "7px 10px" }} onClick={() => setConfirmDelete(u)}>
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>Supprimer le compte</h2>
            <p>Voulez-vous supprimer le compte de <strong>{confirmDelete.organizationName || confirmDelete.email}</strong> ? Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => deleteUser(confirmDelete._id)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────
function ReportsTab() {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: "", urgency: "", type: "" });

  async function load() {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.urgency) params.set("urgency", filters.urgency);
    if (filters.type) params.set("type", filters.type);
    const { data } = await api.get(`/admin/reports?${params}`);
    setReports(data);
  }

  useEffect(() => { load(); }, [filters]);

  async function deleteReport(id) {
    await api.delete(`/reports/${id}`);
    load();
  }

  return (
    <div className="admin-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><MapPin size={16} /> Signalements ({reports.length})</h2>
      </div>
      <div className="filters-bar" style={{ marginBottom: 16 }}>
        <Filter size={14} style={{ color: "var(--text-muted)" }} />
        <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">Tous statuts</option>
          <option value="new">Nouveau</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="removed">Retiré</option>
        </select>
        <select value={filters.urgency} onChange={(e) => setFilters((f) => ({ ...f, urgency: e.target.value }))}>
          <option value="">Toutes urgences</option>
          <option value="red">🔴 Rouge</option>
          <option value="yellow">🟡 Jaune</option>
          <option value="green">🟢 Vert</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          <option value="">Tous types</option>
          <option value="individual">Individuel</option>
          <option value="group">Groupe</option>
        </select>
      </div>
      <div className="list-grid">
        {reports.map((report) => (
          <div key={report._id} className="data-card">
            <div className="data-card-body">
              <strong style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {report.type === "individual" ? "👤 Individuel" : `👥 Groupe · ${report.group?.peopleCount || "?"} pers.`}
                <span className={`urgency-badge ${report.urgency}`}>
                  {report.urgency === "red" ? "🔴" : report.urgency === "yellow" ? "🟡" : "🟢"} {report.urgency}
                </span>
              </strong>
              <span>
                <span className={`status-badge ${report.status}`}>{report.status}</span>
                {" · "}
                {report.needs?.join(", ") || "Aucun besoin"}
              </span>
              <small>{new Date(report.createdAt).toLocaleString("fr-FR")} · Par {report.createdBy?.email}</small>
            </div>
            <div className="data-card-actions">
              <button className="btn-danger" style={{ padding: "7px 10px" }} onClick={() => deleteReport(report._id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Donations & IA Valuation Tab ─────────────────────────────────────────────
function DonationsTab() {
  const [donations, setDonations] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  async function load() {
    const { data } = await api.get(`/admin/donations?year=${year}`);
    setDonations(data);
  }

  useEffect(() => { load(); }, [year]);

  const totalVal = donations.reduce((s, d) => s + (d.valuation?.estimatedValueEur || 0), 0).toFixed(2);

  return (
    <div className="admin-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><Store size={16} /> Dons alimentaires & Valorisation IA</h2>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span className="metric">{totalVal} EUR valorisés</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ fontSize: 13, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
            {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <div className="list-grid">
        {donations.map((donation) => (
          <div key={donation._id} className="data-card" style={{ alignItems: "flex-start" }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>🥘</div>
            <div className="data-card-body">
              <strong>{donation.description}</strong>
              <span>
                {donation.restaurant?.organizationName || donation.restaurant?.email}
                {" · "}{donation.quantity}
                {" · "}{new Date(donation.availableDate).toLocaleDateString("fr-FR")}
              </span>
              {donation.valuation && (
                <small style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "2px 12px", marginTop: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                  <span>Catégorie:</span><span>{donation.valuation.category}</span>
                  <span>Quantité:</span><span>{donation.valuation.estimatedQuantityKg} kg</span>
                  <span>Prix/kg:</span><span>{donation.valuation.unitPriceEur} €</span>
                  <span>Valeur:</span><strong style={{ color: "var(--brand-500)" }}>{donation.valuation.estimatedValueEur} EUR</strong>
                </small>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fiscal Receipts Tab ──────────────────────────────────────────────────────
function FiscalTab() {
  const [restaurants, setRestaurants] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear() - 1);
  const [sending, setSending] = useState({});
  const [results, setResults] = useState({});

  async function load() {
    const { data } = await api.get("/admin/users?role=restaurant&status=active");
    setRestaurants(data);
  }

  useEffect(() => { load(); }, []);

  async function sendReceipt(restaurantId) {
    setSending((s) => ({ ...s, [restaurantId]: true }));
    try {
      const { data } = await api.post(`/admin/donations/${restaurantId}/fiscal-receipt/${year}`);
      setResults((r) => ({
        ...r,
        [restaurantId]: { ok: true, total: data.totalValueEur, count: data.donationCount }
      }));
    } catch (err) {
      setResults((r) => ({
        ...r,
        [restaurantId]: { ok: false, error: err.response?.data?.message || "Erreur" }
      }));
    } finally {
      setSending((s) => ({ ...s, [restaurantId]: false }));
    }
  }

  return (
    <div className="admin-section">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}><FileText size={16} /> Reçus Fiscaux Annuels</h2>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ fontSize: 13, padding: "6px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)" }}>
          {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16, lineHeight: 1.6 }}>
        Générez et envoyez les reçus fiscaux annuels à chaque restaurateur partenaire. La valorisation IA est calculée automatiquement sur l'ensemble des dons de l'année sélectionnée.
      </p>
      <div className="list-grid">
        {restaurants.map((r) => {
          const res = results[r._id];
          return (
            <div key={r._id} className="data-card">
              <div className="data-card-body">
                <strong>🍽️ {r.organizationName || r.email}</strong>
                <span>{r.email} {r.sirenSiret ? `· SIRET: ${r.sirenSiret}` : ""}</span>
                {res && res.ok && (
                  <small style={{ color: "var(--brand-500)", fontWeight: 700 }}>
                    ✅ Reçu envoyé · {res.count} dons · {res.total} EUR
                  </small>
                )}
                {res && !res.ok && (
                  <small style={{ color: "var(--red-500)" }}>❌ {res.error}</small>
                )}
              </div>
              <div className="data-card-actions">
                <button
                  className="btn-primary"
                  disabled={sending[r._id]}
                  onClick={() => sendReceipt(r._id)}
                  style={{ padding: "8px 12px", fontSize: 13 }}
                >
                  <Send size={14} />
                  {sending[r._id] ? "Envoi..." : `Envoyer ${year}`}
                </button>
              </div>
            </div>
          );
        })}
        {restaurants.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "16px 0" }}>
            Aucun restaurateur actif enregistré.
          </div>
        )}
      </div>
    </div>
  );
}
