import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import heroImage from "../assets/sos-link-hero.png";
import logoImage from "../assets/icon.png";

// Palette officielle Solid'Aid
const colors = {
  primary: "#0F7D63",       // Principal Confiance
  primaryDark: "#063D2E",   // Titres Contraste
  mintSoft: "#E8F6F1",      // Fond Doux
  mintSurface: "#CDEDDC",   // Surfaces Légères
  background: "#F4FAF8",    // Fond neutre de l'application
  cardBg: "#FFFFFF",        // Fond des cartes
  success: "#22C55E",       // Succès / Validation
  alert: "#F59E0B",         // Alerte / Urgence jaune
  info: "#3B82F6",          // Information / Liens
  danger: "#DC2626",        // Urgence critique rouge
  textPrimary: "#063D2E",   // Texte foncé
  textSecondary: "#4A6B60", // Texte secondaire
  textMuted: "#8AA099",     // Texte grisé
  border: "#D6E8E0",        // Bordure subtile
  borderLight: "#E8F2ED"
};

const createUser = async () => {
  if (!newUserDraft.email.trim() || newUserDraft.password.length < 8) {
    Alert.alert("Champs invalides", "Un e-mail et un mot de passe de 8 caractères minimum sont requis.");
    return;
  }
  try {
    await api.post("/admin/users", newUserDraft);
    setUserComposerVisible(false);
    setNewUserDraft({ email: "", password: "", role: "citizen", consentRgpd: true });
    Alert.alert("Succès", "Utilisateur créé.");
    load();
  } catch (e) {
    Alert.alert("Erreur", errorMessage(e));
  }
};

const editReport = (report) => {
  setReportDraft({
    ...report,
    adminNotes: report.adminNotes || "",
    fulfilledNeeds: report.fulfilledNeeds || []
  });
};

const saveReport = async () => {
  try {
    await api.patch(`/reports/${reportDraft._id}`, {
      adminNotes: reportDraft.adminNotes,
      fulfilledNeeds: reportDraft.fulfilledNeeds
    });
    setSelectedReport({ ...selectedReport, adminNotes: reportDraft.adminNotes, fulfilledNeeds: reportDraft.fulfilledNeeds });
    setReportDraft(null);
    Alert.alert("Succès", "Signalement mis à jour.");
    load();
  } catch (e) {
    Alert.alert("Erreur", errorMessage(e));
  }
};

const API_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://stage-cqe9.onrender.com/api";
const api = axios.create({ baseURL: API_URL, timeout: 30000 });

// Session token: stored encrypted (Android Keystore / iOS Keychain) on mobile.
// The web build has no secure storage, so it falls back to AsyncStorage.
const TOKEN_KEY = "sos-link-token";
const tokenStore = {
  async get() {
    if (Platform.OS === "web") return AsyncStorage.getItem(TOKEN_KEY);
    const secure = await SecureStore.getItemAsync(TOKEN_KEY);
    if (secure) return secure;
    // One-time migration of a token saved in clear text by older app versions.
    const legacy = await AsyncStorage.getItem(TOKEN_KEY);
    if (legacy) {
      await SecureStore.setItemAsync(TOKEN_KEY, legacy);
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return legacy;
  },
  async set(token) {
    if (Platform.OS === "web") return AsyncStorage.setItem(TOKEN_KEY, token);
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  },
  async clear() {
    await AsyncStorage.removeItem(TOKEN_KEY);
    if (Platform.OS !== "web") await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

api.interceptors.request.use(async (config) => {
  const token = await tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const needs = ["food", "shelter", "health", "clothes", "hygiene", "psychological", "other"];
const labels = {
  food: "Alimentation",
  shelter: "Hébergement",
  health: "Soins médicaux",
  clothes: "Vêtements",
  hygiene: "Hygiène",
  psychological: "Soutien psychologique",
  other: "Autre"
};
const needIcons = {
  food: "restaurant",
  shelter: "home",
  health: "medkit",
  clothes: "shirt",
  hygiene: "water",
  psychological: "heart",
  other: "add-circle"
};
const statusLabels = {
  new: "Nouveau",
  in_progress: "En cours",
  resolved: "Résolu",
  removed: "Retiré",
  declared: "Déclaré",
  assigned: "Assigné",
  collected: "Collecté",
  cancelled: "Annulé"
};
const services = needs.slice(0, -1);
const initialCoords = [2.3522, 48.8566];

function errorMessage(error) {
  return error.response?.data?.message || "Une erreur est survenue. Vérifiez la connexion au serveur.";
}
function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";
}

/* ─────────────────────────────────────────────────────────────
   COMPOSANTS DE BASE & DESIGN SYSTEM
───────────────────────────────────────────────────────────── */

function BrandLogo({ size = "default" }) {
  const isLarge = size === "large";
  return (
    <View style={styles.brandContainer}>
      <View style={[styles.brandLogoBox, isLarge && { width: 56, height: 56, borderRadius: 16 }]}>
        <Image
          source={logoImage}
          style={[styles.brandLogoImage, isLarge && { width: 50, height: 50 }]}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={[styles.brandText, isLarge && { fontSize: 24 }]}>Solid'Aid</Text>
        <Text style={styles.brandTagline}>Solidarité · Orientation · Entraide</Text>
      </View>
    </View>
  );
}

function PrimaryButton({ title, onPress, variant = "primary", disabled = false, icon, style }) {
  const isSecondary = variant === "secondary";
  const isWhite = variant === "white";
  const isDanger = variant === "danger";

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.primaryButton,
        isSecondary && styles.buttonSecondary,
        isWhite && styles.buttonWhite,
        isDanger && styles.buttonDanger,
        disabled && { opacity: 0.6 },
        style
      ]}
    >
      <View style={styles.buttonContent}>
        {icon && (
          <Ionicons
            name={icon}
            size={18}
            color={isWhite ? colors.primary : isSecondary ? colors.primary : "#FFFFFF"}
          />
        )}
        <Text
          style={[
            styles.primaryButtonText,
            (isSecondary || isWhite) && styles.buttonTextSecondary,
            isDanger && { color: "#FFFFFF" }
          ]}
        >
          {title}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={16}
          color={isWhite ? colors.primary : isSecondary ? colors.primary : "#FFFFFF"}
        />
      </View>
    </Pressable>
  );
}

function useKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setKeyboardVisible(true);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      setKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}

function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  keyboardType = "default",
  icon,
  onFocus,
  onBlur,
  returnKeyType,
  onSubmitEditing,
  inputRef
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isSecure = secureTextEntry && !showPassword;

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          multiline && { minHeight: 96, alignItems: "flex-start", paddingTop: 12 },
          isFocused && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: "#FFFFFF" }
        ]}
      >
        {icon && (
          <Ionicons
            name={icon}
            size={20}
            color={isFocused ? colors.primary : colors.textMuted}
            style={styles.inputIcon}
          />
        )}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isSecure}
          multiline={multiline}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          style={[styles.inputField, multiline && { textAlignVertical: "top" }]}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon} hitSlop={8}>
            <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

