import { useEffect, useState, useRef } from "react";
import { MapContainer, Marker, Popup, TileLayer, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import {
  AlertTriangle, CheckCircle2, Plus, X, Filter, Phone, Heart,
  User, Users, MapPin, Clock, ChevronRight, CheckSquare, BarChart3
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

const NEEDS = Object.keys(NEEDS_LABELS);

// Custom Leaflet marker icons based on urgency and type
function createMarkerIcon(urgency, type) {
  const colors = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  const bg = colors[urgency] || "#6b7280";
  const emoji = type === "group" ? "👥" : "🙋";
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
    "><span style="transform:rotate(45deg);font-size:13px;">${emoji}</span></div>`,
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
            <option value="red">🔴 Rouge (critique)</option>
            <option value="yellow">🟡 Jaune (important)</option>
            <option value="green">🟢 Vert (stable)</option>
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
                        {report.urgency === "red" ? "🔴" : report.urgency === "yellow" ? "🟡" : "🟢"}
                        {report.urgency}
                      </span>
                      <span className={`status-badge ${report.status}`}>{report.status}</span>
                    </div>
                    <strong style={{ display: "block", marginBottom: 4, fontSize: 13 }}>
                      {report.type === "individual" ? "👤 Individuel" : `👥 Groupe${report.group?.peopleCount ? ` · ${report.group.peopleCount} pers.` : ""}`}
                    </strong>
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
                {report.type === "individual" ? "👤 Individuel" : `👥 Groupe · ${report.group?.peopleCount || "?"} pers.`}
              </strong>
              <span className={`urgency-badge ${report.urgency}`}>
                {report.urgency === "red" ? "🔴" : report.urgency === "yellow" ? "🟡" : "🟢"} {report.urgency}
              </span>
            </div>
            {report.needs?.length > 0 && (
              <div className="needs-grid">
                {report.needs.map((n) => <span key={n} className="need-chip">{NEEDS_LABELS[n]}</span>)}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between" }}>
              <span className={`status-badge ${report.status}`}>{report.status}</span>
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
                {report.type === "individual" ? "👤 Individuel" : `👥 Groupe · ${report.group?.peopleCount || "?"} pers.`}
              </strong>
              <span className={`urgency-badge ${report.urgency}`}>
                {report.urgency === "red" ? "🔴" : report.urgency === "yellow" ? "🟡" : "🟢"}
              </span>
            </div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span className={`status-badge ${report.status}`}>{report.status}</span>
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
  const [saving, setSaving] = useState(false);

  function toggleNeed(need) {
    setFulfilledNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  }

  async function save() {
    setSaving(true);
    await api.patch(`/reports/${report._id}`, { status, fulfilledNeeds, associationNotes: notes });
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
            {report.type === "individual" ? "👤 Individuel" : `👥 Groupe · ${grp?.peopleCount || "?"} pers.`}
          </strong>
          <div className="report-detail-meta">
            <span className={`urgency-badge ${report.urgency}`}>
              {report.urgency === "red" ? "🔴 Rouge" : report.urgency === "yellow" ? "🟡 Jaune" : "🟢 Vert"}
            </span>
            <span className={`status-badge ${report.status}`}>{report.status}</span>
          </div>
        </div>
        <button className="btn-secondary" style={{ padding: "6px 8px" }} onClick={onClose}><X size={15} /></button>
      </div>

      {/* Info */}
      {ind && (
        <div style={{ fontSize: 13, display: "flex", flexDirection: "column", gap: 4 }}>
          {ind.apparentGender && <span>Sexe apparent : <strong>{ind.apparentGender === "male" ? "Homme" : ind.apparentGender === "female" ? "Femme" : "Indéterminé"}</strong></span>}
          {ind.ageRange && <span>Tranche d'âge : <strong>{ind.ageRange}</strong></span>}
          {ind.languageBarrier && <span>⚠️ Barrière de la langue</span>}
          {ind.spokenToPerson && <span>✅ Contact direct établi</span>}
          {ind.requestedHelp && <span>🙏 Aide explicitement demandée</span>}
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

      {/* Status */}
      <label>
        Statut du signalement
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="new">Nouveau</option>
          <option value="in_progress">En cours</option>
          <option value="resolved">Résolu</option>
          <option value="removed">Retiré</option>
        </select>
      </label>

      {/* Notes */}
      <label>
        Remarques libres
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes d'intervention..." />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn-primary" disabled={saving} onClick={save} style={{ flex: 1 }}>
          <CheckSquare size={15} /> {saving ? "Enregistrement..." : "Sauvegarder"}
        </button>
      </div>

      <small className="text-muted">
        <Clock size={11} style={{ display: "inline", marginRight: 3 }} />
        {new Date(report.createdAt).toLocaleString("fr-FR")}
        {report.addressHint && ` · ${report.addressHint}`}
      </small>
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
                { id: "individual", emoji: "👤", label: "Individuel", desc: "Une seule personne en difficulté" },
                { id: "group", emoji: "👥", label: "Groupe", desc: "Plusieurs personnes au même endroit" }
              ].map(({ id, emoji, label, desc }) => (
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
                  <div style={{ fontSize: 36, marginBottom: 8 }}>{emoji}</div>
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
                {type === "individual" ? "👤 Signalement individuel" : "👥 Signalement de groupe"}
              </h2>
              <button className="btn-secondary" style={{ padding: "5px 8px" }} onClick={() => setStep("type")}><X size={14} /></button>
            </div>
            <form ref={formRef} onSubmit={handleSubmit} className="form-grid" style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 4 }}>

              {/* Location */}
              <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: 12, border: "1.5px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  📍 Localisation
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
                    { id: "green", label: "🟢 Stable", desc: "Besoins non critiques" },
                    { id: "yellow", label: "🟡 Important", desc: "Intervention souhaitée" },
                    { id: "red", label: "🔴 Critique", desc: "Appeler le 15 ou le 18" }
                  ].map(({ id, label, desc }) => (
                    <div key={id} className={`urgency-option ${id} ${urgency === id ? "selected" : ""}`} onClick={() => setUrgency(id)}>
                      <div style={{ fontWeight: 800, marginBottom: 2 }}>{label}</div>
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
              <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
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
