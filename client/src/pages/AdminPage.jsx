import { useEffect, useState } from "react";
import {
  ShieldCheck, Users, User, MapPin, Store, BarChart3, FileText,
  CheckCircle2, XCircle, Trash2, Send, RefreshCw, Filter,
  Clock, Zap, Camera, Eye, AlertTriangle
} from "lucide-react";
import { api } from "../api/http";

const TABS = [
  { id: "dashboard", label: "Supervision", icon: BarChart3 },
  { id: "users", label: "Utilisateurs", icon: Users },
  { id: "reports", label: "Signalements", icon: MapPin },
  { id: "donations", label: "Dons & IA", icon: Store },
  { id: "fiscal", label: "Reçus Fiscaux", icon: FileText }
];

const STATUS_LABELS = {
  new: "Nouveau",
  in_progress: "En cours",
  resolved: "Résolu",
  removed: "Retiré"
};

export function AdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [pendingOrgs, setPendingOrgs] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  async function loadDashboard() {
    const [{ data: stats }, { data: orgs }, { data: statusReports }] = await Promise.all([
      api.get("/admin/dashboard"),
      api.get("/admin/organizations/pending"),
      api.get("/admin/reports/pending-status").catch(() => ({ data: [] }))
    ]);
    setDashboard(stats);
    setPendingOrgs(orgs);
    setPendingReports(statusReports);
  }

  useEffect(() => { loadDashboard(); }, []);

  const totalPending = pendingOrgs.length + pendingReports.length;

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
            {id === "dashboard" && totalPending > 0 && (
              <span className="tab-badge">{totalPending}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "dashboard" && (
        <DashboardTab
          dashboard={dashboard}
          pendingOrgs={pendingOrgs}
          pendingReports={pendingReports}
          onChanged={loadDashboard}
        />
      )}
      {tab === "users" && <UsersTab />}
      {tab === "reports" && <ReportsTab onChanged={loadDashboard} />}
      {tab === "donations" && <DonationsTab />}
      {tab === "fiscal" && <FiscalTab />}
    </div>
  );
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────
function DashboardTab({ dashboard, pendingOrgs, pendingReports, onChanged }) {
  async function setOrgStatus(id, status) {
    await api.patch(`/admin/organizations/${id}/status`, { status });
    onChanged();
  }

  async function handleConfirmReportStatus(reportId, action) {
    await api.patch(`/reports/${reportId}/confirm-status`, { action });
    onChanged();
  }

  const stats = dashboard
    ? [
        { label: "Utilisateurs", value: dashboard.users, icon: Users },
        { label: "Signalements", value: dashboard.reports, icon: MapPin },
        { label: "Résolus", value: dashboard.resolvedReports, icon: CheckCircle2 },
        { label: "Statuts en attente", value: pendingReports.length, icon: Clock },
        { label: "Dons déclarés", value: dashboard.donations, icon: Store }
      ]
    : [];

  return (
    <>
      {/* Stats */}
      <div className="stats-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon"><Icon size={18} /></div>
            <div className="stat-label">{label}</div>
            <div className="stat-value">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      {/* Pending status change requests from associations */}
      <div className="admin-section">
        <h2><Clock size={16} /> Demandes de statut d'associations ({pendingReports.length})</h2>
        {pendingReports.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
            <CheckCircle2 size={16} style={{ display: "inline", marginRight: 6 }} />
            Aucun changement de statut en attente de confirmation admin.
          </div>
        ) : (
          <div className="list-grid">
            {pendingReports.map((report) => (
              <div key={report._id} className="data-card" style={{ borderLeft: "4px solid #6366f1" }}>
                <div className="data-card-body">
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <strong>
                      {report.type === "individual" ? "Signalement individuel" : `Groupe · ${report.group?.peopleCount || "?"} pers.`}
                    </strong>
                    {report.isAnonymous && (
                      <span style={{ fontSize: 10, background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", padding: "2px 7px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                        <Zap size={9} style={{ display: "inline", marginRight: 2 }} /> Anonyme
                      </span>
                    )}
                    <span className={`urgency-badge ${report.urgency}`}>{report.urgency}</span>
                  </div>

                  <span style={{ fontSize: 13 }}>
                    Statut actuel : <span className={`status-badge ${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span>
                    {" ➔ "}
                    Demande de passage à : <strong style={{ color: "var(--brand-700)", background: "var(--brand-50)", padding: "2px 8px", borderRadius: 4 }}>
                      {STATUS_LABELS[report.pendingStatus?.status] || report.pendingStatus?.status}
                    </strong>
                  </span>

                  {report.comment && (
                    <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0", fontStyle: "italic" }}>
                      « {report.comment} »
                    </p>
                  )}

                  {report.pendingStatus?.note && (
                    <small style={{ color: "var(--text-muted)", display: "block" }}>
                      Note de l'association : {report.pendingStatus.note}
                    </small>
                  )}

                  <small style={{ color: "var(--text-muted)" }}>
                    Demandé par : <strong>{report.pendingStatus?.requestedBy?.organizationName || "Association"}</strong> ({report.pendingStatus?.requestedBy?.email})
                    {report.pendingStatus?.requestedAt && ` · ${new Date(report.pendingStatus.requestedAt).toLocaleString("fr-FR")}`}
                  </small>
                </div>
                <div className="data-card-actions">
                  <button className="btn-success" onClick={() => handleConfirmReportStatus(report._id, "approve")}>
                    <CheckCircle2 size={14} /> Confirmer
                  </button>
                  <button className="btn-danger" onClick={() => handleConfirmReportStatus(report._id, "reject")}>
                    <XCircle size={14} /> Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending org validations */}
      <div className="admin-section">
        <h2><ShieldCheck size={16} /> Comptes d'organisations à valider ({pendingOrgs.length})</h2>
        {pendingOrgs.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: 13, padding: "12px 0" }}>
            <CheckCircle2 size={16} style={{ display: "inline", marginRight: 6 }} />
            Aucun compte en attente de validation.
          </div>
        ) : (
          <div className="list-grid">
            {pendingOrgs.map((org) => (
              <div key={org._id} className="data-card">
                <div className="data-card-body">
                  <strong>{org.organizationName || org.email}</strong>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    {org.role === "association" ? <ShieldCheck size={13} /> : <Store size={13} />}
                    {org.role === "association" ? "Association" : "Restaurateur"} · {org.sirenSiret} · {org.email}
                  </span>
                  {org.address && <small>{org.address}</small>}
                </div>
                <div className="data-card-actions">
                  <button className="btn-success" onClick={() => setOrgStatus(org._id, "active")}>
                    <CheckCircle2 size={14} /> Valider
                  </button>
                  <button className="btn-danger" onClick={() => setOrgStatus(org._id, "rejected")}>
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
function ReportsTab({ onChanged }) {
  const [reports, setReports] = useState([]);
  const [filters, setFilters] = useState({ status: "", urgency: "", type: "", pending: "", isAnonymous: "" });
  const [previewImage, setPreviewImage] = useState(null);

  async function load() {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.urgency) params.set("urgency", filters.urgency);
    if (filters.type) params.set("type", filters.type);
    if (filters.pending) params.set("pending", filters.pending);
    if (filters.isAnonymous) params.set("isAnonymous", filters.isAnonymous);
    const { data } = await api.get(`/admin/reports?${params}`);
    setReports(data);
  }

  useEffect(() => { load(); }, [filters]);

  async function deleteReport(id) {
    await api.delete(`/reports/${id}`);
    load();
    if (onChanged) onChanged();
  }

  async function handleAdminSetStatus(reportId, newStatus) {
    await api.patch(`/reports/${reportId}`, { status: newStatus });
    load();
    if (onChanged) onChanged();
  }

  async function handleConfirmReportStatus(reportId, action) {
    await api.patch(`/reports/${reportId}/confirm-status`, { action });
    load();
    if (onChanged) onChanged();
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
          <option value="red">Rouge</option>
          <option value="yellow">Jaune</option>
          <option value="green">Vert</option>
        </select>
        <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
          <option value="">Tous types</option>
          <option value="individual">Individuel</option>
          <option value="group">Groupe</option>
        </select>
        <select value={filters.pending} onChange={(e) => setFilters((f) => ({ ...f, pending: e.target.value }))}>
          <option value="">Toutes demandes</option>
          <option value="true">Statut en attente admin</option>
        </select>
        <select value={filters.isAnonymous} onChange={(e) => setFilters((f) => ({ ...f, isAnonymous: e.target.value }))}>
          <option value="">Tous créateurs</option>
          <option value="true">Signalements rapides (Anonymes)</option>
        </select>
      </div>

      <div className="list-grid">
        {reports.map((report) => (
          <div key={report._id} className="data-card" style={{ alignItems: "flex-start", borderLeft: report.pendingStatus?.status ? "4px solid #6366f1" : undefined }}>
            <div className="data-card-body" style={{ width: "100%" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <strong style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {report.type === "individual" ? <User size={14} /> : <Users size={14} />}
                  {report.type === "individual" ? "Individuel" : `Groupe · ${report.group?.peopleCount || "?"} pers.`}
                </strong>
                {report.isAnonymous && (
                  <span style={{ fontSize: 10, background: "#e0e7ff", color: "#4338ca", border: "1px solid #c7d2fe", padding: "2px 7px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>
                    <Zap size={9} style={{ display: "inline", marginRight: 2 }} /> Anonyme
                  </span>
                )}
                <span className={`urgency-badge ${report.urgency}`}>
                  <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: report.urgency === "red" ? "var(--red-500)" : report.urgency === "yellow" ? "var(--yellow-500)" : "var(--green-500)" }} />
                  {report.urgency}
                </span>
              </div>

              {/* Description */}
              {report.comment && (
                <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0", fontStyle: "italic" }}>
                  « {report.comment} »
                </p>
              )}

              {/* Photo thumbnail */}
              {report.imageUrl && (
                <div style={{ marginTop: 4, marginBottom: 4 }}>
                  <img
                    src={report.imageUrl}
                    alt="Miniature"
                    onClick={() => setPreviewImage(report.imageUrl)}
                    style={{ maxHeight: 65, borderRadius: 4, border: "1px solid var(--border)", cursor: "pointer" }}
                  />
                </div>
              )}

              {/* Status & Change select */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Statut actuel :</span>
                <select
                  value={report.status}
                  onChange={(e) => handleAdminSetStatus(report._id, e.target.value)}
                  style={{ fontSize: 12, padding: "3px 8px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", fontWeight: 700 }}
                >
                  <option value="new">Nouveau</option>
                  <option value="in_progress">En cours</option>
                  <option value="resolved">Résolu</option>
                  <option value="removed">Retiré</option>
                </select>
                <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· Besoins : {report.needs?.join(", ") || "Aucun"}</span>
              </div>

              {/* Pending confirmation notice & 1-click actions */}
              {report.pendingStatus?.status && (
                <div style={{ background: "var(--color-green-light)", border: "1px solid var(--color-border-strong)", padding: "8px 12px", borderRadius: "var(--radius-sm)", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--color-primary-dark)", display: "flex", alignItems: "center", gap: 5 }}>
                    <Clock size={13} style={{ color: "var(--color-primary)" }} /> Demande association : passer à <strong>{STATUS_LABELS[report.pendingStatus.status] || report.pendingStatus.status}</strong>
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-success" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => handleConfirmReportStatus(report._id, "approve")}>
                      <CheckCircle2 size={12} /> Valider
                    </button>
                    <button className="btn-danger" style={{ padding: "3px 8px", fontSize: 11 }} onClick={() => handleConfirmReportStatus(report._id, "reject")}>
                      <XCircle size={12} /> Rejeter
                    </button>
                  </div>
                </div>
              )}

              <small style={{ marginTop: 4 }}>
                {new Date(report.createdAt).toLocaleString("fr-FR")}
                {report.createdBy?.email ? ` · Par ${report.createdBy.email}` : " · Signalement anonyme"}
                {report.addressHint && ` · ${report.addressHint}`}
              </small>
            </div>

            <div className="data-card-actions">
              <button className="btn-danger" style={{ padding: "7px 10px" }} onClick={() => deleteReport(report._id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Image preview modal */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)}>
          <div className="modal-box" style={{ maxWidth: 700, padding: 12, background: "#111", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button className="btn-secondary" style={{ padding: "4px 8px", color: "white", borderColor: "#444" }} onClick={() => setPreviewImage(null)}>
                Fermer
              </button>
            </div>
            <img src={previewImage} alt="Aperçu" style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 6 }} />
          </div>
        </div>
      )}
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
            <div className="stat-icon" style={{ flexShrink: 0 }}>
              <Store size={18} />
            </div>
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
                <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Store size={14} /> {r.organizationName || r.email}
                </strong>
                <span>{r.email} {r.sirenSiret ? `· SIRET: ${r.sirenSiret}` : ""}</span>
                {res && res.ok && (
                  <small style={{ color: "var(--brand-500)", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
                    <CheckCircle2 size={13} /> Reçu envoyé · {res.count} dons · {res.total} EUR
                  </small>
                )}
                {res && !res.ok && (
                  <small style={{ color: "var(--red-500)", display: "flex", alignItems: "center", gap: 5 }}>
                    <XCircle size={13} /> {res.error}
                  </small>
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
