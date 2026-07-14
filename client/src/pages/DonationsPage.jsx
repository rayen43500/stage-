import { useEffect, useState } from "react";
import {
  HandCoins, PackageCheck, Mail, Calendar, Euro,
  ChevronDown, ChevronUp, Lock, Info, TrendingUp
} from "lucide-react";
import { api } from "../api/http";

const CURRENT_YEAR = new Date().getFullYear();

export function DonationsPage({ user }) {
  const [donations, setDonations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [{ data: list }, { data: annual }] = await Promise.all([
      api.get("/donations"),
      api.get(`/donations/annual-summary/${CURRENT_YEAR}`)
    ]);
    setDonations(list);
    setSummary(annual);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", color: "var(--text-muted)" }}>
        <div style={{ fontSize: 13 }}>Chargement des dons...</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1>Invendus alimentaires</h1>
          <p>Déclaration, affectation et suivi des dons restaurateurs.</p>
        </div>
        {summary?.totalEstimatedValueEur != null && (
          <div className="metric">
            <TrendingUp size={14} style={{ display: "inline", marginRight: 6 }} />
            {summary.totalEstimatedValueEur} EUR valorisés en {CURRENT_YEAR}
          </div>
        )}
      </div>

      {/* Annual summary card (restaurant) */}
      {user.role === "restaurant" && <RestaurantAnnualRecap summary={summary} year={CURRENT_YEAR} />}

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 380px", gap: 24 }}>
        {/* Donations list */}
        <div>
          <div className="list-grid">
            {donations.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-muted)", background: "var(--surface-card)", border: "1.5px solid var(--border)", borderRadius: "var(--radius-lg)" }}>
                <HandCoins size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>
                  {user.role === "restaurant" ? "Aucun don déclaré pour l'instant." : "Aucun don à afficher."}
                </p>
              </div>
            ) : (
              donations.map((donation) => (
                <DonationCard key={donation._id} donation={donation} user={user} onChanged={load} />
              ))
            )}
          </div>
        </div>

        {/* Side panel */}
        <div className="side-panel">
          {user.role === "restaurant" ? (
            <DonationForm onCreated={load} />
          ) : (
            <AssociationDonationInfo donations={donations} onChanged={load} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Restaurant annual recap card ────────────────────────────────────────────
function RestaurantAnnualRecap({ summary, year }) {
  if (!summary) return null;
  const isDecember = new Date().getMonth() === 11;

  return (
    <div className="annual-recap">
      <h3>Bilan annuel {year}</h3>
      {summary.totalEstimatedValueEur != null ? (
        <>
          <div className="recap-value">{summary.totalEstimatedValueEur} EUR</div>
          <div className="recap-sub">{summary.count} don{summary.count > 1 ? "s" : ""} valorisé{summary.count > 1 ? "s" : ""} · Reçu fiscal disponible en fin d'année</div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <Lock size={22} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{summary.count} don{summary.count > 1 ? "s" : ""} déclaré{summary.count > 1 ? "s" : ""}</div>
              <div className="recap-sub">Valorisation disponible en décembre</div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--brand-200)", marginTop: 8, lineHeight: 1.5 }}>
            La valorisation financière de vos dons est calculée automatiquement par notre IA. Le récapitulatif détaillé et votre reçu fiscal vous seront transmis en fin d'année.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Donation card ────────────────────────────────────────────────────────────
function DonationCard({ donation, user, onChanged }) {
  const [expanded, setExpanded] = useState(false);

  async function markCollected() {
    await api.patch(`/donations/${donation._id}/status`, { status: "collected" });
    onChanged();
  }

  const statusColors = {
    declared: "var(--slate-100)",
    assigned: "var(--yellow-100)",
    collected: "var(--green-100)",
    cancelled: "var(--red-100)"
  };

  const statusText = { declared: "Déclaré", assigned: "Assigné", collected: "Collecté", cancelled: "Annulé" };

  return (
    <div className="data-card" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Photo preview */}
        {donation.photoUrl ? (
          <img
            src={donation.photoUrl}
            alt="Photo du don"
            style={{ width: 60, height: 60, borderRadius: "var(--radius-md)", objectFit: "cover", flexShrink: 0 }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div style={{ width: 60, height: 60, borderRadius: "var(--radius-md)", background: "var(--surface-subtle)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 24 }}>
            🥘
          </div>
        )}
        <div className="data-card-body">
          <strong>{donation.description}</strong>
          <span style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ padding: "2px 8px", borderRadius: "var(--radius-full)", background: statusColors[donation.status], fontSize: 11, fontWeight: 700 }}>
              {statusText[donation.status]}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{donation.quantity}</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
              <Calendar size={11} style={{ display: "inline", marginRight: 3 }} />
              {new Date(donation.availableDate).toLocaleDateString("fr-FR")}
            </span>
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end", flexShrink: 0 }}>
          {/* Show valuation only to admin or restaurant in December */}
          {donation.valuation?.estimatedValueEur != null && (
            <span style={{ fontWeight: 800, color: "var(--brand-500)", fontSize: 14 }}>
              <Euro size={12} style={{ display: "inline" }} />{donation.valuation.estimatedValueEur}
            </span>
          )}
          <button
            style={{ background: "none", color: "var(--text-muted)", fontSize: 11, display: "flex", alignItems: "center", gap: 3 }}
            onClick={() => setExpanded((v) => !v)}
          >
            Détails {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
          {/* Restaurateur info (for associations) */}
          {(user.role === "association" || user.role === "admin") && donation.restaurant && (
            <div className="assoc-chip">
              <strong>🏪 {donation.restaurant.organizationName || donation.restaurant.email}</strong>
              <a href={`mailto:${donation.restaurant.email}`} style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, color: "var(--brand-500)", fontSize: 12 }}>
                <Mail size={12} /> {donation.restaurant.email}
              </a>
              {donation.restaurant.address && (
                <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2, display: "block" }}>{donation.restaurant.address}</span>
              )}
            </div>
          )}

          {/* Pickup slots */}
          {donation.pickupSlots?.length > 0 && (
            <div>
              <span style={{ fontWeight: 700, color: "var(--text-muted)", fontSize: 11, textTransform: "uppercase" }}>Créneaux de retrait</span>
              {donation.pickupSlots.map((s, i) => (
                <div key={i} style={{ fontSize: 13, marginTop: 4 }}>{s.start} → {s.end}</div>
              ))}
            </div>
          )}

          {/* IA Valuation detail (admin and restaurant in December) */}
          {donation.valuation && (
            <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-md)", padding: 10, fontSize: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                <Info size={13} /> Valorisation IA
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
                <span style={{ color: "var(--text-muted)" }}>Catégorie</span>
                <span>{donation.valuation.category}</span>
                <span style={{ color: "var(--text-muted)" }}>Quantité est.</span>
                <span>{donation.valuation.estimatedQuantityKg} kg</span>
                <span style={{ color: "var(--text-muted)" }}>Prix unitaire</span>
                <span>{donation.valuation.unitPriceEur} €/kg</span>
                <span style={{ color: "var(--text-muted)" }}>Valeur totale</span>
                <strong style={{ color: "var(--brand-500)" }}>{donation.valuation.estimatedValueEur} EUR</strong>
              </div>
            </div>
          )}

          {/* Action: mark collected (association) */}
          {(user.role === "association" || user.role === "admin") && donation.status !== "collected" && donation.status !== "cancelled" && (
            <button className="btn-success" onClick={markCollected}>
              <PackageCheck size={14} /> Marquer comme collecté
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Donation form (restaurant) ───────────────────────────────────────────────
function DonationForm({ onCreated }) {
  const [photoUrl, setPhotoUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    await api.post("/donations", {
      description: form.get("description"),
      quantity: form.get("quantity"),
      photoUrl: photoUrl || undefined,
      availableDate: form.get("availableDate"),
      pickupSlots: [{ start: form.get("start"), end: form.get("end") }]
    });
    event.currentTarget.reset();
    setPhotoUrl("");
    onCreated();
    setLoading(false);
  }

  return (
    <form className="panel-form" onSubmit={submit}>
      <h2><HandCoins size={18} /> Déclarer un don</h2>

      <label>
        Description du don
        <textarea name="description" required placeholder="Ex: 20 barquettes de plats préparés, 5 kg de pain..." />
      </label>
      <label>
        Quantité estimée
        <input name="quantity" required placeholder="Ex: 12 kg ou 20 portions" />
      </label>

      {/* Photo preview */}
      <label>
        Photo (URL)
        <input
          name="photoUrl"
          type="url"
          placeholder="https://..."
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
        />
      </label>
      {photoUrl && (
        <div className="photo-preview">
          <img src={photoUrl} alt="Aperçu" onError={(e) => e.target.parentElement.innerHTML = "URL invalide"} />
        </div>
      )}
      {!photoUrl && (
        <div className="photo-preview">
          <span>📷 Aucune photo sélectionnée</span>
        </div>
      )}

      <label>
        Date de disponibilité
        <input name="availableDate" type="date" required />
      </label>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <label>Début retrait<input name="start" type="time" required /></label>
        <label>Fin retrait<input name="end" type="time" required /></label>
      </div>

      <div className="alert alert-green" style={{ fontSize: 12 }}>
        <Info size={14} style={{ flexShrink: 0 }} />
        Votre don sera automatiquement affecté à l'association locale la plus proche couvrant votre secteur.
      </div>

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Envoi..." : "Déclarer le don"}
      </button>
    </form>
  );
}

// ─── Association info panel ───────────────────────────────────────────────────
function AssociationDonationInfo({ donations, onChanged }) {
  const pending = donations.filter((d) => d.status === "assigned" || d.status === "declared");
  const collected = donations.filter((d) => d.status === "collected");

  return (
    <div className="stack">
      <h2><PackageCheck size={18} /> Dons affectés</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="stat-card" style={{ padding: 14 }}>
          <div className="stat-label">À récupérer</div>
          <div className="stat-value" style={{ fontSize: 26 }}>{pending.length}</div>
        </div>
        <div className="stat-card" style={{ padding: 14 }}>
          <div className="stat-label">Collectés</div>
          <div className="stat-value" style={{ fontSize: 26, color: "var(--brand-500)" }}>{collected.length}</div>
        </div>
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>
        <Info size={12} style={{ display: "inline", marginRight: 4 }} />
        Contactez les restaurateurs par email uniquement (visible dans chaque don). Aucun numéro de téléphone n'est partagé.
      </div>
    </div>
  );
}
