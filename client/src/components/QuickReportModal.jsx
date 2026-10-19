import { useState, useRef } from "react";
import {
  Zap, MapPin, Camera, AlertTriangle, CheckCircle2,
  X, Phone, Heart, Clock, Loader2, Navigation, UploadCloud, Info
} from "lucide-react";
import { api } from "../api/http";

const NEEDS_LABELS = {
  food: "Alimentation",
  shelter: "Hébergement",
  health: "Soins médicaux",
  clothes: "Vêtements",
  hygiene: "Hygiène",
  psychological: "Soutien psy",
  other: "Autre besoin"
};

export function QuickReportModal({ onClose }) {
  const [step, setStep] = useState("form"); // 'form' | 'result'
  const [coords, setCoords] = useState([2.3522, 48.8566]); // [lng, lat] (Paris default)
  const [geoStatus, setGeoStatus] = useState("idle"); // 'idle' | 'locating' | 'success' | 'error'
  const [geoError, setGeoError] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [comment, setComment] = useState("");
  const [urgency, setUrgency] = useState("yellow");
  const [selectedNeeds, setSelectedNeeds] = useState(["food"]);
  const [imagePreview, setImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  // Trigger browser geolocation
  function handleLocateMe() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setGeoError("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }

    setGeoStatus("locating");
    setGeoError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        setCoords([lng, lat]);
        setGeoStatus("success");
      },
      (err) => {
        setGeoStatus("error");
        if (err.code === 1) {
          setGeoError("Autorisation refusée. Vous pouvez préciser l'adresse manuellement ci-dessous.");
        } else {
          setGeoError("Impossible de récupérer la position GPS. Vous pouvez préciser l'adresse manuellement.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // Handle image selection / camera photo
  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 8 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function toggleNeed(needKey) {
    setSelectedNeeds((prev) =>
      prev.includes(needKey) ? prev.filter((k) => k !== needKey) : [...prev, needKey]
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");
    setSubmitting(true);

    try {
      const payload = {
        coordinates: coords,
        addressHint: addressHint.trim() || undefined,
        comment: comment.trim() || undefined,
        imageUrl: imagePreview || undefined,
        urgency,
        needs: selectedNeeds
      };

      const { data } = await api.post("/reports/quick", payload);
      setResult(data);
      setStep("result");
    } catch (err) {
      console.error("Quick report error:", err);
      setErrorMsg(err.response?.data?.message || "Une erreur est survenue lors de l'envoi du signalement.");
    } finally {
      setSubmitting(false);
    }
  }

  const assignedAssociations = result?.report?.assignedAssociations || [];

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box quick-report-modal" style={{ maxWidth: 680, maxHeight: "92vh", overflowY: "auto" }}>
        
        {step === "form" && (
          <>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--mint-green)", color: "var(--deep-green)", padding: "4px 10px", borderRadius: "var(--radius-full)", fontSize: 11, fontWeight: 700, marginBottom: 6 }}>
                  <Zap size={13} style={{ fill: "var(--sos-green)" }} /> Signalement 100% Anonyme & Gratuit
                </div>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                  Signalement Rapide
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2, margin: 0 }}>
                  Alertez immédiatement les associations humanitaires de votre secteur sans créer de compte.
                </p>
              </div>
              <button className="btn-secondary" style={{ padding: "6px 8px" }} onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            {errorMsg && (
              <div className="alert alert-red" style={{ marginBottom: 14 }}>
                <AlertTriangle size={16} /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="quick-report-form" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* 1. Geolocation */}
              <div style={{ background: "var(--surface-subtle)", borderRadius: "var(--radius-lg)", padding: 14, border: "1.5px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                    <MapPin size={13} style={{ color: "var(--sos-green)" }} /> Localisation de la situation
                  </span>
                  {geoStatus === "success" && (
                    <span style={{ fontSize: 11, color: "var(--success)", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> Position GPS détectée
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={geoStatus === "locating"}
                  className={geoStatus === "success" ? "btn-secondary" : "btn-primary"}
                  style={{ width: "100%", justifyContent: "center", marginBottom: 10, padding: "10px 14px", fontSize: 13 }}
                >
                  {geoStatus === "locating" ? (
                    <>
                      <Loader2 size={15} className="spinner" style={{ animation: "spin 1s linear infinite" }} />
                      Recherche de votre position GPS...
                    </>
                  ) : geoStatus === "success" ? (
                    <>
                      <Navigation size={14} /> Position GPS actualisée ({coords[1].toFixed(4)}, {coords[0].toFixed(4)})
                    </>
                  ) : (
                    <>
                      <Navigation size={14} /> Activer ma localisation GPS
                    </>
                  )}
                </button>

                {geoError && (
                  <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 8, display: "flex", gap: 5 }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> {geoError}
                  </div>
                )}

                <label style={{ margin: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>Repère ou adresse exacte (facultatif mais recommandé) :</span>
                  <input
                    type="text"
                    value={addressHint}
                    onChange={(e) => setAddressHint(e.target.value)}
                    placeholder="Ex: Devant le métro République, sous le porche du n°12..."
                    style={{ marginTop: 4 }}
                  />
                </label>
              </div>

              {/* 2. Commentaire / Description */}
              <label style={{ margin: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  Description de la situation
                </span>
                <textarea
                  className="quick-report-textarea"
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Décrivez ce que vous observez : homme seul, famille, besoin visible d'une couverture, état général..."
                  required
                />
              </label>

              {/* 3. Photo / Image */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Camera size={15} style={{ color: "var(--sos-green)" }} /> Ajouter une photo (optionnel)
                </span>

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: "2px dashed var(--border)",
                      borderRadius: "var(--radius-md)",
                      padding: "16px 12px",
                      textAlign: "center",
                      cursor: "pointer",
                      background: "var(--surface-card)",
                      transition: "all var(--transition)"
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-green)"; e.currentTarget.style.background = "var(--mint-green)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface-card)"; }}
                  >
                    <UploadCloud size={24} style={{ color: "var(--sos-green)", margin: "0 auto 6px" }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                      Prendre une photo ou sélectionner un fichier
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                      JPG, PNG, WebP (max 8 Mo)
                    </div>
                  </div>
                ) : (
                  <div style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1.5px solid var(--border)", background: "#000", maxHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img
                      src={imagePreview}
                      alt="Prévisualisation du signalement"
                      style={{ maxHeight: 180, width: "auto", objectFit: "contain" }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(0,0,0,0.7)",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer"
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </div>

              {/* 4. Besoins */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Besoins observés
                </span>
                <div className="quick-report-needs" style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(NEEDS_LABELS).map(([key, label]) => {
                    const isSelected = selectedNeeds.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleNeed(key)}
                        className={`quick-report-need ${isSelected ? "selected" : ""}`}
                        style={{
                          padding: "6px 11px",
                          borderRadius: "var(--radius-full)",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          border: isSelected ? "1.5px solid var(--sos-green)" : "1.5px solid var(--border)",
                          background: isSelected ? "var(--mint-green)" : "var(--surface-card)",
                          color: isSelected ? "var(--deep-green)" : "var(--text-secondary)",
                          transition: "all var(--transition)"
                        }}
                      >
                        {isSelected && "✓ "} {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Urgence */}
              <div>
                <span style={{ fontSize: 13, fontWeight: 700, display: "block", marginBottom: 6 }}>
                  Niveau d'urgence
                </span>
                <div className="urgency-selector">
                  {[
                    { id: "green", label: "Stable", desc: "Pas de danger immédiat" },
                    { id: "yellow", label: "Important", desc: "Intervention rapide requise" },
                    { id: "red", label: "Critique", desc: "Urgence médicale / détresse" }
                  ].map(({ id, label, desc }) => (
                    <button
                      key={id}
                      type="button"
                      className={`urgency-option ${id} ${urgency === id ? "selected" : ""}`}
                      onClick={() => setUrgency(id)}
                    >
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{label}</div>
                      <div style={{ fontSize: 10 }}>{desc}</div>
                    </button>
                  ))}
                </div>
                {urgency === "red" && (
                  <div className="alert alert-red" style={{ marginTop: 10 }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12 }}>
                      <strong>Attention :</strong> Pour toute urgence médicale ou détresse vitale, appelez en priorité le <strong>15 (SAMU)</strong> ou le <strong>18 (Pompiers)</strong>.
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="modal-actions" style={{ marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ minWidth: 170, justifyContent: "center" }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                      Transmission...
                    </>
                  ) : (
                    <>
                      <Zap size={15} /> Envoyer le signalement
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* STEP RESULT */}
        {step === "result" && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--success-light)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
              <CheckCircle2 size={34} />
            </div>

            <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>
              Signalement transmis avec succès !
            </h2>

            <p style={{ color: "var(--text-secondary)", fontSize: 14, maxWidth: 440, margin: "0 auto 20px", lineHeight: 1.5 }}>
              {assignedAssociations.length > 0 ? (
                <>
                  <strong>{assignedAssociations.length} association(s)</strong> de votre secteur ont reçu l'alerte par email et peuvent intervenir.
                </>
              ) : (
                "Votre signalement a été enregistré. Les équipes SOS Link et les associations partenaires régionales sont informées."
              )}
            </p>

            {assignedAssociations.length > 0 && (
              <div style={{ textAlign: "left", background: "var(--surface-subtle)", borderRadius: "var(--radius-lg)", padding: 14, border: "1px solid var(--border)", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 10 }}>
                  Associations alertées dans votre secteur :
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {assignedAssociations.map((assoc) => (
                    <div key={assoc._id} className="assoc-chip" style={{ background: "var(--surface-card)" }}>
                      <strong style={{ fontSize: 14 }}>{assoc.organizationName || "Association partenaire"}</strong>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 6 }}>
                        {assoc.phone && (
                          <a
                            href={`tel:${assoc.phone}`}
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--deep-green)", fontWeight: 700, fontSize: 13, background: "var(--mint-green)", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}
                          >
                            <Phone size={12} /> {assoc.phone}
                          </a>
                        )}
                        {assoc.helloAssoUrl && (
                          <a
                            href={assoc.helloAssoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#d946ef", fontWeight: 600, fontSize: 12, background: "#fdf4ff", padding: "4px 8px", borderRadius: "var(--radius-sm)" }}
                          >
                            <Heart size={12} /> Faire un don libre (HelloAsso)
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Reminder */}
            <div className="alert alert-yellow" style={{ textAlign: "left", marginBottom: 20 }}>
              <Info size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <strong>Numéros utiles d'urgence :</strong><br />
                • <strong>15</strong> : SAMU (urgence médicale)<br />
                • <strong>18</strong> : Pompiers (secours et incendie)<br />
                • <strong>115</strong> : SAMU Social (hébergement d'urgence)
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button className="btn-primary" onClick={onClose} style={{ minWidth: 140 }}>
                Fermer
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
