import { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle, CheckCircle2, Plus, X, Filter, Phone, Heart,
  User, Users, MapPin, Clock, ChevronRight, CheckSquare, BarChart3,
  Zap, Camera, ShieldCheck, XCircle, Eye
} from "lucide-react";
import { api } from "../api/http";

const NEEDS_LABELS = {
  hygiene: "Hygiène",
  clothes: "Vêtements",
  food: "Alimentation",
  shelter: "Hébergement",
  health: "Soins médicaux",
  psychological: "Soutien psychologique",
  other: "Autre"
};

const STATUS_LABELS = {
  new: "Nouveau",
  in_progress: "En cours",
  resolved: "Résolu",
  removed: "Retiré"
};

const NEEDS = Object.keys(NEEDS_LABELS);

// Custom Leaflet marker icons based on urgency and type
function createMarkerIcon(urgency, type) {
  const colors = { green: "#159A78", yellow: "#08745A", red: "#DC2626" };
  const bg = colors[urgency] || "#159A78";
  const icon =
    type === "group"
      ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`
      : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  return L.divIcon({
    className: "",
    html: `<div style="
      width:36px;height:36px;
      background:${bg};
      border:3px solid white;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      box-shadow:0 2px 8px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
    "><span style="transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">${icon}</span></div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -38]
  });
}

// Map click handler component
function MapClickHandler({ onClick }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lng, e.latlng.lat]);
    }
  });
  return null;
}

function TypeLabel({ report, type, count }) {
  const isGroup = (report?.type || type) === "group";
  const peopleCount = report?.group?.peopleCount || count;
  const Icon = isGroup ? Users : User;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <Icon size={13} />
      {isGroup ? `Groupe${peopleCount ? ` · ${peopleCount} pers.` : ""}` : "Individuel"}
      {report?.isAnonymous && (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "var(--color-green-light)", color: "var(--color-primary-dark)", border: "1px solid var(--color-border-strong)", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: "var(--radius-full)" }}>
          <Zap size={9} /> Rapide
        </span>
      )}
    </span>
  );
}

function UrgencyLabel({ urgency, withText = false }) {
  const labels = { red: "Urgent", yellow: "Important", green: "Stable" };
  const colors = { red: "#DC2626", yellow: "#08745A", green: "#159A78" };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span
        aria-hidden="true"
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: colors[urgency] || "var(--text-muted)",
          boxShadow: "0 0 0 2px rgba(255,255,255,0.65)"
        }}
      />
      {withText ? labels[urgency] || urgency : urgency}
    </span>
  );
}