function StatCard({ title, value, icon, subtitle, color = colors.primary }) {
  return (
    <View style={styles.kpiCard}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={[styles.kpiIconBox, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      </View>
      <View style={{ marginTop: 8 }}>
        <Text style={styles.kpiTitle} numberOfLines={2}>{title}</Text>
        {subtitle ? (
          <Text style={styles.kpiSubtitle} numberOfLines={1}>{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}

function ImageLightboxModal({ visible, image, close }) {
  if (!image) return null;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.lightboxOverlay}>
        <SafeAreaView style={styles.lightboxHeader}>
          <Pressable onPress={close} style={styles.lightboxCloseBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.lightboxTitle} numberOfLines={1}>
            {image.title || "Photo"}
          </Text>
          <View style={{ width: 40 }} />
        </SafeAreaView>
        <Pressable onPress={close} style={styles.lightboxBody}>
          <Image source={{ uri: image.url }} style={styles.lightboxImage} />
        </Pressable>
      </View>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   CARTE INTERACTIVE (LEAFLET / OPENSTREETMAP)
───────────────────────────────────────────────────────────── */

function ReportsMap({ reports = [], height = 340, isFull = false, onSelectReport }) {
  const isFullMap = height === "100%" || isFull;

  if (Platform.OS === "web") {
    const validReports = reports.filter(
      (r) => r.location?.coordinates && r.location.coordinates.length === 2
    );

    const markersData = validReports.map((r) => ({
      id: r._id,
      lng: r.location.coordinates[0],
      lat: r.location.coordinates[1],
      type: r.type,
      urgency: r.urgency || "yellow",
      status: r.status,
      address: r.addressHint || "Localisation GPS",
      imageUrl: typeof r.imageUrl === "string" && /^(https:\/\/|data:image\/(png|jpe?g|webp);base64,)/i.test(r.imageUrl) ? r.imageUrl : null,
      comment: (r.comment || "").replace(/\n/g, " "),
      needs: (r.needs || []).map((n) => labels[n] || n).join(", ")
    }));

    const leafletHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    #map { height: 100%; width: 100%; position: absolute; top: 0; bottom: 0; left: 0; right: 0; }
    .custom-pin {
      width: 36px; height: 36px; border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg); display: flex; align-items: center; justify-content: center;
      border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      cursor: pointer; transition: transform 0.15s ease;
    }
    .custom-pin:hover { transform: rotate(-45deg) scale(1.15); }
    .custom-pin span { transform: rotate(45deg); color: white; font-size: 16px; }
    .leaflet-popup-content-wrapper { border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.18); padding: 4px; }
    .leaflet-popup-content { margin: 12px 14px; font-size: 13px; line-height: 1.4; color: #1e293b; }
    .popup-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
    .popup-title { font-weight: 800; font-size: 14px; color: #063D2E; }
    .popup-badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 800; color: white; text-transform: uppercase; }
    .popup-meta { color: #64748b; font-size: 12px; margin: 4px 0; }
    .popup-needs { margin-top: 6px; padding: 4px 8px; background: #e8f6f1; border-radius: 8px; color: #0f7d63; font-weight: 700; font-size: 11px; }
    .popup-btn { display: inline-block; margin-top: 10px; background: #0f7d63; color: white; text-decoration: none; padding: 7px 12px; border-radius: 9px; font-size: 12px; font-weight: 700; text-align: center; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const reports = ${JSON.stringify(markersData).replace(/</g, "\\u003c")};
    const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
    const center = reports.length > 0 ? [reports[0].lat, reports[0].lng] : [48.8700, 2.3600];
    const map = L.map('map', { zoomControl: true }).setView(center, reports.length > 0 ? 14 : 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    const colors = { red: '#DC2626', yellow: '#F59E0B', green: '#0F7D63' };
    const bounds = [];

    reports.forEach(r => {
      const bg = colors[r.urgency] || colors.yellow;
      const icon = L.divIcon({
        className: '',
        html: '<div class="custom-pin" style="background:' + bg + ';"><span>' + (r.type === 'group' ? '👥' : '👤') + '</span></div>',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
      const marker = L.marker([r.lat, r.lng], { icon }).addTo(map);
      bounds.push([r.lat, r.lng]);
      const statusLabel = r.status === 'resolved' ? 'Résolu' : r.status === 'in_progress' ? 'En cours' : 'Nouveau';
      const gmapsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + Number(r.lat) + ',' + Number(r.lng);
      marker.bindPopup(
        '<div class="popup-header">' +
          '<span class="popup-title">' + (r.type === 'group' ? '👥 Groupe' : '👤 Personne seule') + '</span>' +
          '<span class="popup-badge" style="background:' + bg + ';">' + (r.urgency === 'red' ? 'Critique' : r.urgency === 'yellow' ? 'Important' : 'Stable') + '</span>' +
        '</div>' +
        (r.imageUrl ? '<div style="margin:8px 0;border-radius:10px;overflow:hidden;height:120px;"><img src="' + esc(r.imageUrl) + '" style="width:100%;height:100%;object-fit:cover;" /></div>' : '') +
        '<div class="popup-meta">📍 ' + esc(r.address) + '</div>' +
        '<div class="popup-meta">Statut : <b>' + statusLabel + '</b></div>' +
        (r.comment ? '<div style="margin:4px 0;color:#334155;font-style:italic;">« ' + esc(r.comment) + ' »</div>' : '') +
        (r.needs ? '<div class="popup-needs">Besoins : ' + esc(r.needs) + '</div>' : '') +
        '<a href="' + gmapsUrl + '" target="_blank" rel="noopener noreferrer" class="popup-btn">🧭 Ouvrir Itinéraire GPS</a>'
      );
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
    setTimeout(function() {
      map.invalidateSize();
    }, 250);
    window.addEventListener('resize', function() {
      map.invalidateSize();
    });
  </script>
</body>
</html>`;

    return (
      <View
        style={[
          styles.mapContainer,
          isFullMap
            ? { flex: 1, width: "100%", height: "100%", minHeight: "100%", borderRadius: 0, borderWidth: 0 }
            : { height, width: "100%" }
        ]}
      >
        <iframe
          srcDoc={leafletHtml}
          sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          style={{ width: "100%", height: "100%", minHeight: "100%", border: "none", display: "block" }}
          title="Carte interactive Solid'Aid"
        />
      </View>
    );
  }

  // Fallback mobile natif avec bouton d'ouverture Waze / Google Maps
  const firstCoords = reports.find((r) => r.location?.coordinates?.length === 2)?.location.coordinates;
  const mapsUrl = firstCoords
    ? Platform.select({
        android: `geo:${firstCoords[1]},${firstCoords[0]}?q=${firstCoords[1]},${firstCoords[0]}(Signalements+SolidAid)`,
        default: `https://www.google.com/maps/search/?api=1&query=${firstCoords[1]},${firstCoords[0]}`
      })
    : "https://www.google.com/maps";

  return (
    <View style={[styles.mapNativeCard, isFullMap ? { flex: 1, width: "100%", borderRadius: 0 } : { height }]}>
      <Ionicons name="map" size={44} color={colors.primary} />
      <Text style={styles.cardTitle}>Carte du secteur ({reports.length} signalements)</Text>
      <Text style={styles.bodyMuted}>Points géolocalisés en temps réel sur Paris & IDF</Text>
      <PrimaryButton
        title="Ouvrir dans Google Maps"
        icon="navigate-outline"
        variant="white"
        onPress={() => Linking.openURL(mapsUrl)}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   APPLICATION PRINCIPALE & SESSIONS
───────────────────────────────────────────────────────────── */

export default function App() {
  const { width } = useWindowDimensions();
  const isLargeScreen = width > 720;
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await tokenStore.get().catch(() => null);
      const rawUser = await AsyncStorage.getItem("sos-link-user");
      if (token && rawUser) {
        try {
          const { data } = await api.get("/auth/me");
          setSession({ token, user: data.user });
          await AsyncStorage.setItem("sos-link-user", JSON.stringify(data.user));
        } catch {
          await tokenStore.clear().catch(() => {});
          await AsyncStorage.removeItem("sos-link-user");
        }
      }
      setReady(true);
    })();
  }, []);

  const login = async (data) => {
    await tokenStore.set(data.token);
    await AsyncStorage.setItem("sos-link-user", JSON.stringify(data.user));
    setSession(data);
  };

  const updateUser = async (updatedUser) => {
    await AsyncStorage.setItem("sos-link-user", JSON.stringify(updatedUser));
    setSession((s) => ({ ...s, user: updatedUser }));
  };

  const logout = async () => {
    await tokenStore.clear().catch(() => {});
    await AsyncStorage.removeItem("sos-link-user");
    setSession(null);
  };

  if (!ready) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <BrandLogo size="large" />
        <Text style={styles.loadingText}>Chargement de Solid'Aid…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={[styles.mainShell, isLargeScreen && styles.mainShellLarge]}>
        {session ? (
          <PrivateApp session={session} logout={logout} updateUser={updateUser} />
        ) : (
          <PublicApp login={login} />
        )}
      </View>
    </SafeAreaView>
  );
}

/* ─────────────────────────────────────────────────────────────
   ESPACE PUBLIC (ACCUEIL & AUTH)
───────────────────────────────────────────────────────────── */

function PublicApp({ login }) {
  const [screen, setScreen] = useState("landing");
  const [quickReportOpen, setQuickReportOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  useEffect(() => {
    const handleBack = () => {
      if (privacyOpen) {
        setPrivacyOpen(false);
        return true;
      }
      if (quickReportOpen) {
        setQuickReportOpen(false);
        return true;
      }
      if (screen === "auth") {
        setScreen("landing");
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [screen, quickReportOpen, privacyOpen]);

  return (
    <View style={styles.flex}>
      {screen === "auth" ? (
        <AuthScreen login={login} back={() => setScreen("landing")} />
      ) : (
        <LandingScreen
          goAuth={() => setScreen("auth")}
          openQuickReport={() => setQuickReportOpen(true)}
          openPrivacy={() => setPrivacyOpen(true)}
        />
      )}
      <QuickReportModal visible={quickReportOpen} close={() => setQuickReportOpen(false)} />
      <PrivacyModal visible={privacyOpen} close={() => setPrivacyOpen(false)} />
    </View>
  );
}

function LandingScreen({ goAuth, openQuickReport, openPrivacy }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    api.get("/blog").then(({ data }) => setPosts(data)).catch(() => {});
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <BrandLogo />
        <Pressable style={styles.bellButton} onPress={openPrivacy}>
          <Ionicons name="notifications-outline" size={22} color={colors.primaryDark} />
        </Pressable>
      </View>

      {/* Hero Visual Card */}
      <View style={styles.heroCard}>
        <Image source={heroImage} style={styles.heroImageVisual} />
        <View style={styles.heroOverlay}>
          <Text style={styles.heroMainTitle}>Signaler, orienter et agir ensemble.</Text>
          <Text style={styles.heroMainSubtitle}>
            Une plateforme qui relie citoyens, associations et commerçants solidaires.
          </Text>
        </View>
      </View>

      {/* Main Action CTAs (Style Screen 1 du mockup) */}
      <View style={styles.ctaGroup}>
        <PrimaryButton
          title="Signalement rapide"
          icon="megaphone"
          onPress={openQuickReport}
        />
        <PrimaryButton
          title="Connexion / Inscription"
          icon="person"
          variant="white"
          onPress={goAuth}
        />
      </View>

      {/* 4 Feature Cards (Pastel Highlights) */}
      <View style={styles.featureGrid}>
        <View style={[styles.featureCard, { backgroundColor: "#E8F6F1" }]}>
          <View style={[styles.featureIconCircle, { backgroundColor: "#0F7D63" }]}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.featureCardTitle}>Associations</Text>
          <Text style={styles.featureCardText}>près de vous</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: "#EFF6FF" }]}>
          <View style={[styles.featureIconCircle, { backgroundColor: "#3B82F6" }]}>
            <Ionicons name="location" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.featureCardTitle}>Carte</Text>
          <Text style={styles.featureCardText}>de votre zone</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: "#FEF2F2" }]}>
          <View style={[styles.featureIconCircle, { backgroundColor: "#EF4444" }]}>
            <Ionicons name="heart" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.featureCardTitle}>Soutien</Text>
          <Text style={styles.featureCardText}>et orientation</Text>
        </View>

        <View style={[styles.featureCard, { backgroundColor: "#F5F3FF" }]}>
          <View style={[styles.featureIconCircle, { backgroundColor: "#8B5CF6" }]}>
            <Ionicons name="chatbubbles" size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.featureCardTitle}>Suivi</Text>
          <Text style={styles.featureCardText}>du signalement</Text>
        </View>
      </View>

      {/* Solidarité Banner */}
      <View style={styles.bannerCard}>
        <View style={styles.bannerIconBox}>
          <Ionicons name="school" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Solidarité & Entraide</Text>
          <Text style={styles.bannerText}>Coordination citoyenne active en Île-de-France.</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </View>

      {/* Actualités */}
      {posts.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Actualités solidaires</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, paddingHorizontal: 20 }}>
            {posts.map((p) => (
              <View key={p._id} style={styles.newsCard}>
                {p.imageUrl ? (
                  <Image source={{ uri: p.imageUrl }} style={styles.newsImage} />
                ) : (
                  <View style={[styles.newsImage, { backgroundColor: colors.mintSoft, justifyContent: "center", alignItems: "center" }]}>
                    <Ionicons name="newspaper-outline" size={28} color={colors.primary} />
                  </View>
                )}
                <View style={{ padding: 12 }}>
                  <Text style={styles.newsCardTitle} numberOfLines={2}>{p.title}</Text>
                  <Text style={styles.newsCardSummary} numberOfLines={2}>{p.summary}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* RGPD Footer */}
      <Pressable onPress={openPrivacy} style={styles.legalFooterLink}>
        <Ionicons name="shield-checkmark" size={15} color={colors.primary} />
        <Text style={styles.legalFooterText}>Politique de Confidentialité (Google Play & RGPD)</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODAL SIGNALEMENT RAPIDE (MATCH SCREEN 2 DU MOCKUP)
───────────────────────────────────────────────────────────── */

function QuickReportModal({ visible, close }) {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState("social");
  const [urgency, setUrgency] = useState("yellow");
  const [comment, setComment] = useState("");
  const [addressHint, setAddressHint] = useState("");
  const [imageData, setImageData] = useState("");
  const [coords, setCoords] = useState(initialCoords);
  const [busy, setBusy] = useState(false);
  const { keyboardHeight } = useKeyboard();
  const qrScrollRef = useRef(null);

  useEffect(() => {
    if (!visible) return;
    const handleBack = () => {
      if (step > 1) {
        setStep((s) => s - 1);
        return true;
      }
      close();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [visible, step, close]);

  const categories = [
    { id: "social", label: "Problème social", icon: "warning", color: "#F59E0B" },
    { id: "food", label: "Faim / Alimentation", icon: "restaurant", color: "#10B981" },
    { id: "shelter", label: "Hébergement", icon: "home", color: "#3B82F6" },
    { id: "health", label: "Urgence médicale", icon: "medkit", color: "#EF4444" },
    { id: "individual", label: "Personne seule", icon: "person", color: "#8B5CF6" },
    { id: "other", label: "Autre", icon: "ellipsis-horizontal", color: "#64748B" }
  ];

  const locate = async () => {
    try {
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status !== "granted") {
        return Alert.alert("Localisation", "Veuillez saisir l'adresse manuellement.");
      }
      const loc = await Location.getCurrentPositionAsync({});
      setCoords([loc.coords.longitude, loc.coords.latitude]);
      setAddressHint("Position GPS détectée");
      Alert.alert("Succès", "Votre position actuelle a été enregistrée.");
    } catch {
      Alert.alert("GPS", "Position temporaire définie.");
    }
  };

  const takePhoto = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return Alert.alert("Caméra", "Autorisez la caméra pour prendre une photo.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!res.canceled && res.assets?.[0]?.base64) {
      setImageData(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true
    });
    if (!res.canceled && res.assets?.[0]?.base64) {
      setImageData(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const handleSelectCategory = (id) => {
    setCategory(id);
    if (id === "health") {
      setUrgency("red");
      Alert.alert(
        "Urgence médicale",
        "En cas de détresse médicale ou d'urgence vitale, composez immédiatement le 15 (SAMU) ou le 18 (Pompiers).",
        [
          { text: "Appeler le 15 (SAMU)", onPress: () => Linking.openURL("tel:15") },
          { text: "Appeler le 18 (Pompiers)", onPress: () => Linking.openURL("tel:18") },
          { text: "Continuer le signalement", style: "cancel" }
        ]
      );
    }
  };

  const submit = async () => {
    setBusy(true);
    try {
      await api.post("/reports/quick", {
        coordinates: coords,
        addressHint: addressHint.trim() || undefined,
        comment: comment.trim() || undefined,
        imageUrl: imageData || undefined,
        urgency,
        needs: [category === "social" ? "shelter" : category]
      });
      Alert.alert("Signalement transmis", "Les associations locales de votre zone ont été alertées.");
      close();
      setStep(1);
      setComment("");
      setImageData("");
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Modal Header */}
          <View style={styles.modalTopNav}>
            <Pressable onPress={close} style={styles.modalCloseBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalHeaderTitle}>Signalement rapide</Text>
              <Text style={styles.modalHeaderSubtitle}>Décrivez la situation pour alerter les équipes locales.</Text>
            </View>
          </View>

          {/* Stepper (1 - 2 - 3) */}
          <View style={styles.stepperRow}>
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <View style={[styles.stepCircle, step >= num && styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, step >= num && styles.stepNumberActive]}>{num}</Text>
                </View>
                {num < 3 && <View style={[styles.stepLine, step > num && styles.stepLineActive]} />}
              </React.Fragment>
            ))}
          </View>

          <ScrollView
            ref={qrScrollRef}
            contentContainerStyle={[
              styles.modalScrollBody,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 60 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {step === 1 && (
            <View style={{ gap: 16 }}>
              <Text style={styles.formSectionLabel}>Type de signalement</Text>
              <View style={styles.categoryGrid}>
                {categories.map((c) => {
                  const isSelected = category === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => handleSelectCategory(c.id)}
                      style={[
                        styles.categoryTile,
                        isSelected && { borderColor: c.color, backgroundColor: `${c.color}15`, borderWidth: 2 }
                      ]}
                    >
                      <View style={[styles.categoryIconCircle, { backgroundColor: `${c.color}25` }]}>
                        <Ionicons name={c.icon} size={22} color={c.color} />
                      </View>
                      <Text style={styles.categoryTileText}>{c.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.formSectionLabel}>Niveau d'urgence</Text>
              <View style={styles.urgencyRow}>
                {[
                  { id: "green", label: "Stable", desc: "Pas de danger direct", color: colors.success },
                  { id: "yellow", label: "Important", desc: "Besoin d'aide rapide", color: colors.alert },
                  { id: "red", label: "Critique", desc: "Urgence médicale / 15", color: colors.danger }
                ].map((u) => (
                  <Pressable
                    key={u.id}
                    onPress={() => setUrgency(u.id)}
                    style={[
                      styles.urgencyOption,
                      urgency === u.id && { borderColor: u.color, backgroundColor: `${u.color}12`, borderWidth: 2 }
                    ]}
                  >
                    <Text style={[styles.urgencyOptionTitle, { color: u.color }]}>{u.label}</Text>
                    <Text style={styles.urgencyOptionDesc}>{u.desc}</Text>
                  </Pressable>
                ))}
              </View>

              {(category === "health" || urgency === "red") && (
                <View style={styles.emergencyCallBanner}>
                  <View style={styles.emergencyCallHeader}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.emergencyCallTitle}>Urgence médicale vitale ?</Text>
                  </View>
                  <Text style={styles.emergencyCallText}>
                    En cas de malaise grave ou danger immédiat, contactez directement les secours d'urgence :
                  </Text>
                  <View style={styles.emergencyButtonsRow}>
                    <Pressable onPress={() => Linking.openURL("tel:15")} style={[styles.emergencyBtn, { backgroundColor: "#DC2626" }]}>
                      <Ionicons name="call" size={16} color="#FFFFFF" />
                      <Text style={styles.emergencyBtnText}>Appeler le 15 (SAMU)</Text>
                    </Pressable>
                    <Pressable onPress={() => Linking.openURL("tel:18")} style={[styles.emergencyBtn, { backgroundColor: "#B91C1C" }]}>
                      <Ionicons name="flame" size={16} color="#FFFFFF" />
                      <Text style={styles.emergencyBtnText}>Appeler le 18 (Pompiers)</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <PrimaryButton title="Suivant" onPress={() => setStep(2)} />
            </View>
          )}

          {step === 2 && (
            <View style={{ gap: 16 }}>
              <InputField
                label="Description (facultative)"
                value={comment}
                onChangeText={setComment}
                placeholder="Précisez la situation si besoin : personne seule, vêtements, couverture..."
                multiline
              />

              <View>
                <Text style={styles.inputLabel}>Localisation</Text>
                <Pressable onPress={locate} style={styles.gpsSelectButton}>
                  <View style={styles.gpsIconCircle}>
                    <Ionicons name="location" size={20} color="#FFFFFF" />
                  </View>
                  <Text style={styles.gpsSelectText}>
                    {addressHint || "Utiliser ma position actuelle"}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.primary} />
                </Pressable>
              </View>

              <InputField
                label="Repère ou adresse manuelle (facultatif)"
                value={addressHint}
                onChangeText={setAddressHint}
                placeholder="Ex. Métro Bonsergent, face au cinéma..."
                icon="navigate-outline"
              />

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setStep(1)} style={styles.backStepButton}>
                  <Text style={styles.backStepButtonText}>Retour</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <PrimaryButton title="Suivant" onPress={() => setStep(3)} />
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={{ gap: 16 }}>
              <Text style={styles.formSectionLabel}>Ajouter des médias (optionnel)</Text>
              <View style={styles.mediaButtonsRow}>
                <Pressable onPress={takePhoto} style={styles.mediaBtn}>
                  <Ionicons name="camera-outline" size={24} color={colors.primary} />
                  <Text style={styles.mediaBtnText}>Photo</Text>
                </Pressable>
                <Pressable onPress={pickImage} style={styles.mediaBtn}>
                  <Ionicons name="images-outline" size={24} color={colors.primary} />
                  <Text style={styles.mediaBtnText}>Galerie</Text>
                </Pressable>
              </View>

              {imageData ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: imageData }} style={styles.imagePreview} />
                  <Pressable onPress={() => setImageData("")} style={styles.removeImageBadge}>
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : null}

              <View style={styles.summaryNotice}>
                <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                <Text style={styles.summaryNoticeText}>
                  Votre signalement est transmis directement et confidentiellement aux associations locales habilitées.
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable onPress={() => setStep(2)} style={styles.backStepButton}>
                  <Text style={styles.backStepButtonText}>Retour</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <PrimaryButton
                    title={busy ? "Envoi en cours…" : "Envoyer le signalement"}
                    disabled={busy}
                    onPress={submit}
                  />
                </View>
              </View>
            </View>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN DE CONNEXION & INSCRIPTION (MATCH SCREEN 3 DU MOCKUP)
───────────────────────────────────────────────────────────── */

function AuthScreen({ login, back }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("citizen");
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState(initialCoords);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    organizationName: "",
    sirenSiret: "",
    address: "",
    phone: "",
    radiusKm: "5"
  });
  const [selectedServices, setSelectedServices] = useState(["food", "shelter"]);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const { keyboardHeight, isKeyboardVisible } = useKeyboard();
  const scrollRef = useRef(null);
  const fieldY = useRef({});

  const registerLayout = (key) => (e) => {
    fieldY.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToField = (key) => {
    const y = fieldY.current[key];
    if (typeof y === "number" && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, y - 50),
          animated: true
        });
      }, 100);
    }
  };

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    Keyboard.dismiss();
    if (!form.email || !form.password) {
      return Alert.alert("Champs requis", "Saisissez votre e-mail et mot de passe.");
    }
    if (mode === "register" && (!form.firstName?.trim() || !form.lastName?.trim())) {
      return Alert.alert("Nom et prénom requis", "Veuillez renseigner votre prénom et votre nom pour vous inscrire.");
    }
    setBusy(true);
    try {
      let payload = { email: form.email, password: form.password };
      if (mode === "register") {
        payload = {
          ...payload,
          role,
          consentRgpd: true,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          organizationName: form.organizationName || undefined,
          sirenSiret: form.sirenSiret || undefined,
          address: form.address || undefined,
          phone: form.phone || undefined,
          services: role === "association" ? selectedServices : undefined,
          interventionZone:
            role === "association"
              ? { center: { coordinates: coords }, radiusKm: Number(form.radiusKm || 5) }
              : undefined
        };
      }
      const { data } = await api.post(`/auth/${mode === "login" ? "login" : "register"}`, payload);
      await login(data);
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollPage,
          {
            paddingBottom: keyboardHeight > 0
              ? keyboardHeight + 80
              : Platform.select({ android: 110, ios: 100, default: 60 })
          }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
      >
        <Pressable onPress={back} style={styles.backArrowBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
        </Pressable>

        <View style={{ alignItems: "center", marginVertical: 12 }}>
          <BrandLogo size="large" />
        </View>

        <Text style={styles.authTitle}>{mode === "login" ? "Connexion" : "Créer un compte"}</Text>
        <Text style={styles.authSubtitle}>
          {mode === "login"
            ? "Accédez à votre espace Solid'Aid."
            : "Rejoignez le réseau solidaire citoyen et associatif Solid'Aid."}
        </Text>

        {/* Tabs Connexion / Inscription */}
        <View style={styles.authTabs}>
          <Pressable
            onPress={() => setMode("login")}
            style={[styles.authTabItem, mode === "login" && styles.authTabItemActive]}
          >
            <Text style={[styles.authTabText, mode === "login" && styles.authTabTextActive]}>Connexion</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("register")}
            style={[styles.authTabItem, mode === "register" && styles.authTabItemActive]}
          >
            <Text style={[styles.authTabText, mode === "register" && styles.authTabTextActive]}>Inscription</Text>
          </Pressable>
        </View>

        {mode === "register" && (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.inputLabel}>Type de compte</Text>
            <View style={styles.rolePicker}>
              {[
                ["citizen", "Citoyen", "person-outline"],
                ["association", "Association", "people-outline"],
                ["restaurant", "Commerce solidaire", "storefront-outline"]
              ].map(([id, title, icon]) => (
                <Pressable
                  key={id}
                  onPress={() => setRole(id)}
                  style={[styles.roleChip, role === id && styles.roleChipActive]}
                >
                  <Ionicons name={icon} size={16} color={role === id ? "#FFFFFF" : colors.primary} />
                  <Text style={[styles.roleChipText, role === id && styles.roleChipTextActive]}>{title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {mode === "register" && (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }} onLayout={registerLayout("firstName")}>
              <InputField
                label="Prénom"
                value={form.firstName}
                onChangeText={set("firstName")}
                placeholder="Ex. Noujoud"
                icon="person-outline"
                returnKeyType="next"
                onFocus={() => scrollToField("firstName")}
              />
            </View>
            <View style={{ flex: 1 }} onLayout={registerLayout("lastName")}>
              <InputField
                label="Nom"
                value={form.lastName}
                onChangeText={set("lastName")}
                placeholder="Ex. Hajji"
                icon="person-outline"
                returnKeyType="next"
                onFocus={() => scrollToField("lastName")}
              />
            </View>
          </View>
        )}

        <View onLayout={registerLayout("email")}>
          <InputField
            label="Email ou identifiant"
            value={form.email}
            onChangeText={set("email")}
            placeholder="nom@exemple.com"
            icon="mail-outline"
            keyboardType="email-address"
            returnKeyType="next"
            onFocus={() => scrollToField("email")}
          />
        </View>

        <View onLayout={registerLayout("password")}>
          <InputField
            label="Mot de passe"
            value={form.password}
            onChangeText={set("password")}
            placeholder="8 caractères minimum"
            icon="lock-closed-outline"
            secureTextEntry
            returnKeyType={mode === "register" && role !== "citizen" ? "next" : "done"}
            onFocus={() => scrollToField("password")}
            onSubmitEditing={mode === "login" || role === "citizen" ? submit : undefined}
          />
        </View>

        {mode === "register" && role !== "citizen" && (
          <View style={{ gap: 12, marginTop: 4 }}>
            <View onLayout={registerLayout("organizationName")}>
              <InputField
                label="Nom de la structure"
                value={form.organizationName}
                onChangeText={set("organizationName")}
                placeholder="Ex. Croix-Rouge Paris 10, Bistrot Gourmand..."
                icon="business-outline"
                returnKeyType="next"
                onFocus={() => scrollToField("organizationName")}
              />
            </View>
            <View onLayout={registerLayout("sirenSiret")}>
              <InputField
                label="Numéro SIREN / SIRET"
                value={form.sirenSiret}
                onChangeText={set("sirenSiret")}
                placeholder="14 chiffres"
                keyboardType="numeric"
                icon="card-outline"
                returnKeyType="next"
                onFocus={() => scrollToField("sirenSiret")}
              />
            </View>
            <View onLayout={registerLayout("address")}>
              <InputField
                label="Adresse du siège / local"
                value={form.address}
                onChangeText={set("address")}
                placeholder="Ex. 24 Rue d'Hauteville, 75010 Paris"
                icon="location-outline"
                returnKeyType="next"
                onFocus={() => scrollToField("address")}
              />
            </View>
            <View onLayout={registerLayout("phone")}>
              <InputField
                label="Numéro de téléphone"
                value={form.phone}
                onChangeText={set("phone")}
                placeholder="01..."
                keyboardType="phone-pad"
                returnKeyType="done"
                onFocus={() => scrollToField("phone")}
                onSubmitEditing={submit}
              />
            </View>
          </View>
        )}

        <View onLayout={registerLayout("submitBtn")}>
          <PrimaryButton
            title={busy ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "Créer mon compte"}
            disabled={busy}
            onPress={submit}
            style={{ marginTop: 12 }}
          />
        </View>

        <Pressable onPress={() => setPrivacyOpen(true)} style={{ marginTop: 16, alignItems: "center" }}>
          <Text style={styles.legalSmallLink}>En continuant, vous acceptez notre Politique de Confidentialité (RGPD)</Text>
        </Pressable>

        <PrivacyModal visible={privacyOpen} close={() => setPrivacyOpen(false)} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/* ─────────────────────────────────────────────────────────────
   ESPACE CONNECTÉ (CITOYEN, ASSOCIATION, RESTAURANT, ADMIN)
───────────────────────────────────────────────────────────── */

function PrivateApp({ session, logout, updateUser }) {
  const { user } = session;
  const [tab, setTab] = useState(user.role === "admin" ? "admin" : "home");
  const [quickReportOpen, setQuickReportOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const { isKeyboardVisible } = useKeyboard();

  useEffect(() => {
    const handleBack = () => {
      if (profileModalOpen) {
        setProfileModalOpen(false);
        return true;
      }
      if (quickReportOpen) {
        setQuickReportOpen(false);
        return true;
      }
      if (tab !== "home") {
        setTab("home");
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [tab, quickReportOpen, profileModalOpen]);

  if (["association", "restaurant"].includes(user.role) && user.status !== "active") {
    return <PendingScreen user={user} logout={logout} />;
  }

  return (
    <View style={styles.flex}>
      {/* Top Bar Élégante */}
      <View style={styles.topbarModern}>
        <BrandLogo />
        <View style={styles.topbarRight}>
          <Pressable onPress={() => setProfileModalOpen(true)} style={styles.userProfilePill}>
            <View style={styles.userAvatar}>
              {user.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={{ width: 28, height: 28, borderRadius: 14 }} />
              ) : (
                <Text style={styles.userAvatarText}>
                  {((user.firstName ? user.firstName[0] : "") + (user.lastName ? user.lastName[0] : "") || user.organizationName || user.email).substring(0, 2).toUpperCase()}
                </Text>
              )}
            </View>
            <View>
              <Text style={styles.userNamePill} numberOfLines={1}>
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.firstName
                  ? user.firstName
                  : user.organizationName || user.email.split("@")[0]}
              </Text>
              <Text style={styles.userRolePill}>
                {user.role === "association" ? "Association agréée" : user.role === "restaurant" ? "Commerce" : user.role === "admin" ? "Admin" : "Citoyen"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* Vue centrale */}
      <View style={styles.content}>
        {tab === "home" && <HomeScreen user={user} goTab={setTab} openReport={() => setQuickReportOpen(true)} />}
        {tab === "map" && (
          user.role === "citizen" ? (
            <HomeScreen user={user} goTab={setTab} openReport={() => setQuickReportOpen(true)} />
          ) : (
            <MapScreen user={user} />
          )
        )}
        {tab === "reports" && <ReportsScreen user={user} openNew={() => setQuickReportOpen(true)} />}
        {tab === "donations" && <DonationsScreen user={user} />}
        {tab === "admin" && <AdminScreen />}
      </View>

      {/* Barre de navigation basse conforme au Mockup (masquée avec le clavier ouvert) */}
      {!isKeyboardVisible && (
        <View style={styles.bottomTabBar}>
        <Pressable onPress={() => setTab("home")} style={styles.tabBarItem}>
          <Ionicons name={tab === "home" ? "home" : "home-outline"} size={22} color={tab === "home" ? colors.primary : colors.textMuted} />
          <Text style={[styles.tabBarText, tab === "home" && styles.tabBarTextActive]}>Accueil</Text>
        </Pressable>

        {user.role !== "citizen" && (
          <Pressable onPress={() => setTab("map")} style={styles.tabBarItem}>
            <Ionicons name={tab === "map" ? "map" : "map-outline"} size={22} color={tab === "map" ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBarText, tab === "map" && styles.tabBarTextActive]}>Carte</Text>
          </Pressable>
        )}

        {/* Bouton central flottant (+) Signaler */}
        <Pressable onPress={() => setQuickReportOpen(true)} style={styles.centerFloatingButton}>
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </Pressable>

        {user.role !== "restaurant" ? (
          <Pressable onPress={() => setTab("reports")} style={styles.tabBarItem}>
            <Ionicons name={tab === "reports" ? "list" : "list-outline"} size={22} color={tab === "reports" ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBarText, tab === "reports" && styles.tabBarTextActive]}>Signalements</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setTab("donations")} style={styles.tabBarItem}>
            <Ionicons name={tab === "donations" ? "storefront" : "storefront-outline"} size={22} color={tab === "donations" ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBarText, tab === "donations" && styles.tabBarTextActive]}>Invendus</Text>
          </Pressable>
        )}

        {user.role === "admin" ? (
          <Pressable onPress={() => setTab("admin")} style={styles.tabBarItem}>
            <Ionicons name={tab === "admin" ? "shield" : "shield-outline"} size={22} color={tab === "admin" ? colors.primary : colors.textMuted} />
            <Text style={[styles.tabBarText, tab === "admin" && styles.tabBarTextActive]}>Admin</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setProfileModalOpen(true)} style={styles.tabBarItem}>
            <Ionicons name="person-outline" size={22} color={colors.textMuted} />
            <Text style={styles.tabBarText}>Profil</Text>
          </Pressable>
        )}
        </View>
      )}

      <QuickReportModal visible={quickReportOpen} close={() => setQuickReportOpen(false)} />
      <ProfileModal
        visible={profileModalOpen}
        user={user}
        updateUser={updateUser}
        logout={logout}
        close={() => setProfileModalOpen(false)}
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN ACCUEIL PERSONNALISÉ PAR RÔLE
───────────────────────────────────────────────────────────── */

function HomeScreen({ user, goTab, openReport }) {
  const [reports, setReports] = useState([]);
  const [donations, setDonations] = useState([]);
  const [posts, setPosts] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return;
    const handleBack = () => {
      setLightbox(null);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [lightbox]);

  useEffect(() => {
    api.get("/blog").then(({ data }) => setPosts(data)).catch(() => {});
    if (user.role === "admin") {
      api.get("/admin/dashboard").then(({ data }) => setAdminStats(data)).catch(() => {});
    } else {
      api.get("/reports").then(({ data }) => setReports(data)).catch(() => {});
      api.get("/donations").then(({ data }) => setDonations(data)).catch(() => {});
    }
  }, [user.role]);

  const urgentCount = reports.filter((r) => r.urgency === "red" && r.status !== "resolved").length;
  const inProgressCount = reports.filter((r) => r.status === "in_progress").length;
  const resolvedCount = reports.filter((r) => r.status === "resolved").length;

  return (
    <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
      {/* Welcome Banner */}
      <View style={styles.welcomeHeroCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeHeroHello}>Bonjour,</Text>
          <Text style={styles.welcomeHeroName}>
            {user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.firstName
              ? user.firstName
              : user.organizationName || user.email.split("@")[0]}
          </Text>
          <View style={styles.zoneBadge}>
            <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
            <Text style={styles.zoneBadgeText}>
              {user.role === "association"
                ? "Secteur actif · Paris 10e (5 km)"
                : user.role === "restaurant"
                ? "Commerce solidaire agréé"
                : "Citoyen engagé"}
            </Text>
          </View>
        </View>
      </View>

      {/* KPI Cards Grid */}
      <View style={styles.kpiGrid}>
        {user.role === "association" ? (
          <>
            <StatCard title="Urgences critiques" value={urgentCount} icon="warning" color={colors.danger} subtitle="Danger immédiat" />
            <StatCard title="En cours" value={inProgressCount} icon="time" color={colors.alert} subtitle="Interventions" />
            <StatCard title="Résolus" value={resolvedCount} icon="checkmark-done" color={colors.success} subtitle="Mis à l'abri" />
            <StatCard title="Invendus à collecter" value={donations.length} icon="storefront-outline" color={colors.info} subtitle="Commerces solidaires" />
          </>
        ) : user.role === "restaurant" ? (
          <>
            <StatCard title="Dons publiés" value={donations.length} icon="storefront" color={colors.primary} subtitle="Total partagé" />
            <StatCard title="Repas sauvés" value="70+" icon="heart" color={colors.success} subtitle="Contre le gaspillage" />
            <StatCard title="Associations" value="4" icon="people" color={colors.info} subtitle="Partenaires" />
            <StatCard title="Défiscalisation" value="420 €" icon="receipt" color={colors.alert} subtitle="Attestation reçue" />
          </>
        ) : user.role === "admin" && adminStats ? (
          <>
            <StatCard title="Utilisateurs" value={adminStats.users} icon="people" color={colors.primary} />
            <StatCard title="À valider" value={adminStats.pendingOrganizations} icon="shield-outline" color={colors.alert} />
            <StatCard title="Signalements" value={adminStats.reports} icon="map" color={colors.danger} />
            <StatCard title="Dons alimentaires" value={adminStats.donations} icon="storefront-outline" color={colors.success} />
          </>
        ) : (
          <>
            <StatCard title="Mes signalements" value={reports.length} icon="megaphone" color={colors.primary} />
            <StatCard title="Résolus" value={resolvedCount} icon="checkmark-circle" color={colors.success} />
          </>
        )}
      </View>

      {/* Carte en direct du secteur (associations & admins) OU Numéros d'urgence (citoyens) */}
      {user.role !== "citizen" ? (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Carte des urgences en direct</Text>
            <Pressable onPress={() => goTab("map")}>
              <Text style={styles.seeAllLink}>Agrandir la carte →</Text>
            </Pressable>
          </View>
          <ReportsMap reports={reports} height={280} />
        </View>
      ) : (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Numéros d'urgence & Secours</Text>
          </View>
          <View style={styles.emergencyNumGrid}>
            <Pressable onPress={() => Linking.openURL("tel:15")} style={styles.emergencyNumCard}>
              <View style={[styles.emergencyNumBadge, { backgroundColor: "#FEE2E2" }]}>
                <Ionicons name="call" size={18} color="#DC2626" />
              </View>
              <Text style={styles.emergencyNumNumber}>15</Text>
              <Text style={styles.emergencyNumLabel}>SAMU</Text>
              <Text style={styles.emergencyNumDesc}>Urgence vitale</Text>
            </Pressable>

            <Pressable onPress={() => Linking.openURL("tel:18")} style={styles.emergencyNumCard}>
              <View style={[styles.emergencyNumBadge, { backgroundColor: "#FFEDD5" }]}>
                <Ionicons name="flame" size={18} color="#EA580C" />
              </View>
              <Text style={styles.emergencyNumNumber}>18</Text>
              <Text style={styles.emergencyNumLabel}>Pompiers</Text>
              <Text style={styles.emergencyNumDesc}>Secours & Incendie</Text>
            </Pressable>

            <Pressable onPress={() => Linking.openURL("tel:115")} style={styles.emergencyNumCard}>
              <View style={[styles.emergencyNumBadge, { backgroundColor: "#E0E7FF" }]}>
                <Ionicons name="home" size={18} color="#4338CA" />
              </View>
              <Text style={styles.emergencyNumNumber}>115</Text>
              <Text style={styles.emergencyNumLabel}>Samu Social</Text>
              <Text style={styles.emergencyNumDesc}>Hébergement</Text>
            </Pressable>

            <Pressable onPress={() => Linking.openURL("tel:112")} style={styles.emergencyNumCard}>
              <View style={[styles.emergencyNumBadge, { backgroundColor: "#DCFCE7" }]}>
                <Ionicons name="shield-checkmark" size={18} color="#15803D" />
              </View>
              <Text style={styles.emergencyNumNumber}>112</Text>
              <Text style={styles.emergencyNumLabel}>Europe</Text>
              <Text style={styles.emergencyNumDesc}>Numéro d'urgence</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Derniers signalements prioritaires */}
      {user.role === "association" && reports.length > 0 && (
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Signalements prioritaires</Text>
            <Pressable onPress={() => goTab("reports")}>
              <Text style={styles.seeAllLink}>Voir tout →</Text>
            </Pressable>
          </View>
          {reports.slice(0, 2).map((r) => (
            <View key={r._id} style={styles.priorityCard}>
              {r.imageUrl ? (
                <Pressable
                  onPress={() => setLightbox({ url: r.imageUrl, title: r.addressHint || "Photo du signalement" })}
                  style={styles.priorityImageWrapper}
                >
                  <Image source={{ uri: r.imageUrl }} style={styles.priorityCardImage} />
                  <View style={styles.imageZoomBadge}>
                    <Ionicons name="scan-outline" size={13} color="#FFFFFF" />
                    <Text style={styles.imageZoomBadgeText}>Photo</Text>
                  </View>
                </Pressable>
              ) : null}
              <View style={styles.priorityCardHeader}>
                <View style={[styles.urgencyDot, { backgroundColor: r.urgency === "red" ? colors.danger : colors.alert }]} />
                <Text style={styles.priorityCardTitle}>
                  {r.type === "group" ? "Groupe en détresse" : "Personne seule"}
                </Text>
                <View style={[styles.statusBadgeSmall, { backgroundColor: r.status === "resolved" ? "#DCFCE7" : "#FEF3C7" }]}>
                  <Text style={[styles.statusBadgeSmallText, { color: r.status === "resolved" ? "#166534" : "#92400E" }]}>
                    {statusLabels[r.status]}
                  </Text>
                </View>
              </View>
              <Text style={styles.priorityCardAddress}>📍 {r.addressHint || "Localisation GPS"}</Text>
              {r.comment ? <Text style={styles.priorityCardComment}>« {r.comment} »</Text> : null}
              <View style={styles.priorityCardActions}>
                <Pressable
                  onPress={() => goTab("reports")}
                  style={styles.actionChipButton}
                >
                  <Text style={styles.actionChipButtonText}>Prendre en charge</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Action Citoyen */}
      {user.role === "citizen" && (
        <View style={styles.citizenActionCard}>
          <Ionicons name="megaphone" size={32} color={colors.primary} />
          <Text style={styles.citizenActionTitle}>Un besoin urgent observé ?</Text>
          <Text style={styles.citizenActionText}>
            Signalez immédiatement la position pour orienter les équipes du Samu Social et de la Croix-Rouge.
          </Text>
          <PrimaryButton title="Créer un signalement" icon="add" onPress={openReport} />
        </View>
      )}

      {posts.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Actualités solidaires</Text>
          <Text style={styles.bodyMuted}>Les dernières informations de Solid'Aid</Text>
          {posts.slice(0, 5).map((post) => (
            <View key={post._id} style={[styles.priorityCard, { marginTop: 10 }]}>
              {post.imageUrl ? (
                <Image source={{ uri: post.imageUrl }} style={{ width: "100%", height: 130, borderRadius: 10, marginBottom: 8 }} resizeMode="cover" />
              ) : null}
              <Text style={styles.priorityCardTitle}>{post.title}</Text>
              <Text style={styles.bodyMuted}>{post.category} · {post.author}</Text>
              <Text style={styles.priorityCardComment}>{post.summary}</Text>
            </View>
          ))}
        </View>
      )}

      <ImageLightboxModal visible={!!lightbox} image={lightbox} close={() => setLightbox(null)} />
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN CARTE PLEIN ÉCRAN
───────────────────────────────────────────────────────────── */

function MapScreen() {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    api.get("/reports").then(({ data }) => setReports(data)).catch(() => {});
  }, []);

  const filteredReports = reports.filter((r) => {
    if (filter === "red") return r.urgency === "red";
    if (filter === "food") return (r.needs || []).includes("food");
    if (filter === "shelter") return (r.needs || []).includes("shelter");
    return true;
  });

  return (
    <View style={[styles.flex, { paddingBottom: 72, minHeight: 0 }]}>
      {/* Filtres de la carte */}
      <View style={styles.mapFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
          {[
            ["all", "Tous les repères"],
            ["red", "🚨 Critiques"],
            ["food", "🍲 Repas"],
            ["shelter", "🏠 Hébergement"]
          ].map(([id, title]) => (
            <Pressable
              key={id}
              onPress={() => setFilter(id)}
              style={[styles.mapFilterChip, filter === id && styles.mapFilterChipActive]}
            >
              <Text style={[styles.mapFilterChipText, filter === id && styles.mapFilterChipTextActive]}>
                {title}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={{ flex: 1, width: "100%", minHeight: 0 }}>
        <ReportsMap reports={filteredReports} height="100%" isFull />
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN SIGNALEMENTS (LISTE & WORKFLOW)
───────────────────────────────────────────────────────────── */

function ReportsScreen({ user, openNew }) {
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!lightbox) return;
    const handleBack = () => {
      setLightbox(null);
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [lightbox]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter ? `?status=${filter}` : "";
      const { data } = await api.get(`/reports${qs}`);
      setReports(data);
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/reports/${id}`, { status });
      Alert.alert("Succès", "Statut du signalement mis à jour.");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeaderTitle}>Signalements terrain</Text>
          <Text style={styles.bodyMuted}>{reports.length} situation(s) identifiée(s)</Text>
        </View>
        {["citizen", "admin"].includes(user.role) && (
          <Pressable onPress={openNew} style={styles.smallAddBtn}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.smallAddBtnText}>Nouveau</Text>
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterChipsRow}>
        {[
          ["", "Tous"],
          ["new", "Nouveaux"],
          ["in_progress", "En cours"],
          ["resolved", "Résolus"]
        ].map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setFilter(id)}
            style={[styles.filterChipItem, filter === id && styles.filterChipItemActive]}
          >
            <Text style={[styles.filterChipText, filter === id && styles.filterChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Mise à jour des signalements…</Text>
      ) : (
        reports.map((r) => (
          <View key={r._id} style={styles.reportItemCard}>
            <View style={styles.reportCardTop}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={[styles.urgencyDot, { backgroundColor: r.urgency === "red" ? colors.danger : r.urgency === "yellow" ? colors.alert : colors.success }]} />
                <Text style={styles.reportItemTitle}>
                  {r.type === "group" ? "Groupe de personnes" : "Personne seule"}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: r.status === "resolved" ? "#DCFCE7" : "#FEF3C7" }]}>
                <Text style={[styles.statusPillText, { color: r.status === "resolved" ? "#166534" : "#92400E" }]}>
                  {statusLabels[r.status]}
                </Text>
              </View>
            </View>

            <Text style={styles.reportItemMeta}>📍 {r.addressHint || "Position GPS"} · {formatDate(r.createdAt)}</Text>
            {r.comment ? <Text style={styles.reportItemComment}>{r.comment}</Text> : null}

            {/* Needs Chips */}
            <View style={styles.needsWrap}>
              {(r.needs || []).map((n) => (
                <View key={n} style={styles.needTagPill}>
                  <Ionicons name={needIcons[n] || "help-circle"} size={13} color={colors.primary} />
                  <Text style={styles.needTagText}>{labels[n] || n}</Text>
                </View>
              ))}
            </View>

            {r.imageUrl ? (
              <Pressable
                onPress={() => setLightbox({ url: r.imageUrl, title: `${r.type === "group" ? "Groupe" : "Personne"} · ${r.addressHint || "Signalement"}` })}
                style={styles.imageCardWrapper}
              >
                <Image source={{ uri: r.imageUrl }} style={styles.reportCardImage} />
                <View style={styles.imageZoomBadge}>
                  <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.imageZoomBadgeText}>Agrandir la photo</Text>
                </View>
              </Pressable>
            ) : null}

            {/* Actions pour les associations */}
            {user.role === "association" && r.status !== "resolved" && (
              <View style={styles.reportActionRow}>
                <Pressable onPress={() => updateStatus(r._id, "in_progress")} style={styles.takeActionBtn}>
                  <Text style={styles.takeActionBtnText}>Prendre en charge</Text>
                </Pressable>
                <Pressable onPress={() => updateStatus(r._id, "resolved")} style={styles.resolveActionBtn}>
                  <Text style={styles.resolveActionBtnText}>Marquer résolu ✓</Text>
                </Pressable>
              </View>
            )}
          </View>
        ))
      )}

      {reports.length === 0 && !loading && (
        <View style={styles.emptyCard}>
          <Ionicons name="checkmark-circle-outline" size={40} color={colors.primary} />
          <Text style={styles.emptyCardTitle}>Aucun signalement</Text>
          <Text style={styles.bodyMuted}>Toutes les situations de cette zone sont actuellement prises en charge.</Text>
        </View>
      )}

      <ImageLightboxModal visible={!!lightbox} image={lightbox} close={() => setLightbox(null)} />
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN INVENDUS ALIMENTAIRES (RESTAURANTS & ASSOCS)
───────────────────────────────────────────────────────────── */

function DonationsScreen({ user }) {
  const [items, setItems] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("");
  const [start, setStart] = useState("18:00");
  const [end, setEnd] = useState("20:00");
  const [photoData, setPhotoData] = useState("");
  const [busy, setBusy] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { keyboardHeight } = useKeyboard();
  const donScrollRef = useRef(null);

  useEffect(() => {
    const handleBack = () => {
      if (lightbox) {
        setLightbox(null);
        return true;
      }
      if (formOpen) {
        setFormOpen(false);
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [lightbox, formOpen]);

  const load = useCallback(() => {
    api.get("/donations").then(({ data }) => setItems(data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const takePhoto = async () => {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return Alert.alert("Caméra", "Autorisez l'accès à la caméra pour photographier les denrées.");
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
    if (!res.canceled && res.assets?.[0]?.base64) {
      setPhotoData(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true
    });
    if (!res.canceled && res.assets?.[0]?.base64) {
      setPhotoData(`data:image/jpeg;base64,${res.assets[0].base64}`);
    }
  };

  const sendDonation = async () => {
    if (!desc.trim() || !qty.trim()) {
      return Alert.alert("Erreur", "Saisissez la description et la quantité.");
    }
    setBusy(true);
    try {
      await api.post("/donations", {
        description: desc,
        quantity: qty,
        photoUrl: photoData || undefined,
        availableDate: new Date().toISOString(),
        pickupSlots: [{ start, end }]
      });
      Alert.alert("Don solidaire publié", "Les associations de votre secteur ont été notifiées.");
      setFormOpen(false);
      setDesc("");
      setQty("");
      setPhotoData("");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const markCollected = async (id) => {
    try {
      await api.patch(`/donations/${id}/status`, { status: "collected" });
      Alert.alert("Merci", "Collecte enregistrée avec succès.");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
      <View style={styles.sectionHeaderRow}>
        <View>
          <Text style={styles.sectionHeaderTitle}>Invendus alimentaires</Text>
          <Text style={styles.bodyMuted}>Lutte contre le gaspillage solidaire ({items.length} lots)</Text>
        </View>
        {user.role === "restaurant" && (
          <Pressable onPress={() => setFormOpen(true)} style={styles.smallAddBtn}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.smallAddBtnText}>Nouveau don</Text>
          </Pressable>
        )}
      </View>

      {items.map((d) => (
        <View key={d._id} style={styles.donationCard}>
          {d.photoUrl ? (
            <Pressable
              onPress={() => setLightbox({ url: d.photoUrl, title: `${d.description} (${d.quantity})` })}
              style={styles.donationImageWrapper}
            >
              <Image source={{ uri: d.photoUrl }} style={styles.donationCardImage} />
              <View style={styles.imageZoomBadge}>
                <Ionicons name="scan-outline" size={14} color="#FFFFFF" />
                <Text style={styles.imageZoomBadgeText}>Agrandir la photo</Text>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.donationCardHeader}>
            <View style={styles.donationIconBox}>
              <Ionicons name="storefront" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.donationTitle}>{d.description}</Text>
              <Text style={styles.donationQty}>Quantité : {d.quantity}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: d.status === "collected" ? "#DCFCE7" : "#EFF6FF" }]}>
              <Text style={[styles.statusPillText, { color: d.status === "collected" ? "#166534" : "#1D4ED8" }]}>
                {statusLabels[d.status]}
              </Text>
            </View>
          </View>

          <Text style={styles.donationMeta}>
            🏪 {d.restaurant?.organizationName || "Commerce solidaire"} · Retrait : {d.pickupSlots?.[0]?.start || "18h"} - {d.pickupSlots?.[0]?.end || "20h"}
          </Text>

          {user.role === "association" && d.status === "assigned" && (
            <PrimaryButton
              title="Marquer comme collecté"
              icon="checkmark-circle"
              onPress={() => markCollected(d._id)}
              style={{ marginTop: 10 }}
            />
          )}
        </View>
      ))}

      {/* Modal Créer Don */}
      <Modal visible={formOpen} animationType="slide">
        <SafeAreaView style={styles.modalSafeArea}>
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalTopNav}>
              <Pressable onPress={() => setFormOpen(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={24} color={colors.primaryDark} />
              </Pressable>
              <Text style={styles.modalHeaderTitle}>Déclarer un don d'invendus</Text>
            </View>
            <ScrollView
              ref={donScrollRef}
              contentContainerStyle={[
                styles.modalScrollBody,
                { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 60 }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
            <InputField
              label="Description des denrées"
              value={desc}
              onChangeText={setDesc}
              placeholder="Ex. 20 paniers repas chauds, 15 barquettes de légumes..."
              multiline
            />
            <InputField
              label="Quantité estimée"
              value={qty}
              onChangeText={setQty}
              placeholder="Ex. 20 repas / 15 kg"
            />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <InputField label="Début créneau" value={start} onChangeText={setStart} placeholder="18:00" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField label="Fin créneau" value={end} onChangeText={setEnd} placeholder="20:00" />
              </View>
            </View>

            {/* Photo Upload Options */}
            <View style={{ gap: 8 }}>
              <Text style={styles.inputLabel}>Photo des denrées (recommandé)</Text>
              <View style={styles.mediaButtonsRow}>
                <Pressable onPress={takePhoto} style={styles.mediaBtn}>
                  <Ionicons name="camera-outline" size={22} color={colors.primary} />
                  <Text style={styles.mediaBtnText}>Prendre une photo</Text>
                </Pressable>
                <Pressable onPress={pickImage} style={styles.mediaBtn}>
                  <Ionicons name="images-outline" size={22} color={colors.primary} />
                  <Text style={styles.mediaBtnText}>Depuis la galerie</Text>
                </Pressable>
              </View>
              {photoData ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: photoData }} style={styles.imagePreview} />
                  <Pressable onPress={() => setPhotoData("")} style={styles.removeImageBadge}>
                    <Ionicons name="close" size={18} color="#FFFFFF" />
                  </Pressable>
                </View>
              ) : null}
            </View>

            <PrimaryButton
              title={busy ? "Publication en cours…" : "Publier le don solidaire"}
              disabled={busy}
              onPress={sendDonation}
              style={{ marginTop: 12 }}
            />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      <ImageLightboxModal visible={!!lightbox} image={lightbox} close={() => setLightbox(null)} />
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   ÉCRAN ADMINISTRATION
───────────────────────────────────────────────────────────── */

function AdminScreen() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [reports, setReports] = useState([]);
  const [donations, setDonations] = useState([]);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [section, setSection] = useState("overview");
  const [reportStatus, setReportStatus] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDraft, setUserDraft] = useState(null);
  const [userComposerVisible, setUserComposerVisible] = useState(false);
  const [newUserDraft, setNewUserDraft] = useState({ email: "", password: "", role: "citizen", consentRgpd: true });
  const [reportDraft, setReportDraft] = useState(null);
  const [postComposerVisible, setPostComposerVisible] = useState(false);
  const [postDraft, setPostDraft] = useState({ title: "", summary: "", content: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const requests = await Promise.allSettled([
      api.get("/admin/dashboard"),
      api.get("/admin/organizations/pending"),
      api.get("/admin/organizations"),
      api.get(`/admin/reports?${reportStatus ? `status=${reportStatus}&` : ""}${pendingOnly ? "pending=true&" : ""}${search ? `search=${encodeURIComponent(search)}` : ""}`),
      api.get("/admin/donations"),
      api.get(`/admin/users${search ? `?search=${encodeURIComponent(search)}` : ""}`),
      api.get("/blog")
    ]);

    const failures = [];
    const data = (index, label) => {
      const request = requests[index];
      if (request.status === "fulfilled") return request.value.data;
      const status = request.reason?.response?.status;
      failures.push(status === 401 ? `${label} : session administrateur expirée` : `${label} : ${errorMessage(request.reason)}`);
      return null;
    };

    const statsData = data(0, "Tableau de bord");
    const pendingData = data(1, "Organisations en attente");
    const organizationsData = data(2, "Organisations");
    const reportsData = data(3, "Signalements");
    const donationsData = data(4, "Dons");
    const usersData = data(5, "Utilisateurs");
    const postsData = data(6, "Blog");

    if (statsData) setStats(statsData);
    if (pendingData) setPending(pendingData);
    if (organizationsData) setOrganizations(organizationsData);
    if (reportsData) setReports(reportsData);
    if (donationsData) setDonations(donationsData);
    if (usersData) setUsers(usersData);
    if (postsData) setPosts(postsData);
    setError(failures.length ? failures.join("\n") : "");
    setLoading(false);
  }, [reportStatus, pendingOnly, search]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id, status) => {
    try {
      const rejectionReason = status === "rejected"
        ? await new Promise((resolve) => Alert.alert(
            "Motif du refus",
            "Sélectionnez le motif applicable.",
            [
              { text: "Informations incomplètes", onPress: () => resolve("Informations incomplètes.") },
              { text: "Documents non conformes", onPress: () => resolve("Documents non conformes.") },
              { text: "Annuler", style: "cancel", onPress: () => resolve("") }
            ]
          ))
        : undefined;
      if (status === "rejected" && !rejectionReason?.trim()) return;
      await api.patch(`/admin/organizations/${id}/status`, { status, rejectionReason });
      Alert.alert("Succès", `Structure ${status === "active" ? "validée" : "refusée"}.`);
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  const decideReport = async (id, action) => {
    const rejectionReason = action === "reject"
      ? "Demande rejetée après vérification administrative."
      : undefined;
    try {
      await api.patch(`/reports/${id}/confirm-status`, { action, rejectionReason });
      Alert.alert("Succès", action === "approve" ? "Statut confirmé." : "Demande rejetée.");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  const removeReport = async (id) => {
    Alert.alert("Retirer le signalement", "Le signalement sera marqué comme retiré.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/reports/${id}`);
            load();
          } catch (e) {
            Alert.alert("Erreur", errorMessage(e));
          }
        }
      }
    ]);
  };

  const createPost = () => {
    setPostDraft({ title: "", summary: "", content: "" });
    setPostComposerVisible(true);
  };

  const submitPost = async () => {
    if (!postDraft.title.trim() || !postDraft.summary.trim() || !postDraft.content.trim()) {
      Alert.alert("Champs obligatoires", "Renseignez le titre, le résumé et le contenu.");
      return;
    }
    try {
      await api.post("/blog", { ...postDraft, category: "Actualité" });
      setPostComposerVisible(false);
      Alert.alert("Succès", "Article créé.");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  const deletePost = (id) => {
    Alert.alert("Supprimer l'article", "Cette action est irréversible.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/blog/${id}`);
            load();
          } catch (e) {
            Alert.alert("Erreur", errorMessage(e));
          }
        }
      }
    ]);
  };

  const editUser = (user) => {
    setSelectedUser(user);
    setUserDraft({
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      organizationName: user.organizationName || "",
      phone: user.phone || "",
      address: user.address || "",
      status: user.status || "active"
    });
  };

  const saveUser = async () => {
    try {
      await api.patch(`/admin/users/${selectedUser._id}`, userDraft);
      setSelectedUser(null);
      setUserDraft(null);
      Alert.alert("Succès", "Utilisateur mis à jour.");
      load();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  const removeUser = (user) => {
    Alert.alert("Retirer l'utilisateur", "Le compte sera désactivé sans supprimer ses historiques.", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Retirer",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete(`/admin/users/${user._id}`);
            Alert.alert("Succès", "Utilisateur retiré.");
            load();
          } catch (e) {
            Alert.alert("Erreur", errorMessage(e));
          }
        }
      }
    ]);
  };

  const tabs = [
    ["overview", "Vue d'ensemble"],
    ["organizations", "Organisations"],
    ["reports", "Signalements"],
    ["donations", "Dons"],
    ["users", "Utilisateurs"],
    ["blog", "Blog"]
  ];

  return (
    <ScrollView contentContainerStyle={styles.scrollPage} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionHeaderTitle}>Administration Solid'Aid</Text>
        <Pressable onPress={load} disabled={loading}>
          <Ionicons name="refresh" size={22} color={colors.primary} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 12 }}>
        {tabs.map(([id, label]) => (
          <Pressable
            key={id}
            onPress={() => setSection(id)}
            style={[styles.filterChipItem, section === id && styles.filterChipItemActive]}
          >
            <Text style={[styles.filterChipText, section === id && styles.filterChipTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {error ? <Text style={{ color: colors.danger, marginBottom: 10 }}>{error}</Text> : null}
      {loading && <Text style={styles.bodyMuted}>Actualisation des données...</Text>}

      {section === "overview" && stats && (
        <View>
          <Text style={{ color: colors.textSecondary, marginBottom: 10 }}>
            Supervision de la plateforme · {new Date().toLocaleDateString("fr-FR")}
          </Text>
          <View style={styles.kpiGrid}>
          <StatCard title="Utilisateurs" value={stats.users} icon="people" />
          <StatCard title="Citoyens" value={stats.citizens} icon="person" />
          <StatCard title="Associations" value={stats.associations} icon="people-circle" color={colors.info} />
          <StatCard title="Restaurants" value={stats.restaurants} icon="restaurant" color={colors.info} />
          <StatCard title="Signalements" value={stats.reports} icon="map" color={colors.danger} />
          <StatCard title="Nouveaux" value={stats.newReports} icon="alert-circle" color={colors.alert} />
          <StatCard title="En cours" value={stats.inProgressReports} icon="time" color={colors.alert} />
          <StatCard title="Résolus" value={stats.resolvedReports} icon="checkmark-circle" color={colors.success} />
          <StatCard title="À valider" value={stats.pendingOrganizations} icon="shield" color={colors.alert} />
          <StatCard title="Statuts en attente" value={stats.pendingStatusReports} icon="time" color={colors.alert} />
          <StatCard title="Dons" value={stats.donations} icon="storefront" color={colors.success} />
          <StatCard title="Dons affectés" value={stats.assignedDonations} icon="arrow-forward-circle" color={colors.info} />
          <StatCard title="Dons collectés" value={stats.collectedDonations} icon="checkmark-done" color={colors.success} />
          </View>
        </View>
      )}

      {section === "organizations" && (
        <>
          <Text style={styles.sectionHeaderTitle}>Organisations ({organizations.length})</Text>
          {organizations.map((org) => (
            <View key={org._id} style={styles.priorityCard}>
              <Text style={styles.priorityCardTitle}>{org.organizationName || org.email}</Text>
              <Text style={styles.priorityCardAddress}>Rôle : {org.role} · SIREN : {org.sirenSiret || "—"}</Text>
              <Text style={styles.bodyMuted}>{org.email} · {org.phone || "Téléphone non renseigné"}</Text>
              <Text style={{ color: org.status === "active" ? colors.success : org.status === "rejected" ? colors.danger : colors.alert, fontWeight: "800" }}>
                {org.status === "active" ? "Approuvée" : org.status === "rejected" ? "Refusée" : "En attente"}
              </Text>
              {org.status === "pending" && <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <PrimaryButton title="Valider" onPress={() => setStatus(org._id, "active")} style={{ flex: 1 }} />
                <PrimaryButton title="Refuser" variant="danger" onPress={() => setStatus(org._id, "rejected")} style={{ flex: 1 }} />
              </View>}
            </View>
          ))}
          {!organizations.length && <Text style={styles.bodyMuted}>Aucune organisation.</Text>}
        </>
      )}

      {section === "reports" && (
        <>
          <Text style={styles.sectionHeaderTitle}>Modération des signalements ({reports.length})</Text>
          <View style={styles.filterChipsRow}>
            {[
              ["", "Tous"],
              ["new", "Nouveaux"],
              ["in_progress", "En cours"],
              ["resolved", "Résolus"],
              ["pending", "À modérer"]
            ].map(([value, label]) => (
              <Pressable key={value || "all"} onPress={() => value === "pending" ? setPendingOnly((current) => !current) : (setPendingOnly(false), setReportStatus(value))} style={[styles.filterChipItem, (value === "pending" ? pendingOnly : reportStatus === value) && styles.filterChipItemActive]}>
                <Text style={[styles.filterChipText, (value === "pending" ? pendingOnly : reportStatus === value) && styles.filterChipTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>
          <InputField label="Recherche adresse ou description" value={search} onChangeText={setSearch} placeholder="Rechercher..." icon="search-outline" />
          {reports.map((report) => (
            <View key={report._id} style={styles.priorityCard}>
              <View style={styles.priorityCardHeader}>
                <Text style={styles.priorityCardTitle}>{report.type === "group" ? "Signalement groupe" : "Signalement individuel"}</Text>
                <Text style={styles.bodyMuted}>{report.status}</Text>
              </View>
              <Text style={styles.priorityCardAddress}>{report.addressHint || "Localisation GPS"} · urgence {report.urgency}</Text>
              {report.comment ? <Text style={styles.priorityCardComment}>« {report.comment} »</Text> : null}
              <Pressable
                onPress={() => setSelectedReport(report)}
                style={{ marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.mintSoft }}
              >
                <Text style={{ color: colors.primary, fontWeight: "800", fontSize: 12 }}>Voir tous les détails</Text>
              </Pressable>
              {report.pendingStatus?.status && (
                <View style={{ marginTop: 8, padding: 8, backgroundColor: colors.mintSoft, borderRadius: 8 }}>
                  <Text style={styles.bodyMuted}>Demande : {report.status} → {report.pendingStatus.status}</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                    <PrimaryButton title="Approuver" onPress={() => decideReport(report._id, "approve")} style={{ flex: 1 }} />
                    <PrimaryButton title="Rejeter" variant="danger" onPress={() => decideReport(report._id, "reject")} style={{ flex: 1 }} />
                  </View>
                </View>
              )}
              <Pressable onPress={() => removeReport(report._id)} style={{ marginTop: 10 }}>
                <Text style={{ color: colors.danger, fontWeight: "700" }}>Retirer le signalement</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      {section === "donations" && (
        <>
          <Text style={styles.sectionHeaderTitle}>Dons alimentaires ({donations.length})</Text>
          {donations.map((donation) => (
            <View key={donation._id} style={styles.priorityCard}>
              <Text style={styles.priorityCardTitle}>{donation.description}</Text>
              <Text style={styles.priorityCardAddress}>{donation.quantity} · {donation.status}</Text>
              <Text style={styles.bodyMuted}>{donation.restaurant?.organizationName || donation.restaurant?.email || "Restaurateur"} · {donation.valuation?.estimatedValueEur || 0} EUR</Text>
            </View>
          ))}
        </>
      )}

      {section === "users" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionHeaderTitle}>Utilisateurs ({users.length})</Text>
            <PrimaryButton title="Créer" onPress={() => setUserComposerVisible(true)} style={{ paddingHorizontal: 14 }} />
          </View>
          <InputField label="Rechercher un utilisateur" value={search} onChangeText={setSearch} placeholder="Email, nom, organisation..." icon="search-outline" />
          {users.map((item) => (
            <View key={item._id} style={styles.priorityCard}>
              <Text style={styles.priorityCardTitle}>{item.organizationName || `${item.firstName || ""} ${item.lastName || ""}`.trim() || item.email}</Text>
              <Text style={styles.priorityCardAddress}>{item.role} · {item.status}</Text>
              <Text style={styles.bodyMuted}>{item.email}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <PrimaryButton title="Modifier" onPress={() => editUser(item)} style={{ flex: 1 }} />
                {item.role !== "admin" && <PrimaryButton title="Retirer" variant="danger" onPress={() => removeUser(item)} style={{ flex: 1 }} />}
              </View>
            </View>
          ))}
        </>
      )}

      {section === "blog" && (
        <>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.sectionHeaderTitle}>Articles publiés ({posts.length})</Text>
            <PrimaryButton title="Créer" onPress={createPost} style={{ paddingHorizontal: 14 }} />
          </View>
          {posts.map((post) => (
            <View key={post._id} style={styles.priorityCard}>
              <Text style={styles.priorityCardTitle}>{post.title}</Text>
              <Text style={styles.bodyMuted}>{post.category} · {post.author}</Text>
              <Text style={styles.priorityCardComment}>{post.summary}</Text>
              <Pressable onPress={() => deletePost(post._id)} style={{ marginTop: 8 }}>
                <Text style={{ color: colors.danger, fontWeight: "800" }}>Supprimer</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <Modal visible={!!selectedReport} animationType="slide" onRequestClose={() => setSelectedReport(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 18, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#FFFFFF" }}>
            <Text style={styles.sectionHeaderTitle}>Détails du signalement</Text>
            <Pressable onPress={() => setSelectedReport(null)} accessibilityLabel="Fermer les détails">
              <Ionicons name="close-circle" size={28} color={colors.primaryDark} />
            </Pressable>
          </View>
          {selectedReport && (
            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
              <View style={styles.priorityCard}>
                <Text style={styles.priorityCardTitle}>
                  {selectedReport.type === "group" ? "Groupe de personnes" : "Personne seule"}
                </Text>
                <Text style={styles.priorityCardAddress}>
                  Statut : {selectedReport.status} · Urgence : {selectedReport.urgency}
                </Text>
                <Text style={styles.bodyMuted}>
                  Créé le {selectedReport.createdAt ? new Date(selectedReport.createdAt).toLocaleString("fr-FR") : "—"}
                </Text>
              </View>

              {selectedReport.imageUrl ? (
                <Image
                  source={{ uri: selectedReport.imageUrl }}
                  style={{ width: "100%", height: 210, borderRadius: 14, backgroundColor: colors.border }}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.priorityCard}>
                <Text style={styles.cardTitle}>Localisation</Text>
                <Text style={styles.bodyMuted}>{selectedReport.addressHint || "Adresse non renseignée"}</Text>
                <Text style={styles.bodyMuted}>
                  GPS : {selectedReport.location?.coordinates?.[1] ?? "—"}, {selectedReport.location?.coordinates?.[0] ?? "—"}
                </Text>
              </View>

              <View style={styles.priorityCard}>
                <Text style={styles.cardTitle}>Description et besoins</Text>
                <Text style={styles.bodyMuted}>{selectedReport.comment || "Aucune description."}</Text>
                <Text style={styles.bodyMuted}>
                  Besoins : {selectedReport.needs?.length ? selectedReport.needs.join(", ") : "Non renseignés"}
                </Text>
                {selectedReport.otherNeed ? <Text style={styles.bodyMuted}>Autre besoin : {selectedReport.otherNeed}</Text> : null}
                {selectedReport.fulfilledNeeds?.length ? (
                  <Text style={styles.bodyMuted}>Besoins couverts : {selectedReport.fulfilledNeeds.join(", ")}</Text>
                ) : null}
              </View>

              <View style={styles.priorityCard}>
                <Text style={styles.cardTitle}>Personne ou groupe</Text>
                {selectedReport.type === "group" ? (
                  <Text style={styles.bodyMuted}>
                    Nombre : {selectedReport.group?.peopleCount || "—"} · Genre : {selectedReport.group?.majorityGender || "—"} · Âge moyen : {selectedReport.group?.averageAgeRange || "—"}
                  </Text>
                ) : (
                  <Text style={styles.bodyMuted}>
                    Genre apparent : {selectedReport.individual?.apparentGender || "—"} · Âge : {selectedReport.individual?.ageRange || "—"}
                  </Text>
                )}
                {selectedReport.individual ? (
                  <Text style={styles.bodyMuted}>
                    Barrière linguistique : {selectedReport.individual.languageBarrier ? "Oui" : "Non"} · A demandé de l'aide : {selectedReport.individual.requestedHelp ? "Oui" : "Non"}
                  </Text>
                ) : null}
              </View>

              <View style={styles.priorityCard}>
                <Text style={styles.cardTitle}>Acteurs et notes</Text>
                <Text style={styles.bodyMuted}>
                  Créateur : {selectedReport.isAnonymous ? "Signalement anonyme" : selectedReport.createdBy?.email || selectedReport.createdBy?.organizationName || "—"}
                </Text>
                <Text style={styles.bodyMuted}>
                  Associations affectées : {selectedReport.assignedAssociations?.length
                    ? selectedReport.assignedAssociations.map((association) => association.organizationName || association.email).join(", ")
                    : "Aucune"}
                </Text>
                <Text style={styles.bodyMuted}>Note association : {selectedReport.associationNotes || "—"}</Text>
                <Text style={styles.bodyMuted}>Note administration : {selectedReport.adminNotes || "—"}</Text>
                <PrimaryButton title="Modifier les notes" onPress={() => editReport(selectedReport)} style={{ marginTop: 10 }} />
              </View>

              <View style={styles.priorityCard}>
                <Text style={styles.cardTitle}>Historique des statuts</Text>
                {selectedReport.statusChangeHistory?.length ? selectedReport.statusChangeHistory.map((entry, index) => (
                  <Text key={`${entry.requestedAt || "history"}-${index}`} style={styles.bodyMuted}>
                    {entry.decision === "approved" ? "Approuvé" : "Rejeté"} : {entry.proposedStatus} · {entry.requestedAt ? new Date(entry.requestedAt).toLocaleString("fr-FR") : "—"}
                    {entry.rejectionReason ? ` · Motif : ${entry.rejectionReason}` : ""}
                  </Text>
                )) : <Text style={styles.bodyMuted}>Aucun historique de décision.</Text>}
                {selectedReport.pendingStatus?.status ? (
                  <Text style={{ color: colors.alert, fontWeight: "800", marginTop: 6 }}>
                    Demande en attente : {selectedReport.status} → {selectedReport.pendingStatus.status}
                  </Text>
                ) : null}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
      <Modal visible={!!selectedUser} animationType="slide" onRequestClose={() => setSelectedUser(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, backgroundColor: "#FFFFFF" }}>
            <Text style={styles.sectionHeaderTitle}>Modifier l'utilisateur</Text>
            <Pressable onPress={() => setSelectedUser(null)}><Ionicons name="close-circle" size={28} color={colors.primaryDark} /></Pressable>
          </View>
          {userDraft && (
            <ScrollView contentContainerStyle={{ padding: 18, gap: 10 }}>
              <Text style={styles.bodyMuted}>{selectedUser.email} · {selectedUser.role}</Text>
              <InputField label="Prénom" value={userDraft.firstName} onChangeText={(firstName) => setUserDraft((draft) => ({ ...draft, firstName }))} placeholder="Prénom" />
              <InputField label="Nom" value={userDraft.lastName} onChangeText={(lastName) => setUserDraft((draft) => ({ ...draft, lastName }))} placeholder="Nom" />
              <InputField label="Organisation" value={userDraft.organizationName} onChangeText={(organizationName) => setUserDraft((draft) => ({ ...draft, organizationName }))} placeholder="Organisation" />
              <InputField label="Téléphone" value={userDraft.phone} onChangeText={(phone) => setUserDraft((draft) => ({ ...draft, phone }))} placeholder="Téléphone" />
              <InputField label="Adresse" value={userDraft.address} onChangeText={(address) => setUserDraft((draft) => ({ ...draft, address }))} placeholder="Adresse" />
              <View style={styles.filterChipsRow}>
                {["active", "pending", "rejected"].map((status) => (
                  <Pressable key={status} onPress={() => setUserDraft((draft) => ({ ...draft, status }))} style={[styles.filterChipItem, userDraft.status === status && styles.filterChipItemActive]}>
                    <Text style={[styles.filterChipText, userDraft.status === status && styles.filterChipTextActive]}>{status}</Text>
                  </Pressable>
                ))}
              </View>
              <PrimaryButton title="Enregistrer" onPress={saveUser} />
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
      <Modal visible={postComposerVisible} animationType="slide" onRequestClose={() => setPostComposerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, backgroundColor: "#FFFFFF" }}>
            <Text style={styles.sectionHeaderTitle}>Créer un article</Text>
            <Pressable onPress={() => setPostComposerVisible(false)}><Ionicons name="close-circle" size={28} color={colors.primaryDark} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
            <InputField label="Titre" value={postDraft.title} onChangeText={(title) => setPostDraft((draft) => ({ ...draft, title }))} placeholder="Titre de l'article" />
            <InputField label="Résumé" value={postDraft.summary} onChangeText={(summary) => setPostDraft((draft) => ({ ...draft, summary }))} placeholder="Résumé court" multiline />
            <InputField label="Contenu" value={postDraft.content} onChangeText={(content) => setPostDraft((draft) => ({ ...draft, content }))} placeholder="Contenu complet" multiline />
            <PrimaryButton title="Publier l'article" onPress={submitPost} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={!!reportDraft} animationType="slide" onRequestClose={() => setReportDraft(null)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, backgroundColor: "#FFFFFF" }}>
            <Text style={styles.sectionHeaderTitle}>Modifier le signalement</Text>
            <Pressable onPress={() => setReportDraft(null)}><Ionicons name="close-circle" size={28} color={colors.primaryDark} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
            <Text style={styles.bodyMuted}>Statut confirmé : {reportDraft?.status}</Text>
            <InputField label="Notes de modération" value={reportDraft?.adminNotes || ""} onChangeText={(adminNotes) => setReportDraft((draft) => ({ ...draft, adminNotes }))} placeholder="Notes internes..." multiline />
            <InputField label="Besoins couverts (séparés par des virgules)" value={(reportDraft?.fulfilledNeeds || []).join(", ")} onChangeText={(value) => setReportDraft((draft) => ({ ...draft, fulfilledNeeds: value.split(",").map((item) => item.trim()).filter(Boolean) }))} placeholder="food, shelter" />
            <PrimaryButton title="Enregistrer" onPress={saveReport} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
      <Modal visible={userComposerVisible} animationType="slide" onRequestClose={() => setUserComposerVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 18, backgroundColor: "#FFFFFF" }}>
            <Text style={styles.sectionHeaderTitle}>Créer un utilisateur</Text>
            <Pressable onPress={() => setUserComposerVisible(false)}><Ionicons name="close-circle" size={28} color={colors.primaryDark} /></Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 18, gap: 12 }}>
            <InputField label="E-mail" value={newUserDraft.email} onChangeText={(email) => setNewUserDraft((draft) => ({ ...draft, email }))} placeholder="email@exemple.fr" keyboardType="email-address" />
            <InputField label="Mot de passe" value={newUserDraft.password} onChangeText={(password) => setNewUserDraft((draft) => ({ ...draft, password }))} placeholder="8 caractères minimum" secureTextEntry />
            <View style={styles.filterChipsRow}>
              {["citizen", "association", "restaurant"].map((role) => (
                <Pressable key={role} onPress={() => setNewUserDraft((draft) => ({ ...draft, role }))} style={[styles.filterChipItem, newUserDraft.role === role && styles.filterChipItemActive]}>
                  <Text style={[styles.filterChipText, newUserDraft.role === role && styles.filterChipTextActive]}>{role}</Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton title="Créer l'utilisateur" onPress={createUser} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

/* ─────────────────────────────────────────────────────────────
   MODAL PROFIL & PARAMÈTRES (AVEC SUPPRESSION DE COMPTE)
───────────────────────────────────────────────────────────── */

function ProfileModal({ visible, user, updateUser, logout, close }) {
  const [subTab, setSubTab] = useState("info"); // "info" | "security" | "legal"
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const { keyboardHeight } = useKeyboard();
  const profileScrollRef = useRef(null);
  const profileFieldY = useRef({});

  const registerProfileLayout = (key) => (e) => {
    profileFieldY.current[key] = e.nativeEvent.layout.y;
  };

  const scrollToProfileField = (key) => {
    const y = profileFieldY.current[key];
    if (typeof y === "number" && profileScrollRef.current) {
      setTimeout(() => {
        profileScrollRef.current?.scrollTo({
          y: Math.max(0, y - 50),
          animated: true
        });
      }, 100);
    }
  };

  useEffect(() => {
    if (!visible) return;
    const handleBack = () => {
      if (privacyOpen) {
        setPrivacyOpen(false);
        return true;
      }
      if (deleteConfirm) {
        setDeleteConfirm(false);
        return true;
      }
      close();
      return true;
    };
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [visible, deleteConfirm, privacyOpen, close]);

  // Profil & Coordonnées
  const [email, setEmail] = useState(user.email || "");
  const [organizationName, setOrganizationName] = useState(user.organizationName || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [address, setAddress] = useState(user.address || "");
  const [radiusKm, setRadiusKm] = useState(user.interventionZone?.radiusKm ? String(user.interventionZone.radiusKm) : "15");
  const [helloAssoUrl, setHelloAssoUrl] = useState(user.helloAssoUrl || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Sécurité & Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Réinitialiser les champs quand l'utilisateur change ou quand la modale s'ouvre
  useEffect(() => {
    if (visible && user) {
      setEmail(user.email || "");
      setOrganizationName(user.organizationName || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setRadiusKm(user.interventionZone?.radiusKm ? String(user.interventionZone.radiusKm) : "15");
      setHelloAssoUrl(user.helloAssoUrl || "");
      setAvatarUrl(user.avatarUrl || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [visible, user]);

  // Choisir un avatar depuis la galerie
  const pickAvatar = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true
      });
      if (!res.canceled && res.assets?.[0]) {
        const asset = res.assets[0];
        const dataUri = asset.base64
          ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
          : asset.uri;
        setAvatarUrl(dataUri);
      }
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger l'image.");
    }
  };

  // Enregistrer le profil & les coordonnées
  const handleSaveProfile = async () => {
    if (!email.trim()) {
      Alert.alert("Champ obligatoire", "Veuillez renseigner une adresse email valide.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        email: email.trim(),
        organizationName: organizationName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        avatarUrl: avatarUrl || undefined
      };
      if (user.role === "association") {
        payload.radiusKm = Number(radiusKm) || 15;
        payload.helloAssoUrl = helloAssoUrl.trim();
      }
      const { data } = await api.patch("/auth/profile", payload);
      if (updateUser) {
        await updateUser(data.user);
      }
      Alert.alert("Succès", "Vos coordonnées et votre profil ont été mis à jour.");
    } catch (e) {
      Alert.alert("Erreur de mise à jour", errorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  // Modifier le mot de passe
  const handleSavePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Champ manquant", "Veuillez saisir votre mot de passe actuel.");
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert("Mot de passe trop court", "Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erreur", "La confirmation ne correspond pas au nouveau mot de passe.");
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch("/auth/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Succès", "Votre mot de passe a été modifié avec succès.");
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await api.delete("/auth/me");
      await logout();
      Alert.alert("Compte supprimé", "Votre compte, ses signalements et ses dons associés ont été supprimés.");
      close();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafeArea}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modalTopNav}>
            <Pressable onPress={close} style={styles.modalCloseBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.primaryDark} />
            </Pressable>
            <Text style={styles.modalHeaderTitle}>Mon compte & Paramètres</Text>
          </View>

          <ScrollView
            ref={profileScrollRef}
            contentContainerStyle={[
              styles.modalScrollBody,
              { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 60 }
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
          {/* Hero Profil avec Photo modifiable */}
          <View style={styles.profileHeroBox}>
            <View style={{ position: "relative" }}>
              <Pressable onPress={pickAvatar} style={styles.profileBigAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={{ width: 68, height: 68, borderRadius: 34 }} />
                ) : (
                  <Text style={styles.profileBigAvatarText}>
                    {(organizationName || user.organizationName || email).substring(0, 2).toUpperCase()}
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={pickAvatar}
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  backgroundColor: colors.primary,
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#FFFFFF"
                }}
              >
                <Ionicons name="camera" size={13} color="#FFFFFF" />
              </Pressable>
            </View>

            <Text style={styles.profileHeroName}>{organizationName || user.organizationName || email}</Text>
            <View style={styles.zoneBadge}>
              <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
              <Text style={styles.zoneBadgeText}>
                Compte {user.role === "association" ? "Association agréée" : user.role === "restaurant" ? "Commerce" : user.role === "admin" ? "Administrateur" : "Citoyen"} actif
              </Text>
            </View>
          </View>

          {/* Onglets de navigation dans le profil */}
          <View style={{ flexDirection: "row", gap: 6, marginVertical: 8, backgroundColor: "#E6F4EE", padding: 4, borderRadius: 14 }}>
            {[
              ["info", "Coordonnées", "person-outline"],
              ["security", "Sécurité", "lock-closed-outline"],
              ["legal", "RGPD & Compte", "shield-outline"]
            ].map(([id, label, icon]) => (
              <Pressable
                key={id}
                onPress={() => setSubTab(id)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 4,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: subTab === id ? "#FFFFFF" : "transparent",
                  shadowColor: subTab === id ? "#000" : "transparent",
                  shadowOpacity: subTab === id ? 0.06 : 0,
                  shadowRadius: 4,
                  elevation: subTab === id ? 1 : 0
                }}
              >
                <Ionicons name={icon} size={15} color={subTab === id ? colors.primaryDark : colors.textMuted} />
                <Text style={{ fontSize: 11, fontWeight: subTab === id ? "800" : "600", color: subTab === id ? colors.primaryDark : colors.textMuted }}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* ONGLET 1 : COORDONNÉES & INFOS */}
          {subTab === "info" && (
            <View style={{ gap: 14 }}>
              <InputField
                label="Adresse e-mail"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="votre.email@exemple.fr"
                keyboardType="email-address"
              />

              <InputField
                label={user.role === "association" ? "Nom de l'association" : user.role === "restaurant" ? "Nom de l'établissement" : "Nom ou Pseudo"}
                icon="person-outline"
                value={organizationName}
                onChangeText={setOrganizationName}
                placeholder="Ex : Croix-Rouge Paris 10 ou Jean Dupont"
              />

              <InputField
                label="Numéro de téléphone"
                icon="call-outline"
                value={phone}
                onChangeText={setPhone}
                placeholder="06 12 34 56 78"
                keyboardType="phone-pad"
              />

              <InputField
                label="Adresse postale / Siège"
                icon="location-outline"
                value={address}
                onChangeText={setAddress}
                placeholder="Ex : 12 rue de la Paix, 75002 Paris"
              />

              {user.role === "association" && (
                <>
                  <InputField
                    label="Rayon d'action opérationnel (km)"
                    icon="compass-outline"
                    value={radiusKm}
                    onChangeText={setRadiusKm}
                    placeholder="15"
                    keyboardType="numeric"
                  />
                  <InputField
                    label="Page de dons en ligne (HelloAsso / Site)"
                    icon="globe-outline"
                    value={helloAssoUrl}
                    onChangeText={setHelloAssoUrl}
                    placeholder="https://www.helloasso.com/associations/..."
                  />
                </>
              )}

              {user.sirenSiret && (
                <View style={{ backgroundColor: "#F8FAFC", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight }}>
                  <Text style={{ fontSize: 11, color: colors.textMuted, fontWeight: "700" }}>Numéro SIREN / SIRET (certifié)</Text>
                  <Text style={{ fontSize: 13, fontWeight: "800", color: colors.primaryDark, marginTop: 2 }}>{user.sirenSiret}</Text>
                </View>
              )}

              <PrimaryButton
                title={savingProfile ? "Enregistrement en cours…" : "Enregistrer mes coordonnées"}
                icon="save-outline"
                onPress={handleSaveProfile}
                disabled={savingProfile}
                style={{ marginTop: 6 }}
              />
            </View>
          )}

          {/* ONGLET 2 : SÉCURITÉ & MOT DE PASSE */}
          {subTab === "security" && (
            <View style={{ gap: 14 }}>
              <View style={{ backgroundColor: "#F0FDF4", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#BBF7D0", gap: 4 }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: "#166534" }}>🔒 Changement de mot de passe</Text>
                <Text style={{ fontSize: 11, color: "#15803D", lineHeight: 16 }}>
                  Pour des raisons de sécurité, votre nouveau mot de passe doit comporter au moins 8 caractères.
                </Text>
              </View>

              <InputField
                label="Mot de passe actuel"
                icon="key-outline"
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="Votre mot de passe actuel"
              />

              <InputField
                label="Nouveau mot de passe (min. 8 car.)"
                icon="lock-closed-outline"
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Nouveau mot de passe"
              />

              <InputField
                label="Confirmer le nouveau mot de passe"
                icon="checkmark-circle-outline"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Retapez le nouveau mot de passe"
              />

              <PrimaryButton
                title={savingPassword ? "Modification en cours…" : "Mettre à jour mon mot de passe"}
                icon="shield-checkmark-outline"
                onPress={handleSavePassword}
                disabled={savingPassword}
                style={{ marginTop: 6 }}
              />
            </View>
          )}

          {/* ONGLET 3 : LÉGAL & RGPD */}
          {subTab === "legal" && (
            <View style={{ gap: 12 }}>
              <Pressable onPress={() => setPrivacyOpen(true)} style={styles.settingsMenuBtn}>
                <Ionicons name="shield-outline" size={20} color={colors.primary} />
                <Text style={styles.settingsMenuBtnText}>Politique de Confidentialité (RGPD 2026)</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Pressable>

              <Pressable onPress={() => setDeleteConfirm(true)} style={styles.settingsMenuBtnDanger}>
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
                <Text style={styles.settingsMenuBtnTextDanger}>Supprimer mon compte et mes données</Text>
              </Pressable>
            </View>
          )}

          {/* Bouton de Déconnexion universel */}
          <PrimaryButton
            title="Déconnexion"
            variant="white"
            icon="log-out-outline"
            onPress={logout}
            style={{ marginTop: 24, marginBottom: 12 }}
          />
        </ScrollView>

        {/* Confirmation Modal Suppression */}
        {deleteConfirm && (
          <Modal transparent visible animationType="fade">
            <View style={styles.confirmOverlay}>
              <View style={styles.confirmBox}>
                <Ionicons name="alert-circle" size={44} color={colors.danger} />
                <Text style={styles.confirmBoxTitle}>Supprimer définitivement le compte ?</Text>
                <Text style={styles.confirmBoxText}>
                  Cette action est irréversible. L'ensemble de vos données, informations et signalements associés seront immédiatement supprimés conformément au RGPD.
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <Pressable onPress={() => setDeleteConfirm(false)} style={styles.backStepButton}>
                    <Text style={styles.backStepButtonText}>Annuler</Text>
                  </Pressable>
                  <View style={{ flex: 1 }}>
                    <PrimaryButton title="Confirmer la suppression" variant="danger" onPress={deleteAccount} />
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        )}

        <PrivacyModal visible={privacyOpen} close={() => setPrivacyOpen(false)} />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function PendingScreen({ user, logout }) {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <Ionicons name="time" size={60} color={colors.alert} />
      <Text style={styles.authTitle}>Compte en cours de vérification</Text>
      <Text style={[styles.authSubtitle, { textAlign: "center" }]}>
        Votre structure ({user.organizationName || user.email}) est en cours d'examen par notre équipe. Vous recevrez un e-mail dès validation.
      </Text>
      <PrimaryButton title="Déconnexion" variant="white" onPress={logout} />
    </SafeAreaView>
  );
}

function PrivacyModal({ visible, close }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.modalSafeArea}>
        <View style={styles.modalTopNav}>
          <Pressable onPress={close} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={24} color={colors.primaryDark} />
          </Pressable>
          <Text style={styles.modalHeaderTitle}>Politique de Confidentialité</Text>
        </View>
        <ScrollView contentContainerStyle={styles.modalScrollBody}>
          <Text style={styles.bodyMuted}>Conformité Google Play Console & RGPD 2026</Text>
          <View style={styles.kpiCard}>
            <Text style={styles.cardTitle}>1. Données collectées</Text>
            <Text style={styles.bodyMuted}>
              • Géolocalisation : utilisée uniquement lors d'un signalement ou pour définir la zone d'action associative. Aucun suivi en arrière-plan.{"\n"}
              • Caméra & Photos : utilisées facultativement pour illustrer une situation observée ou un don d'invendus.{"\n"}
              • Compte : e-mail, nom, téléphone, adresse et informations de structure. Les mots de passe sont hachés.
              • Signalements et dons : commentaires, photos facultatives, coordonnées et informations de prise en charge.
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.cardTitle}>2. Partage et protection</Text>
            <Text style={styles.bodyMuted}>
              Les signalements sont transmis aux associations qui leur sont affectées. Les informations de contact peuvent être partagées pour coordonner la prise en charge. Aucun SDK publicitaire n'est intégré au code examiné.
            </Text>
          </View>
          <View style={styles.kpiCard}>
            <Text style={styles.cardTitle}>3. Suppression de compte</Text>
            <Text style={styles.bodyMuted}>
              La suppression dans l'application efface votre compte, ses signalements et ses dons associés. Sur le Web, demandez un lien de confirmation envoyé à l'adresse du compte. Des journaux de sécurité anonymisés et des sauvegardes à durée limitée peuvent subsister.
            </Text>
          </View>
          <PrimaryButton title="Fermer" onPress={close} style={{ marginTop: 12 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   STYLES ET DESIGN SYSTEM DE HAUTE PRÉCISION
───────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  appContainer: {
    flex: 1,
    backgroundColor: Platform.OS === "web" ? "#EBF3EF" : colors.background,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0
  },
  mainShell: {
    flex: 1,
    width: "100%",
    backgroundColor: colors.background,
    position: "relative"
  },
  mainShellLarge: {
    maxWidth: 680,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    shadowColor: "#063D2E",
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8
  },
  content: {
    flex: 1,
    width: "100%",
    minHeight: 0,
    position: "relative"
  },
  scrollPage: {
    padding: 18,
    paddingBottom: Platform.select({ android: 125, ios: 125, default: 100 }),
    gap: 16,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center"
  },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, gap: 16, backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontSize: 14, fontWeight: "600" },

  // Brand Header
  brandContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandLogoBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden"
  },
  brandLogoImage: {
    width: 40,
    height: 40
  },
  brandText: { fontSize: 20, fontWeight: "900", color: colors.primaryDark, letterSpacing: 0.3 },
  brandTagline: { fontSize: 10, fontWeight: "700", color: colors.textMuted },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bellButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },

  // Hero Card Screen 1
  heroCard: {
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2
  },
  heroImageVisual: { width: "100%", height: 180, maxHeight: 220, resizeMode: "cover" },
  heroOverlay: { padding: 18, backgroundColor: "#FFFFFF", gap: 6 },
  heroMainTitle: { fontSize: 26, lineHeight: 32, fontWeight: "900", color: colors.primaryDark, letterSpacing: -0.4 },
  heroMainSubtitle: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },

  // CTAs
  ctaGroup: { gap: 10 },
  primaryButton: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    paddingHorizontal: 20,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2
  },
  buttonSecondary: { backgroundColor: colors.primaryDark },
  buttonWhite: { backgroundColor: "#FFFFFF", borderWidth: 1.5, borderColor: colors.primary },
  buttonDanger: { backgroundColor: colors.danger },
  buttonContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800", flex: 1, textAlign: "left" },
  buttonTextSecondary: { color: colors.primary },

  // 4 Feature Cards (Pastel Screen 1) - Responsive Flex Basis
  featureGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 10, columnGap: 8, justifyContent: "space-between" },
  featureCard: {
    width: "48%",
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minHeight: 96
  },
  featureIconCircle: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  featureCardTitle: { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  featureCardText: { fontSize: 11, color: colors.textSecondary, textAlign: "center" },

  // Banner
  bannerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.mintSoft,
    borderRadius: 18,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.mintSurface
  },
  bannerIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  bannerTitle: { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  bannerText: { fontSize: 11, color: colors.textSecondary },

  // Actualités
  newsCard: { width: 220, backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: colors.border, marginRight: 12 },
  newsImage: { width: "100%", height: 105, resizeMode: "cover" },
  newsCardTitle: { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  newsCardSummary: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  // Inputs
  inputGroup: { gap: 6 },
  inputLabel: { fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50
  },
  inputIcon: { marginRight: 10 },
  inputField: { flex: 1, fontSize: 14, color: colors.primaryDark, paddingVertical: 10 },
  eyeIcon: { padding: 4 },

  // KPI Grid - Responsive Flex Basis & Symmetrical Margins
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    columnGap: 8,
    marginVertical: 4
  },
  kpiCard: {
    width: "48%",
    minHeight: 124,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  kpiIconBox: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  kpiValue: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  kpiTitle: { fontSize: 13, fontWeight: "800", color: colors.primaryDark, marginTop: 4 },
  kpiSubtitle: { fontSize: 11, color: colors.textMuted, marginTop: 2 },

  // Welcome Hero
  welcomeHeroCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center"
  },
  welcomeHeroHello: { fontSize: 13, color: colors.textMuted, fontWeight: "700" },
  welcomeHeroName: { fontSize: 22, fontWeight: "900", color: colors.primaryDark },
  zoneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginTop: 6
  },
  zoneBadgeText: { fontSize: 11, fontWeight: "800", color: colors.primary },

  // Map Container
  mapContainer: {
    width: "100%",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  mapNativeCard: {
    backgroundColor: colors.mintSoft,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.mintSurface
  },

  // Priority Reports
  priorityCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    marginBottom: 10
  },
  priorityCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  urgencyDot: { width: 10, height: 10, borderRadius: 5 },
  priorityCardTitle: { fontSize: 14, fontWeight: "800", color: colors.primaryDark, flex: 1 },
  statusBadgeSmall: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusBadgeSmallText: { fontSize: 10, fontWeight: "800" },
  priorityCardAddress: { fontSize: 12, color: colors.textSecondary },
  priorityCardComment: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
  priorityCardActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionChipButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    alignSelf: "flex-start"
  },
  actionChipButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },

  // Citizen Action
  citizenActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 8
  },
  citizenActionTitle: { fontSize: 16, fontWeight: "900", color: colors.primaryDark },
  citizenActionText: { fontSize: 12, color: colors.textSecondary, textAlign: "center", lineHeight: 18 },

  // Modals & Stepper
  modalSafeArea: {
    flex: 1,
    backgroundColor: colors.background,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 28) : 0
  },
  modalTopNav: { flexDirection: "row", alignItems: "center", padding: 18, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: "#FFFFFF" },
  modalCloseBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  modalHeaderTitle: { fontSize: 18, fontWeight: "900", color: colors.primaryDark },
  modalHeaderSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalScrollBody: { padding: 20, gap: 18, paddingBottom: 40 },

  stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  stepCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.borderLight, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: colors.primary },
  stepNumber: { fontSize: 13, fontWeight: "800", color: colors.textMuted },
  stepNumberActive: { color: "#FFFFFF" },
  stepLine: { width: 50, height: 3, backgroundColor: colors.borderLight, marginHorizontal: 6 },
  stepLineActive: { backgroundColor: colors.primary },

  // Categories Grid (Screen 2 du Mockup) - Responsive Flex Basis
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryTile: {
    flexGrow: 1,
    flexBasis: "29%",
    minWidth: 92,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    minHeight: 84
  },
  categoryIconCircle: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  categoryTileText: { fontSize: 11, fontWeight: "800", color: colors.primaryDark, textAlign: "center" },

  // Urgency Selector - Responsive Flex Basis
  urgencyRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  urgencyOption: {
    flexGrow: 1,
    flexBasis: "29%",
    minWidth: 92,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    alignItems: "center"
  },
  urgencyOptionTitle: { fontSize: 12, fontWeight: "800" },
  urgencyOptionDesc: { fontSize: 9, color: colors.textMuted, textAlign: "center", marginTop: 2 },

  gpsSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    gap: 10
  },
  gpsIconCircle: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  gpsSelectText: { flex: 1, fontSize: 13, fontWeight: "700", color: colors.primaryDark },
  backStepButton: {
    minHeight: 52,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center"
  },
  backStepButtonText: { fontSize: 14, fontWeight: "800", color: colors.textSecondary },

  mediaButtonsRow: { flexDirection: "row", gap: 12 },
  mediaBtn: {
    flex: 1,
    minHeight: 64,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.primary,
    borderRadius: 14,
    backgroundColor: colors.mintSoft,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  mediaBtnText: { fontSize: 12, fontWeight: "800", color: colors.primary },
  imagePreviewWrap: { position: "relative", height: 160, borderRadius: 16, overflow: "hidden" },
  imagePreview: { width: "100%", height: "100%", resizeMode: "cover" },
  removeImageBadge: { position: "absolute", top: 8, right: 8, backgroundColor: colors.danger, borderRadius: 14, padding: 4 },
  summaryNotice: { flexDirection: "row", gap: 10, backgroundColor: colors.mintSoft, borderRadius: 14, padding: 12, alignItems: "center" },
  summaryNoticeText: { fontSize: 12, color: colors.primaryDark, flex: 1, lineHeight: 17 },

  // Auth Screen (Screen 3 Mockup)
  authTitle: { fontSize: 26, fontWeight: "900", color: colors.primaryDark, textAlign: "center" },
  authSubtitle: { fontSize: 13, color: colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: 12 },
  authTabs: { flexDirection: "row", backgroundColor: "#FFFFFF", borderRadius: 14, padding: 4, borderWidth: 1, borderColor: colors.border, marginBottom: 14 },
  authTabItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  authTabItemActive: { backgroundColor: colors.primary },
  authTabText: { fontSize: 13, fontWeight: "700", color: colors.textSecondary },
  authTabTextActive: { color: "#FFFFFF", fontWeight: "800" },
  rolePicker: { flexDirection: "row", gap: 8, marginTop: 6, flexWrap: "wrap" },
  roleChip: {
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 95,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border
  },
  roleChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  roleChipText: { fontSize: 11, fontWeight: "700", color: colors.primaryDark },
  roleChipTextActive: { color: "#FFFFFF" },
  backArrowBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, marginBottom: 6 },
  legalSmallLink: { fontSize: 11, color: colors.primary, textDecorationLine: "underline", textAlign: "center" },

  // Topbar
  topbarModern: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    maxWidth: 680,
    alignSelf: "center"
  },
  topbarRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  userProfilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.mintSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.mintSurface
  },
  userAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  userAvatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 11 },
  userNamePill: { fontSize: 12, fontWeight: "800", color: colors.primaryDark, maxWidth: 110 },
  userRolePill: { fontSize: 9, color: colors.primary, fontWeight: "700" },

  // Bottom Tab Bar (Match Mockup Style) - Responsive Spacing Android & iOS
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
    marginHorizontal: "auto",
    height: Platform.select({ android: 78, ios: 84, default: 72 }),
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: Platform.select({ android: 14, ios: 22, default: 8 }),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 100
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4
  },
  tabBarText: { fontSize: 10, color: colors.textMuted, fontWeight: "700" },
  tabBarTextActive: { color: colors.primary, fontWeight: "800" },
  centerFloatingButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -22,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8
  },

  // Map Filter Bar
  mapFilterBar: {
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center"
  },
  mapFilterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  mapFilterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  mapFilterChipText: { fontSize: 11, fontWeight: "700", color: colors.primaryDark },
  mapFilterChipTextActive: { color: "#FFFFFF" },

  // Report Items List
  sectionContainer: { gap: 12 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionHeaderTitle: { fontSize: 18, fontWeight: "900", color: colors.primaryDark },
  seeAllLink: { fontSize: 12, fontWeight: "800", color: colors.primary },
  smallAddBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  smallAddBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  filterChipsRow: { flexDirection: "row", gap: 8, marginVertical: 4, flexWrap: "wrap" },
  filterChipItem: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: colors.border },
  filterChipItemActive: { backgroundColor: colors.primaryDark, borderColor: colors.primaryDark },
  filterChipText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  filterChipTextActive: { color: "#FFFFFF" },

  reportItemCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 8 },
  reportCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reportItemTitle: { fontSize: 15, fontWeight: "800", color: colors.primaryDark },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: "800" },
  reportItemMeta: { fontSize: 12, color: colors.textMuted },
  reportItemComment: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  needsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  needTagPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.mintSoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  needTagText: { fontSize: 11, fontWeight: "700", color: colors.primary },
  imageCardWrapper: { position: "relative", width: "100%", height: 180, borderRadius: 14, overflow: "hidden", marginTop: 6 },
  reportCardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  priorityImageWrapper: { position: "relative", width: "100%", height: 130, borderRadius: 12, overflow: "hidden", marginBottom: 8 },
  priorityCardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  imageZoomBadge: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(6,61,46,0.85)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  imageZoomBadgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  reportActionRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  takeActionBtn: { flex: 1, backgroundColor: colors.mintSoft, paddingVertical: 10, minHeight: 44, justifyContent: "center", borderRadius: 10, alignItems: "center" },
  takeActionBtnText: { color: colors.primary, fontSize: 12, fontWeight: "800" },
  resolveActionBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 10, minHeight: 44, justifyContent: "center", borderRadius: 10, alignItems: "center" },
  resolveActionBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },

  // Donations
  donationCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 8, marginBottom: 10 },
  donationImageWrapper: { position: "relative", width: "100%", height: 180, borderRadius: 14, overflow: "hidden", marginBottom: 8 },
  donationCardImage: { width: "100%", height: "100%", resizeMode: "cover" },
  donationCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  donationIconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.mintSoft, alignItems: "center", justifyContent: "center" },
  donationTitle: { fontSize: 15, fontWeight: "800", color: colors.primaryDark },
  donationQty: { fontSize: 12, color: colors.primary, fontWeight: "700" },
  donationMeta: { fontSize: 12, color: colors.textMuted },

  // Lightbox Modal
  lightboxOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "space-between" },
  lightboxHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 18, paddingVertical: 14 },
  lightboxCloseBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  lightboxTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", flex: 1, textAlign: "center", marginHorizontal: 12 },
  lightboxBody: { flex: 1, justifyContent: "center", alignItems: "center", padding: 12 },
  lightboxImage: { width: "100%", height: "85%", resizeMode: "contain" },

  // Profile Modal
  profileHeroBox: { alignItems: "center", paddingVertical: 16, gap: 8 },
  profileBigAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  profileBigAvatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "900" },
  profileHeroName: { fontSize: 20, fontWeight: "900", color: colors.primaryDark },
  profileInfoList: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: colors.border, gap: 12, marginVertical: 10 },
  profileInfoRow: { gap: 2 },
  profileInfoLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  profileInfoValue: { fontSize: 14, fontWeight: "700", color: colors.primaryDark },
  settingsMenuBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border },
  settingsMenuBtnText: { flex: 1, fontSize: 13, fontWeight: "800", color: colors.primaryDark },
  settingsMenuBtnDanger: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FEF2F2", padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#FECACA", marginTop: 8 },
  settingsMenuBtnTextDanger: { fontSize: 13, fontWeight: "800", color: colors.danger },

  // Confirm Modal
  confirmOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24, alignItems: "center" },
  confirmBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 10,
    width: "100%",
    maxWidth: 480
  },
  confirmBoxTitle: { fontSize: 18, fontWeight: "900", color: colors.primaryDark, textAlign: "center" },
  confirmBoxText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 19 },

  // Common Helpers
  bodyMuted: { fontSize: 12, color: colors.textSecondary },
  emptyCard: { backgroundColor: "#FFFFFF", borderRadius: 18, padding: 24, alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border },
  emptyCardTitle: { fontSize: 16, fontWeight: "800", color: colors.primaryDark },
  legalFooterLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16 },
  legalFooterText: { fontSize: 12, color: colors.primary, fontWeight: "800", textDecorationLine: "underline" },
  formSectionLabel: { fontSize: 14, fontWeight: "900", color: colors.primaryDark },

  // Emergency Call Banner (Urgence médicale / 15 & 18)
  emergencyCallBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    padding: 14,
    gap: 8
  },
  emergencyCallHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  emergencyCallTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#991B1B"
  },
  emergencyCallText: {
    fontSize: 12,
    color: "#7F1D1D",
    lineHeight: 17
  },
  emergencyButtonsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4
  },
  emergencyBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12
  },
  emergencyBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800"
  },

  // Emergency Numbers Grid (Espace Citoyen)
  emergencyNumGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between"
  },
  emergencyNumCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 4,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  emergencyNumBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2
  },
  emergencyNumNumber: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.primaryDark
  },
  emergencyNumLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textPrimary
  },
  emergencyNumDesc: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center"
  }
});