export function ReportsPage({ user }) {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [filters, setFilters] = useState({ status: "", urgency: "", needs: "" });
  const [stats, setStats] = useState(null);

  async function loadReports() {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.urgency) params.set("urgency", filters.urgency);
    if (filters.needs) params.set("needs", filters.needs);
    const { data } = await api.get(`/reports?${params.toString()}`);
    setReports(data);

    if (user.role === "association") {
      const resolved = data.filter((r) => r.status === "resolved").length;
      const inProgress = data.filter((r) => r.status === "in_progress").length;
      setStats({ total: data.length, resolved, inProgress });
    }
  }

  useEffect(() => {
    loadReports().catch(() => setError("Impossible de charger les signalements."));
  }, [filters]);

  const isViewer = user.role === "association" || user.role === "admin";

  return (
    <div style={{ height: "calc(100vh - 56px)", display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1>Signalements</h1>
          <p>
            {user.role === "citizen"
              ? "Vos signalements uniquement."
              : user.role === "association"
              ? "Signalements affectés à votre secteur."
              : "Tous les signalements actifs."}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {stats && (
            <div style={{ display: "flex", gap: 8 }}>
              <span className="metric" style={{ fontSize: 13 }}>
                <BarChart3 size={13} style={{ display: "inline", marginRight: 4 }} />
                {stats.resolved} résolus / {stats.total}
              </span>
            </div>
          )}
          {user.role === "citizen" && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Nouveau signalement
            </button>
          )}
        </div>
      </div>

      {/* Filters for associations/admin */}
      {isViewer && (
        <div className="filters-bar">
          <Filter size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
            <option value="">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="in_progress">En cours</option>
            <option value="resolved">Résolu</option>
            <option value="removed">Retiré</option>
          </select>
          <select value={filters.urgency} onChange={(e) => setFilters((f) => ({ ...f, urgency: e.target.value }))}>
            <option value="">Toutes urgences</option>
            <option value="red">Rouge (critique)</option>
            <option value="yellow">Jaune (important)</option>
            <option value="green">Vert (stable)</option>
          </select>
          <select value={filters.needs} onChange={(e) => setFilters((f) => ({ ...f, needs: e.target.value }))}>
            <option value="">Tous les besoins</option>
            {NEEDS.map((n) => <option key={n} value={n}>{NEEDS_LABELS[n]}</option>)}
          </select>
          {(filters.status || filters.urgency || filters.needs) && (
            <button className="btn-secondary" onClick={() => setFilters({ status: "", urgency: "", needs: "" })}>
              <X size={13} /> Réinitialiser
            </button>
          )}
        </div>
      )}

      {/* Main content grid */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 20, flex: 1, overflow: "hidden" }}>
        {/* Map */}
        <div className="map-wrap">
          <MapContainer center={[48.8566, 2.3522]} zoom={11} scrollWheelZoom className="map">
            <TileLayer attribution="© OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {user.interventionZone?.center && (
              <Circle
                center={[user.interventionZone.center.coordinates[1], user.interventionZone.center.coordinates[0]]}
                radius={(user.interventionZone.radiusKm || 0) * 1000}
                pathOptions={{ color: "var(--brand-400)", fillOpacity: 0.06 }}
              />
            )}
            {reports.map((report) => (
              <Marker
                key={report._id}
                position={[report.location.coordinates[1], report.location.coordinates[0]]}
                icon={createMarkerIcon(report.urgency, report.type)}
                eventHandlers={{ click: () => setSelectedReport(report) }}
              >
                <Popup>
                  <div style={{ minWidth: 200 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span className={`urgency-badge ${report.urgency}`}>
                        <UrgencyLabel urgency={report.urgency} />
                      </span>
                      <span className={`status-badge ${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span>
                      {report.pendingStatus?.status && (
                        <span style={{ fontSize: 10, background: "var(--color-green-light)", color: "var(--color-primary-dark)", border: "1px solid var(--color-border-strong)", padding: "2px 6px", borderRadius: 4, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 3 }}>
                          <Clock size={10} /> En attente admin
                        </span>
                      )}
                    </div>
                    <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
                      <TypeLabel report={report} />
                    </strong>
                    {report.comment && (
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 6px", fontStyle: "italic" }}>
                        « {report.comment} »
                      </p>
                    )}
                    {report.imageUrl && (
                      <div style={{ marginBottom: 6 }}>
                        <img src={report.imageUrl} alt="Aperçu" style={{ width: "100%", maxHeight: 90, objectFit: "cover", borderRadius: 4 }} />
                      </div>
                    )}
                    {report.needs?.length > 0 && (
                      <div className="needs-grid" style={{ marginBottom: 6 }}>
                        {report.needs.map((n) => (
                          <span key={n} className={`need-chip ${report.fulfilledNeeds?.includes(n) ? "fulfilled" : ""}`}>
                            {NEEDS_LABELS[n]}
                          </span>
                        ))}
                      </div>
                    )}
                    <small style={{ color: "var(--text-muted)" }}>
                      <Clock size={10} style={{ display: "inline", marginRight: 3 }} />
                      {new Date(report.createdAt).toLocaleString("fr-FR")}
                    </small>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Side panel */}
        <div className="side-panel" style={{ overflow: "auto" }}>
          {user.role === "citizen" ? (
            <CitizenPanel reports={reports} onOpenForm={() => setShowForm(true)} />
          ) : selectedReport ? (
            <ReportDetailPane
              report={selectedReport}
              user={user}
              onClose={() => setSelectedReport(null)}
              onChanged={async () => { await loadReports(); setSelectedReport(null); }}
            />
          ) : (
            <ReportQueue reports={reports} onSelect={setSelectedReport} onChanged={loadReports} />
          )}
          {error && <p className="error">{error}</p>}
        </div>
      </div>

      {/* New report modal (citizen) */}
      {showForm && (
        <ReportFormModal user={user} onClose={() => setShowForm(false)} onCreated={loadReports} />
      )}
    </div>
  );
}

// ─── Citizen panel (list own reports) ───────────────────────────────────────
function CitizenPanel({ reports, onOpenForm }) {
  return (
    <div className="stack">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
        <h2 style={{ margin: 0 }}><MapPin size={16} /> Mes signalements</h2>
        <button className="btn-primary" style={{ padding: "7px 12px", fontSize: 12 }} onClick={onOpenForm}>
          <Plus size={14} /> Nouveau
        </button>
      </div>
      {reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 16px", color: "var(--text-muted)" }}>
          <MapPin size={32} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Aucun signalement pour l'instant.<br />Cliquez sur "Nouveau" pour en créer un.</p>
        </div>
      ) : (
        reports.map((report) => (
          <div key={report._id} className="mini-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <strong style={{ fontSize: 13 }}>
                <TypeLabel report={report} count={report.group?.peopleCount || "?"} />
              </strong>
              <span className={`urgency-badge ${report.urgency}`}>
                <UrgencyLabel urgency={report.urgency} />
              </span>
            </div>
            {report.comment && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0", fontStyle: "italic" }}>
                « {report.comment} »
              </p>
            )}
            {report.needs?.length > 0 && (
              <div className="needs-grid">
                {report.needs.map((n) => <span key={n} className="need-chip">{NEEDS_LABELS[n]}</span>)}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
              <span className={`status-badge ${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span>
              <small className="text-muted">{new Date(report.createdAt).toLocaleDateString("fr-FR")}</small>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Association queue ───────────────────────────────────────────────────────
function ReportQueue({ reports, onSelect, onChanged }) {
  return (
    <div className="stack">
      <h2><AlertTriangle size={16} /> File d'intervention</h2>
      {reports.length === 0 ? (
        <div style={{ textAlign: "center", padding: "24px 12px", color: "var(--text-muted)" }}>
          <CheckCircle2 size={28} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>Aucun signalement dans votre secteur.</p>
        </div>
      ) : (
        reports.map((report) => (
          <div
            key={report._id}
            className="mini-card"
            style={{ cursor: "pointer" }}
            onClick={() => onSelect(report)}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <strong style={{ fontSize: 13 }}>
                <TypeLabel report={report} count={report.group?.peopleCount || "?"} />
              </strong>
              <span className={`urgency-badge ${report.urgency}`}>
                <UrgencyLabel urgency={report.urgency} />
              </span>
            </div>

            {report.comment && (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 6px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                « {report.comment} »
              </p>
            )}

            {report.imageUrl && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--brand-600)", margin: "2px 0 6px" }}>
                <Camera size={12} /> Photo jointe
              </div>
            )}

            {report.needs?.length > 0 && (
              <div className="needs-grid">
                {report.needs.slice(0, 3).map((n) => (
                  <span key={n} className={`need-chip ${report.fulfilledNeeds?.includes(n) ? "fulfilled" : ""}`}>
                    {NEEDS_LABELS[n]}
                  </span>
                ))}
                {report.needs.length > 3 && <span className="need-chip">+{report.needs.length - 3}</span>}
              </div>
            )}

            {report.pendingStatus?.status && (
              <div style={{ fontSize: 11, background: "var(--color-green-light)", color: "var(--color-primary-dark)", border: "1px solid var(--color-border-strong)", padding: "3px 8px", borderRadius: "var(--radius-sm)", fontWeight: 600, margin: "4px 0", display: "flex", alignItems: "center", gap: 5 }}>
                <Clock size={11} /> Demande : {STATUS_LABELS[report.pendingStatus.status] || report.pendingStatus.status} (en attente admin)
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <span className={`status-badge ${report.status}`}>{STATUS_LABELS[report.status] || report.status}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-muted)", fontSize: 11 }}>
                <ChevronRight size={13} />
                Voir détail
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Report Detail Pane ──────────────────────────────────────────────────────
function ReportDetailPane({ report, user, onClose, onChanged }) {
  const [fulfilledNeeds, setFulfilledNeeds] = useState(report.fulfilledNeeds || []);
  const [status, setStatus] = useState(report.status);
  const [notes, setNotes] = useState(report.associationNotes || "");
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || "");
  const [saving, setSaving] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  function toggleNeed(need) {
    setFulfilledNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  }

  async function save() {
    setSaving(true);
    await api.patch(`/reports/${report._id}`, {
      status,
      fulfilledNeeds,
      associationNotes: notes,
      adminNotes: user.role === "admin" ? adminNotes : undefined
    });
    await onChanged();
    setSaving(false);
  }

  async function handleAdminConfirmStatus(action) {
    setSaving(true);
    await api.patch(`/reports/${report._id}/confirm-status`, { action });
    await onChanged();
    setSaving(false);
  }

  const ind = report.individual;
  const grp = report.group;

  return (
    <div className="report-detail">
      <div className="report-detail-header">
        <div>
          <strong style={{ fontSize: 15, fontWeight: 800 }}>
            <TypeLabel report={report} count={grp?.peopleCount || "?"} />
          </strong>
          <div className="report-detail-meta" style={{ marginTop: 4 }}>
            <span className={`urgency-badge ${report.urgency}`}>
              <UrgencyLabel urgency={report.urgency} withText />
            </span>
            <span className={`status-badge ${report.status}`}>
              {STATUS_LABELS[report.status] || report.status}
            </span>
          </div>
        </div>
        <button className="btn-secondary" style={{ padding: "6px 8px" }} onClick={onClose}><X size={15} /></button>
      </div>

      {/* Description / Comment */}
      {report.comment && (
        <div style={{ background: "var(--surface-subtle)", padding: 10, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 3 }}>
            Description du signalement
          </div>
          <p style={{ fontSize: 13, color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
            {report.comment}
          </p>
        </div>
      )}

      {/* Photo Preview if available */}
      {report.imageUrl && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
            <Camera size={12} /> Photo de la situation
          </div>
          <div
            style={{ position: "relative", cursor: "pointer", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1.5px solid var(--border)", background: "#000" }}
            onClick={() => setShowFullImage(true)}
          >
            <img src={report.imageUrl} alt="Photo du signalement" style={{ width: "100%", maxHeight: 150, objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", bottom: 6, right: 6, background: "rgba(0,0,0,0.65)", color: "white", padding: "3px 8px", borderRadius: "var(--radius-sm)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={12} /> Agrandir
            </div>
          </div>
        </div>
      )}

      {/* Pending status banner for Association / Admin */}
      {report.pendingStatus?.status && (
        <div style={{ background: "var(--color-green-light)", border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-md)", padding: 12, display: "flex", alignItems: "flex-start", gap: 10, color: "var(--color-primary-dark)" }}>
          <Clock size={16} style={{ flexShrink: 0, marginTop: 2, color: "var(--color-primary)" }} />
          <div style={{ fontSize: 12, lineHeight: 1.4 }}>
            <strong style={{ color: "var(--color-primary-deep)" }}>Demande en attente de validation admin :</strong><br />
            Passage à <strong>"{STATUS_LABELS[report.pendingStatus.status] || report.pendingStatus.status}"</strong> demandé par{" "}
            {report.pendingStatus.requestedBy?.organizationName || "l'association"}.
            {user.role === "admin" && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <button
                  className="btn-success"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  disabled={saving}
                  onClick={() => handleAdminConfirmStatus("approve")}
                >
                  <CheckCircle2 size={12} /> Valider le statut
                </button>
                <button
                  className="btn-danger"
                  style={{ padding: "4px 10px", fontSize: 11 }}
                  disabled={saving}
                  onClick={() => handleAdminConfirmStatus("reject")}
                >
                  <XCircle size={12} /> Refuser
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info details */}
      {ind && (
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          {ind.apparentGender && <span>Sexe apparent : <strong>{ind.apparentGender === "male" ? "Homme" : ind.apparentGender === "female" ? "Femme" : "Indéterminé"}</strong></span>}
          {ind.ageRange && <span>Tranche d'âge : <strong>{ind.ageRange}</strong></span>}
          {ind.languageBarrier && <span><AlertTriangle size={13} style={{ display: "inline", marginRight: 5 }} />Barrière de la langue</span>}
          {ind.spokenToPerson && <span><CheckCircle2 size={13} style={{ display: "inline", marginRight: 5 }} />Contact direct établi</span>}
          {ind.requestedHelp && <span><Heart size={13} style={{ display: "inline", marginRight: 5 }} />Aide explicitement demandée</span>}
        </div>
      )}
      {grp && (
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          {grp.majorityGender && <span>Genre majoritaire : <strong>{grp.majorityGender === "male" ? "Homme" : grp.majorityGender === "female" ? "Femme" : "Mixte"}</strong></span>}
          {grp.averageAgeRange && <span>Âge moyen estimé : <strong>{grp.averageAgeRange}</strong></span>}
        </div>
      )}

      {report.otherNeed && (
        <div style={{ fontSize: 13 }}>Autre besoin : <em>{report.otherNeed}</em></div>
      )}

      {/* Needs checkboxes */}
      {report.needs?.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>Besoins satisfaits</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {report.needs.map((n) => (
              <label key={n} className="check" style={{ fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={fulfilledNeeds.includes(n)}
                  onChange={() => toggleNeed(n)}
                />
                <span style={{ textDecoration: fulfilledNeeds.includes(n) ? "line-through" : "none", color: fulfilledNeeds.includes(n) ? "var(--text-muted)" : "var(--text-primary)" }}>
                  {NEEDS_LABELS[n]}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Status selector */}
      <label>
        <span style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Statut du signalement</span>
          {user.role === "association" && (
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: "normal" }}>
              (Validation admin requise)
            </span>
          )}
        </span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="new">Nouveau</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="removed">Retiré</option>
        </select>
      </label>

      {/* Notes */}
      <label>
        Remarques d'intervention (association)
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes d'intervention..." />
      </label>

      {user.role === "admin" && (
        <label>
          Notes administratives internes
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Notes de modération admin..." />
        </label>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" disabled={saving} onClick={save} style={{ flex: 1, justifyContent: "center" }}>
          <CheckSquare size={15} /> {saving ? "Enregistrement..." : user.role === "association" && status !== report.status ? "Proposer le changement de statut" : "Sauvegarder"}
        </button>
      </div>

      <small className="text-muted">
        <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
        {new Date(report.createdAt).toLocaleString("fr-FR")}
        {report.addressHint && ` · ${report.addressHint}`}
        {report.isAnonymous && " · Signalement anonyme"}
      </small>

      {/* Full Image Modal */}
      {showFullImage && (
        <div className="modal-overlay" onClick={() => setShowFullImage(false)}>
          <div className="modal-box" style={{ maxWidth: 700, padding: 12, background: "#111", textAlign: "center" }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button className="btn-secondary" style={{ padding: "4px 8px", color: "white", borderColor: "#444" }} onClick={() => setShowFullImage(false)}>
                <X size={16} />
              </button>
            </div>
            <img src={report.imageUrl} alt="Photo agrandie" style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: 6 }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report Form Modal (Citizen) ─────────────────────────────────────────────
function ReportFormModal({ user, onClose, onCreated }) {
  const [step, setStep] = useState("type"); // type → form → result
  const [type, setType] = useState("individual");
  const [urgency, setUrgency] = useState("green");
  const [coords, setCoords] = useState([2.3522, 48.8566]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [contactDeclined, setContactDeclined] = useState(false);
  const [ageRange, setAgeRange] = useState(30);
  const [groupCount, setGroupCount] = useState(10);
  const [avgAge, setAvgAge] = useState(35);
  const formRef = useRef();

  function ageLabel(v) {
    const lo = Math.max(15, Math.round(v / 10) * 10);
    return `${lo}–${lo + 10} ans`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      type,
      coordinates: coords,
      addressHint: form.get("addressHint"),
      urgency,
      needs: form.getAll("needs"),
      otherNeed: form.get("otherNeed"),
      individual: type === "individual"
        ? {
            apparentGender: form.get("apparentGender"),
            ageRange: `${ageRange}–${ageRange + 10} ans`,
            languageBarrier: form.get("languageBarrier") === "on",
            spokenToPerson: form.get("spokenToPerson") === "on",
            requestedHelp: form.get("requestedHelp") === "on"
          }
        : undefined,
      group: type === "group"
        ? {
            peopleCount: groupCount,
            majorityGender: form.get("majorityGender"),
            averageAgeRange: `${avgAge}–${avgAge + 10} ans`
          }
        : undefined
    };
    const { data } = await api.post("/reports", payload);
    setResult(data);
    setStep("result");
    setLoading(false);
    await onCreated();
  }

  async function handleDeclineContact() {
    if (result?.report?._id) {
      await api.post(`/reports/${result.report._id}/decline-contact`).catch(() => {});
    }
    setContactDeclined(true);
  }

  const associations = result?.report?.assignedAssociations || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 560 }}>
        {/* STEP 1: Type selection */}
        {step === "type" && (
          <>
            <h2><Plus size={18} style={{ display: "inline", marginRight: 6 }} />Nouveau signalement</h2>
            <p>Quelle situation souhaitez-vous signaler ?</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { id: "individual", Icon: User, label: "Individuel", desc: "Une seule personne en difficulté" },
                { id: "group", Icon: Users, label: "Groupe", desc: "Plusieurs personnes au même endroit" }
              ].map(({ id, Icon, label, desc }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => { setType(id); setStep("form"); }}
                  style={{
                    padding: 18, border: "2px solid var(--border)", borderRadius: "var(--radius-lg)",
                    cursor: "pointer", textAlign: "center", transition: "all var(--transition)",
                    background: "var(--surface-card)"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-400)"; e.currentTarget.style.background = "var(--brand-50)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-card)"; }}
                >
                  <Icon size={34} style={{ margin: "0 auto 8px", color: "var(--brand-500)" }} />
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>{desc}</div>
                </button>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={onClose}><X size={14} /> Annuler</button>
            </div>
          </>
        )}

        {/* STEP 2: Form */}
        {step === "form" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0 }}>
                <TypeLabel type={type} /> Signalement
              </h2>
              <button className="btn-secondary" style={{ padding: "5px 8px" }} onClick={() => setStep("type")}><X size={14} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="form-grid" style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>

              {/* Location */}
              <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: 12, border: "1.5px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  <MapPin size={13} style={{ display: "inline", marginRight: 5 }} /> Localisation
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label>Longitude<input name="lng" type="number" step="0.0001" value={coords[0].toFixed(4)} onChange={(e) => setCoords([Number(e.target.value), coords[1]])} /></label>
                  <label>Latitude<input name="lat" type="number" step="0.0001" value={coords[1].toFixed(4)} onChange={(e) => setCoords([coords[0], Number(e.target.value)])} /></label>
                </div>
                <label style={{ marginTop: 10 }}>Adresse ou repère<input name="addressHint" placeholder="Ex: angle rue de la Paix / boulevard Haussmann" /></label>
              </div>

              {/* Individual fields */}
              {type === "individual" && (
                <>
                  <label>
                    Sexe apparent
                    <select name="apparentGender">
                      <option value="unknown">Indéterminé</option>
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                    </select>
                  </label>
                  <div className="slider-wrap">
                    <div className="slider-label-row">
                      <span>Tranche d'âge estimée</span>
                      <strong>{ageRange}–{ageRange + 10} ans</strong>
                    </div>
                    <input type="range" min={15} max={70} step={5} value={ageRange} onChange={(e) => setAgeRange(Number(e.target.value))} />
                    <div className="slider-label-row"><span>15 ans</span><span>70+ ans</span></div>
                  </div>
                  <label className="check"><input name="languageBarrier" type="checkbox" />Barrière de la langue</label>
                  <label className="check"><input name="spokenToPerson" type="checkbox" />Vous avez parlé à la personne</label>
                  <label className="check"><input name="requestedHelp" type="checkbox" />La personne a demandé de l'aide</label>
                </>
              )}

              {/* Group fields */}
              {type === "group" && (
                <>
                  <div className="slider-wrap">
                    <div className="slider-label-row"><span>Nombre de personnes</span><strong style={{ fontSize: 18 }}>{groupCount}</strong></div>
                    <input type="range" min={2} max={200} step={5} value={groupCount} onChange={(e) => setGroupCount(Number(e.target.value))} />
                    <div className="slider-label-row"><span>2</span><span>200+</span></div>
                  </div>
                  <label>
                    Genre majoritaire
                    <select name="majorityGender">
                      <option value="mixed">Mixte</option>
                      <option value="male">Homme majoritaire</option>
                      <option value="female">Femme majoritaire</option>
                    </select>
                  </label>
                  <div className="slider-wrap">
                    <div className="slider-label-row"><span>Âge moyen estimé</span><strong>{avgAge}–{avgAge + 10} ans</strong></div>
                    <input type="range" min={15} max={70} step={5} value={avgAge} onChange={(e) => setAvgAge(Number(e.target.value))} />
                    <div className="slider-label-row"><span>15 ans</span><span>70+ ans</span></div>
                  </div>
                </>
              )}

              {/* Needs */}
              <fieldset>
                <legend>Besoins identifiés</legend>
                {NEEDS.filter(n => n !== "other").map((n) => (
                  <label key={n} className="check"><input type="checkbox" name="needs" value={n} />{NEEDS_LABELS[n]}</label>
                ))}
              </fieldset>
              <label>Autre besoin<textarea name="otherNeed" placeholder="Précisez si nécessaire..." /></label>

              {/* Urgency */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Niveau d'urgence</div>
                <div className="urgency-selector">
                  {[
                    { id: "green", label: "Stable", desc: "Besoins non critiques" },
                    { id: "yellow", label: "Important", desc: "Intervention souhaitée" },
                    { id: "red", label: "Critique", desc: "Appeler le 15 ou le 18" }
                  ].map(({ id, label, desc }) => (
                    <div key={id} className={`urgency-option ${id} ${urgency === id ? "selected" : ""}`} onClick={() => setUrgency(id)}>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>
                        <UrgencyLabel urgency={id} withText /> {label !== (id === "green" ? "Stable" : id === "yellow" ? "Important" : "Critique") ? label : ""}
                      </div>
                      <div style={{ fontSize: 10 }}>{desc}</div>
                    </div>
                  ))}
                </div>
                {urgency === "red" && (
                  <div className="alert alert-red" style={{ marginTop: 10 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    Situation grave. Appelez le <strong>15 (SAMU)</strong> ou le <strong>18 (Pompiers)</strong> si la situation nécessite une intervention médicale d'urgence.
                  </div>
                )}
              </div>

              <input type="hidden" name="lng_hidden" value={coords[0]} />
              <input type="hidden" name="lat_hidden" value={coords[1]} />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setStep("type")}>Retour</button>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Envoi..." : "Envoyer le signalement"}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP 3: Result */}
        {step === "result" && (
          <>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <CheckCircle2 size={46} style={{ margin: "0 auto 10px", color: "var(--brand-500)" }} />
              <h2 style={{ margin: 0 }}>Signalement envoyé !</h2>
              <p style={{ color: "var(--text-secondary)", marginTop: 6 }}>
                {result?.assignedAssociations > 0
                  ? `${result.assignedAssociations} association(s) de votre secteur ont été alertées.`
                  : "Aucune association n'est encore inscrite dans ce secteur. L'administrateur a été notifié."}
              </p>
            </div>

            {!contactDeclined && associations.length > 0 && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>
                  Souhaitez-vous contacter directement l'association ?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  {associations.map((a) => (
                    <div key={a._id} className="assoc-chip">
                      <strong>{a.organizationName || a.email}</strong>
                      {a.phone && (
                        <a href={`tel:${a.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "var(--brand-500)", fontWeight: 600, fontSize: 13 }}>
                          <Phone size={13} /> {a.phone}
                        </a>
                      )}
                      {a.helloAssoUrl && (
                        <a href={a.helloAssoUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "var(--brand-400)", fontSize: 12 }}>
                          <Heart size={12} /> Faire un don (HelloAsso)
                        </a>
                      )}
                    </div>
                  ))}
                </div>
                <div className="modal-actions">
                  <button className="btn-secondary" onClick={handleDeclineContact}>Non merci</button>
                  <button className="btn-primary" onClick={onClose}>Fermer</button>
                </div>
              </>
            )}

            {contactDeclined && (
              <>
                <div className="alert alert-green">
                  <CheckCircle2 size={16} />
                  Un email de remerciement avec les liens HelloAsso vous a été envoyé. Merci pour votre engagement !
                </div>
                <div className="modal-actions" style={{ marginTop: 16 }}>
                  <button className="btn-primary" onClick={onClose}>Fermer</button>
                </div>
              </>
            )}

            {associations.length === 0 && (
              <div className="modal-actions">
                <button className="btn-primary" onClick={onClose}>Fermer</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
