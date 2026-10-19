import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import heroImage from "../assets/sos-link-hero.png";

// Pour tester sur un téléphone, définissez EXPO_PUBLIC_API_URL avec l'IP du PC,
// par exemple http://192.168.1.20:5000/api (localhost vise le téléphone lui-même).
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000/api";
const api = axios.create({ baseURL: API_URL });
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("sos-link-token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const needs = ["food", "shelter", "health", "clothes", "hygiene", "psychological", "other"];
const labels = { food: "Alimentation", shelter: "Hébergement", health: "Soins", clothes: "Vêtements", hygiene: "Hygiène", psychological: "Soutien psychologique", other: "Autre" };
const needIcons = { food: "restaurant", shelter: "home", health: "medkit", clothes: "shirt", hygiene: "water", psychological: "heart", other: "add-circle" };
const statusLabels = { new: "Nouveau", in_progress: "En cours", resolved: "Résolu", removed: "Retiré", declared: "Déclaré", assigned: "Assigné", collected: "Collecté", cancelled: "Annulé" };
const services = needs.slice(0, -1);
const initialCoords = [2.3522, 48.8566];

function errorMessage(error) { return error.response?.data?.message || "Une erreur est survenue. Vérifiez la connexion au serveur."; }
function date(value) { return value ? new Date(value).toLocaleDateString("fr-FR") : "—"; }
function Button({ title, onPress, variant = "primary", disabled = false, icon }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.button, styles[`button_${variant}`], disabled && styles.disabled]}><View style={styles.buttonInside}>{icon && <Ionicons name={icon} size={16} color={variant === "secondary" ? colors.green : "#fff"}/>}<Text style={[styles.buttonText, variant === "secondary" && styles.buttonTextSecondary]}>{title}</Text></View></Pressable>; }
function Field({ label, value, onChangeText, placeholder, secureTextEntry, multiline, keyboardType = "default" }) { return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#8aa099" secureTextEntry={secureTextEntry} multiline={multiline} keyboardType={keyboardType} style={[styles.input, multiline && styles.textarea]}/></View>; }
function Toggle({ label, value, onValueChange }) { return <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#edf3ef" }}><Text style={styles.body}>{label}</Text><Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#cddbd5", true: "#8ccdb8" }} thumbColor={value ? colors.green : "#fff"}/></View>; }
function Chip({ title, selected, onPress, color }) { return <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: color || colors.green, borderColor: color || colors.green }]}><Text style={[styles.chipText, selected && { color: "#fff" }]}>{title}</Text></Pressable>; }
function NeedChip({ need, selected, onPress }) { return <Pressable onPress={onPress} style={[styles.chip, selected && { backgroundColor: colors.green, borderColor: colors.green }]}><View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Ionicons name={needIcons[need]} size={14} color={selected ? "#fff" : colors.green}/><Text style={[styles.chipText, selected && { color: "#fff" }]}>{labels[need]}</Text></View></Pressable>; }
function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }

export default function App() {
  const [session, setSession] = useState(null); const [ready, setReady] = useState(false);
  useEffect(() => { (async () => { const token = await AsyncStorage.getItem("sos-link-token"); const rawUser = await AsyncStorage.getItem("sos-link-user"); if (token && rawUser) { try { const { data } = await api.get("/auth/me"); setSession({ token, user: data.user }); await AsyncStorage.setItem("sos-link-user", JSON.stringify(data.user)); } catch { await AsyncStorage.multiRemove(["sos-link-token", "sos-link-user"]); } } setReady(true); })(); }, []);
  const login = async (data) => { await AsyncStorage.multiSet([["sos-link-token", data.token], ["sos-link-user", JSON.stringify(data.user)]]); setSession(data); };
  const logout = async () => { await AsyncStorage.multiRemove(["sos-link-token", "sos-link-user"]); setSession(null); };
  if (!ready) return <SafeAreaView style={styles.center}><Text>Chargement de SOS CONNECT…</Text></SafeAreaView>;
  return <SafeAreaView style={styles.app}><StatusBar barStyle="dark-content" backgroundColor="#F4F8F6"/>{session ? <PrivateApp session={session} logout={logout}/> : <PublicApp login={login}/>}</SafeAreaView>;
}

function PublicApp({ login }) {
  const [page, setPage] = useState("landing");
  return page === "auth" ? <AuthScreen login={login} back={() => setPage("landing")}/> : <Landing goAuth={() => setPage("auth")}/>;
}

function Landing({ goAuth }) {
  const [posts, setPosts] = useState([]);
  const [quick, setQuick] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  useEffect(() => { api.get("/blog").then(({ data }) => setPosts(data)).catch(() => {}); }, []);
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Ionicons name="people" size={23} color="#fff"/></View>
          <View>
            <Text style={styles.logo}>SOS CONNECT</Text>
            <Text style={styles.subtitle}>Solidarité · Orientation · Soutien</Text>
          </View>
          <Ionicons name="notifications-outline" size={22} color={colors.green} style={styles.heroBell}/>
        </View>
        <Image source={heroImage} style={styles.heroImage}/>
        <Text style={styles.heroTitle}>Signaler, orienter et agir ensemble.</Text>
        <Text style={styles.body}>Une plateforme qui relie citoyens, associations et commerçants solidaires.</Text>
        <Button title="Signalement rapide" icon="megaphone" onPress={() => setQuick(true)}/>
        <Button title="Connexion / Inscription" variant="secondary" icon="person" onPress={goAuth}/>
        <View style={styles.featureGrid}>
          <Feature icon="people" title="Associations" text="près de vous"/>
          <Feature icon="location" title="Carte" text="de votre zone"/>
          <Feature icon="heart" title="Soutien" text="et orientation"/>
          <Feature icon="chatbubble" title="Suivi" text="du signalement"/>
        </View>
      </View>
      <Section title="Comment ça marche">
        <Info title="1. Signalez" text="Décrivez une situation et sa localisation."/>
        <Info title="2. Les associations sont alertées" text="Les équipes locales reçoivent les signalements de leur zone."/>
        <Info title="3. Suivez l'action" text="La réponse est coordonnée depuis l'application."/>
      </Section>
      {posts.length > 0 && (
        <Section title="Actualités">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {posts.map(p => (
              <Card key={p._id} style={styles.post}>
                <Image source={{ uri: p.imageUrl }} style={styles.postImage}/>
                <Text style={styles.cardTitle}>{p.title}</Text>
                <Text style={styles.small}>{p.summary}</Text>
              </Card>
            ))}
          </ScrollView>
        </Section>
      )}
      <View style={{ alignItems: "center", paddingVertical: 14 }}>
        <Pressable onPress={() => setPrivacy(true)}>
          <Text style={[styles.small, { color: colors.green, textDecorationLine: "underline", fontWeight: "700" }]}>
            Politique de Confidentialité (Google Play & RGPD)
          </Text>
        </Pressable>
      </View>
      <QuickReport visible={quick} close={() => setQuick(false)}/>
      <PrivacyModal visible={privacy} close={() => setPrivacy(false)}/>
    </ScrollView>
  );
}
function Feature({ icon, title, text }) { return <View style={styles.feature}><Ionicons name={icon} size={21} color={colors.green}/><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureText}>{text}</Text></View>; }
function Info({ title, text }) { return <Card><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{text}</Text></Card>; }
function Section({ title, children }) { return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>; }

function AuthScreen({ login, back }) {
  const [mode, setMode] = useState("login"), [role, setRole] = useState("citizen"), [busy, setBusy] = useState(false), [coords, setCoords] = useState(initialCoords);
  const [form, setForm] = useState({ email: "", password: "", organizationName: "", sirenSiret: "", address: "", phone: "", radiusKm: "8", helloAssoUrl: "" });
  const [selectedServices, setSelectedServices] = useState([]);
  const [privacy, setPrivacy] = useState(false);
  const set = (key) => (value) => setForm(f => ({ ...f, [key]: value }));
  const locate = async () => { const permission = await Location.requestForegroundPermissionsAsync(); if (permission.status !== "granted") return Alert.alert("Localisation", "Autorisez la localisation pour remplir les coordonnées."); const p = await Location.getCurrentPositionAsync({}); setCoords([p.coords.longitude, p.coords.latitude]); Alert.alert("Position détectée"); };
  const submit = async () => {
    if (!form.email || !form.password) return Alert.alert("Champs requis", "Saisissez l'adresse e-mail et le mot de passe.");
    setBusy(true);
    try {
      let payload = { email: form.email, password: form.password };
      if (mode === "register") {
        payload = { ...payload, role, consentRgpd: true, organizationName: form.organizationName || undefined, sirenSiret: form.sirenSiret || undefined, address: form.address || undefined, phone: form.phone || undefined, helloAssoUrl: form.helloAssoUrl || undefined, services: role === "association" ? selectedServices : undefined, interventionZone: role === "citizen" ? undefined : { center: { coordinates: coords }, radiusKm: role === "association" ? Number(form.radiusKm || 8) : 0 } };
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
    <ScrollView contentContainerStyle={styles.page}>
      <Pressable onPress={back}><Text style={styles.link}>← Accueil</Text></Pressable>
      <Text style={styles.logo}>SOS CONNECT</Text>
      <View style={styles.tabs}>
        <Chip title="Connexion" selected={mode === "login"} onPress={() => setMode("login")}/>
        <Chip title="Inscription" selected={mode === "register"} onPress={() => setMode("register")}/>
      </View>
      {mode === "register" && (
        <>
          <Text style={styles.label}>Type de compte</Text>
          <View style={styles.wrap}>
            {[["citizen","Citoyen"],["association","Association"],["restaurant","Restaurateur"]].map(([id, name]) => (
              <Chip key={id} title={name} selected={role === id} onPress={() => setRole(id)}/>
            ))}
          </View>
        </>
      )}
      <Field label="Adresse e-mail" value={form.email} onChangeText={set("email")} keyboardType="email-address" placeholder="exemple@mail.com"/>
      <Field label="Mot de passe" value={form.password} onChangeText={set("password")} secureTextEntry placeholder="8 caractères minimum"/>
      {mode === "register" && role !== "citizen" && (
        <>
          <Field label="Nom de la structure" value={form.organizationName} onChangeText={set("organizationName")}/>
          <Field label="SIREN / SIRET" value={form.sirenSiret} onChangeText={set("sirenSiret")} keyboardType="numeric"/>
          <Field label="Adresse" value={form.address} onChangeText={set("address")}/>
          <Field label="Téléphone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad"/>
          <Button title="Utiliser ma position GPS" variant="secondary" icon="location" onPress={locate}/>
          {role === "association" && (
            <>
              <Field label="Rayon d'intervention (km)" value={form.radiusKm} onChangeText={set("radiusKm")} keyboardType="numeric"/>
              <Text style={styles.label}>Services proposés</Text>
              <View style={styles.wrap}>
                {services.map(s => (
                  <Chip key={s} title={labels[s]} selected={selectedServices.includes(s)} onPress={() => setSelectedServices(v => v.includes(s) ? v.filter(x => x !== s) : [...v, s])}/>
                ))}
              </View>
            </>
          )}
          <Field label="Lien HelloAsso (facultatif)" value={form.helloAssoUrl} onChangeText={set("helloAssoUrl")} placeholder="https://…"/>
        </>
      )}
      <Button title={busy ? "Veuillez patienter…" : mode === "login" ? "Se connecter" : "Créer mon compte"} disabled={busy} onPress={submit}/>
      <Pressable onPress={() => setPrivacy(true)} style={{ marginTop: 8, alignItems: "center" }}>
        <Text style={[styles.small, { color: colors.green, textDecorationLine: "underline" }]}>En continuant, vous acceptez notre Politique de Confidentialité (RGPD)</Text>
      </Pressable>
      <PrivacyModal visible={privacy} close={() => setPrivacy(false)}/>
    </ScrollView>
  );
}

function PrivateApp({ session, logout }) {
  const { user } = session;
  const [tab, setTab] = useState("home");
  const [deleteModal, setDeleteModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  if (["association", "restaurant"].includes(user.role) && user.status !== "active") return <Pending user={user} logout={logout}/>;
  const tabs = [
    { id: "home", label: "Accueil", icon: "home" },
    ...(user.role !== "restaurant" ? [{ id: "reports", label: "Signalements", icon: "map" }] : []),
    ...(user.role !== "citizen" ? [{ id: "donations", label: "Invendus", icon: "restaurant" }] : []),
    ...(user.role === "admin" ? [{ id: "admin", label: "Admin", icon: "shield" }] : [])
  ];
  return (
    <View style={styles.flex}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.topLogo}>SOS CONNECT</Text>
          <Text style={styles.small}>{user.organizationName || user.email}</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          <Pressable onPress={() => setPrivacyModal(true)}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.green}/>
          </Pressable>
          <Pressable onPress={logout}>
            <Ionicons name="log-out-outline" size={25} color={colors.green}/>
          </Pressable>
        </View>
      </View>
      <View style={styles.content}>
        {tab === "home" && <Home user={user}/>}
        {tab === "reports" && <Reports user={user}/>}
        {tab === "donations" && <Donations user={user}/>}
        {tab === "admin" && <Admin/>}
      </View>
      <View style={styles.nav}>
        {tabs.map(t => (
          <Pressable key={t.id} style={styles.navItem} onPress={() => setTab(t.id)}>
            <Ionicons name={t.icon} size={22} color={tab === t.id ? colors.green : "#71827b"}/>
            <Text style={[styles.navText, tab === t.id && styles.navTextActive]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={() => setDeleteModal(true)} style={{ paddingVertical: 6 }}>
        <Text style={styles.dangerLink}>Supprimer mon compte et mes données</Text>
      </Pressable>
      <Confirm
        visible={deleteModal}
        title="Supprimer mon compte"
        text="Cette action est irréversible. Votre compte, vos informations et les données associées seront définitivement supprimés."
        confirm={async () => {
          try {
            await api.delete("/auth/me");
            await logout();
            Alert.alert("Compte supprimé", "Votre compte et vos données ont été supprimés avec succès.");
          } catch (e) {
            Alert.alert("Erreur", errorMessage(e));
          }
        }}
        close={() => setDeleteModal(false)}
      />
      <PrivacyModal visible={privacyModal} close={() => setPrivacyModal(false)}/>
    </View>
  );
}
function Pending({ user, logout }) { return <View style={styles.center}><Ionicons name={user.status === "rejected" ? "close-circle" : "time"} color={user.status === "rejected" ? colors.red : colors.orange} size={54}/><Text style={styles.sectionTitle}>{user.status === "rejected" ? "Compte refusé" : "Compte en attente de validation"}</Text><Text style={styles.body}>{user.status === "rejected" ? "Contactez contact@soslink.fr si vous pensez qu'il s'agit d'une erreur." : "Votre structure est en cours d'examen. Vous recevrez un email après validation."}</Text><Button title="Déconnexion" onPress={logout}/></View>; }

function Home({ user }) { const [data, setData] = useState(null); useEffect(() => { const route = user.role === "admin" ? "/admin/dashboard" : user.role === "restaurant" ? "/donations" : "/reports"; api.get(route).then(r => setData(r.data)).catch(() => {}); }, []); return <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>Bonjour</Text><Text style={styles.body}>Bienvenue dans votre espace SOS CONNECT.</Text>{user.role === "admin" && data && <View style={styles.grid}>{[["Utilisateurs",data.users],["Organisations en attente",data.pendingOrganizations],["Signalements",data.reports],["Résolus",data.resolvedReports],["Dons",data.donations]].map(([k,v]) => <Card key={k} style={styles.metric}><Text style={styles.metricValue}>{v}</Text><Text style={styles.small}>{k}</Text></Card>)}</View>}{Array.isArray(data) && <Card><Text style={styles.cardTitle}>{data.length} élément(s) à traiter</Text><Text style={styles.small}>Ouvrez l'onglet correspondant pour consulter le détail.</Text></Card>}</ScrollView>; }

function Reports({ user }) {
  const [reports, setReports] = useState([]), [form, setForm] = useState(false), [filter, setFilter] = useState(""), [loading, setLoading] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { const qs = filter ? `?status=${filter}` : ""; const { data } = await api.get(`/reports${qs}`); setReports(data); } catch (e) { Alert.alert("Erreur", errorMessage(e)); } finally { setLoading(false); } }, [filter]); useEffect(() => { load(); }, [load]);
  return <ScrollView contentContainerStyle={styles.page}><View style={styles.rowBetween}><Text style={styles.sectionTitle}>Signalements</Text>{["citizen","admin"].includes(user.role) && <Button title="Nouveau" icon="add" onPress={() => setForm(true)}/>}</View><View style={styles.wrap}>{[["","Tous"],["new","Nouveaux"],["in_progress","En cours"],["resolved","Résolus"]].map(([id, title]) => <Chip key={title} title={title} selected={filter === id} onPress={() => setFilter(id)}/>)}</View>{loading ? <Text>Chargement…</Text> : reports.map(r => <ReportCard key={r._id} report={r} user={user} changed={load}/>) }{reports.length === 0 && <Text style={styles.small}>Aucun signalement.</Text>}<ReportForm visible={form} close={() => setForm(false)} created={load}/></ScrollView>;
}
function ReportCard({ report, user, changed }) { const [open, setOpen] = useState(false); const update = async (status) => { try { await api.patch(`/reports/${report._id}`, { status }); Alert.alert("Demande enregistrée"); changed(); } catch (e) { Alert.alert("Erreur", errorMessage(e)); } }; return <Card><Pressable onPress={() => setOpen(v => !v)}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{report.type === "group" ? "Groupe" : "Personne"} · {statusLabels[report.status]}</Text><Text style={[styles.urgency, { color: report.urgency === "red" ? colors.red : report.urgency === "yellow" ? colors.orange : colors.green }]}>{report.urgency?.toUpperCase()}</Text></View><Text style={styles.small}>{date(report.createdAt)} · {report.addressHint || "Position GPS"}</Text><Text style={styles.small}>{(report.needs || []).map(x => labels[x] || x).join(", ")}</Text>{report.comment && <Text style={styles.body}>{report.comment}</Text>}{report.imageUrl && <Image source={{ uri: report.imageUrl }} style={styles.reportImage}/>}</Pressable>{open && <><Text style={styles.small}>Coordonnées : {report.location?.coordinates?.join(", ")}</Text>{user.role === "association" && <View style={styles.wrap}>{["in_progress", "resolved", "removed"].map(s => <Chip key={s} title={statusLabels[s]} onPress={() => update(s)}/>)}</View>}{user.role === "admin" && report.pendingStatus?.status && <View style={styles.wrap}><Button title="Valider la demande" onPress={async () => { await api.patch(`/reports/${report._id}/confirm-status`, { action: "approve" }); changed(); }}/><Button title="Rejeter" variant="danger" onPress={async () => { await api.patch(`/reports/${report._id}/confirm-status`, { action: "reject" }); changed(); }}/></View>}</>}</Card>; }
function ReportForm({ visible, close, created }) {
  const [type, setType] = useState("individual"); const [addressHint, setAddress] = useState(""); const [comment, setComment] = useState(""); const [imageUrl, setImage] = useState(""); const [urgency, setUrgency] = useState("yellow"); const [chosen, setChosen] = useState([]); const [coords, setCoords] = useState(initialCoords); const [busy, setBusy] = useState(false);
  const [individual, setIndividual] = useState({ apparentGender: "unknown", ageRange: "30-40", languageBarrier: false, spokenToPerson: false, requestedHelp: false });
  const [group, setGroup] = useState({ peopleCount: "10", majorityGender: "mixed", averageAgeRange: "30-40" }); const [otherNeed, setOtherNeed] = useState("");
  const locate = async () => { const permission = await Location.requestForegroundPermissionsAsync(); if (permission.status !== "granted") return Alert.alert("Localisation non autorisée", "Saisissez un repère pour continuer."); const location = await Location.getCurrentPositionAsync({}); setCoords([location.coords.longitude, location.coords.latitude]); Alert.alert("Position ajoutée"); };
  const toggle = (need) => setChosen((value) => value.includes(need) ? value.filter((item) => item !== need) : [...value, need]);
  const send = async () => { setBusy(true); try { await api.post("/reports", { type, coordinates: coords, addressHint, comment, imageUrl: imageUrl || undefined, urgency, needs: chosen, otherNeed: otherNeed || undefined, individual: type === "individual" ? individual : undefined, group: type === "group" ? { ...group, peopleCount: Number(group.peopleCount || 0) } : undefined }); Alert.alert("Signalement envoyé", "Les associations de la zone ont été alertées."); close(); created(); } catch (error) { Alert.alert("Erreur", errorMessage(error)); } finally { setBusy(false); } };
  return <Modal visible={visible} animationType="slide"><SafeAreaView style={styles.app}><ScrollView contentContainerStyle={styles.page}><View style={styles.rowBetween}><Text style={styles.sectionTitle}>Nouveau signalement</Text><Pressable onPress={close}><Ionicons name="close" size={28}/></Pressable></View><Text style={styles.body}>Les informations sont transmises seulement aux associations de votre secteur.</Text><Text style={styles.label}>Type de signalement</Text><View style={styles.wrap}><Chip title="Personne seule" selected={type === "individual"} onPress={() => setType("individual")}/><Chip title="Groupe" selected={type === "group"} onPress={() => setType("group")}/></View><Button title="Utiliser ma position" variant="secondary" icon="location" onPress={locate}/><Field label="Adresse ou repère" value={addressHint} onChangeText={setAddress}/>{type === "individual" ? <><Text style={styles.label}>Sexe apparent</Text><View style={styles.wrap}>{[["male","Homme"],["female","Femme"],["unknown","Indéterminé"]].map(([id,title]) => <Chip key={id} title={title} selected={individual.apparentGender === id} onPress={() => setIndividual(v => ({ ...v, apparentGender: id }))}/>)}</View><Field label="Tranche d'âge estimée" value={individual.ageRange} onChangeText={(ageRange) => setIndividual(v => ({ ...v, ageRange }))} placeholder="ex. 30-40"/><Toggle label="Barrière de la langue" value={individual.languageBarrier} onValueChange={(languageBarrier) => setIndividual(v => ({ ...v, languageBarrier }))}/><Toggle label="Avez-vous parlé à la personne ?" value={individual.spokenToPerson} onValueChange={(spokenToPerson) => setIndividual(v => ({ ...v, spokenToPerson }))}/><Toggle label="La personne a demandé de l'aide ?" value={individual.requestedHelp} onValueChange={(requestedHelp) => setIndividual(v => ({ ...v, requestedHelp }))}/></> : <><Field label="Nombre de personnes estimé" value={group.peopleCount} keyboardType="numeric" onChangeText={(peopleCount) => setGroup(v => ({ ...v, peopleCount }))}/><Text style={styles.label}>Sexe majoritaire</Text><View style={styles.wrap}>{[["male","Hommes"],["female","Femmes"],["mixed","Mixte"]].map(([id,title]) => <Chip key={id} title={title} selected={group.majorityGender === id} onPress={() => setGroup(v => ({ ...v, majorityGender: id }))}/>)}</View><Field label="Tranche d'âge moyenne" value={group.averageAgeRange} onChangeText={(averageAgeRange) => setGroup(v => ({ ...v, averageAgeRange }))}/></>}<Text style={styles.label}>Besoins identifiés</Text><View style={styles.wrap}>{needs.map(need => <Chip key={need} title={labels[need]} selected={chosen.includes(need)} onPress={() => toggle(need)}/>)}</View>{chosen.includes("other") && <Field label="Autre besoin" value={otherNeed} onChangeText={setOtherNeed}/>}<Text style={styles.label}>Niveau d'urgence</Text><View style={styles.wrap}>{[["green","Vert"],["yellow","Jaune"],["red","Rouge"]].map(([id,title]) => <Chip key={id} title={title} color={id === "red" ? colors.red : id === "yellow" ? colors.orange : colors.green} selected={urgency === id} onPress={() => setUrgency(id)}/>)}</View>{urgency === "red" && <Text style={styles.emergency}>En cas de danger immédiat, appelez le 15 ou le 18.</Text>}<Field label="Commentaire" value={comment} onChangeText={setComment} multiline/><Field label="URL de la photo (facultatif)" value={imageUrl} onChangeText={setImage}/><Button title={busy ? "Envoi…" : "Envoyer le signalement"} disabled={busy} icon="send" onPress={send}/></ScrollView></SafeAreaView></Modal>;
}

function QuickReport({ visible, close }) {
  const [comment, setComment] = useState("");
  const [addressHint, setAddress] = useState("");
  const [imageData, setImageData] = useState("");
  const [urgency, setUrgency] = useState("yellow");
  const [chosen, setChosen] = useState(["food"]);
  const [coords, setCoords] = useState(initialCoords);
  const [busy, setBusy] = useState(false);
  const toggleNeed = (need) => setChosen((value) => value.includes(need) ? value.filter((item) => item !== need) : [...value, need]);
  const send = async () => {
    if (!comment.trim()) return Alert.alert("Description requise", "Décrivez brièvement la situation observée.");
    setBusy(true);
    try {
      let reportCoords = coords;
      const p = await Location.requestForegroundPermissionsAsync();
      if (p.status === "granted") {
        const l = await Location.getCurrentPositionAsync({});
        reportCoords = [l.coords.longitude, l.coords.latitude];
        setCoords(reportCoords);
      }
      await api.post("/reports/quick", { coordinates: reportCoords, comment: comment.trim(), addressHint: addressHint.trim() || undefined, imageUrl: imageData || undefined, urgency, needs: chosen });
      Alert.alert("Merci", "Le signalement a été transmis aux associations concernées.");
      close();
    } catch (e) {
      Alert.alert("Erreur", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert("Permission requise", "Autorisez l'accès aux photos pour ajouter une image.");
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.7,
      base64: true
    });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      setImageData(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
    }
  };
  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert("Permission requise", "Autorisez la caméra pour prendre une photo.");
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7, base64: true });
    if (!result.canceled && result.assets?.[0]?.base64) {
      const asset = result.assets[0];
      setImageData(`data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`);
    }
  };
  return <Modal visible={visible} animationType="slide"><SafeAreaView style={styles.quickModal}><ScrollView contentContainerStyle={styles.quickPage}>
    <View style={styles.rowBetween}><View><Text style={styles.quickTitle}>Signalement rapide</Text><Text style={styles.quickIntro}>Vous pouvez signaler une situation sans créer de compte.</Text></View><Pressable onPress={close} style={styles.quickClose}><Ionicons name="close" size={25} color="#063D2E"/></Pressable></View>
    <Field label="Adresse ou repère" value={addressHint} onChangeText={setAddress} placeholder="Ex. devant la gare, rue Victor Hugo..." />
    <Field label="Description de la situation" value={comment} onChangeText={setComment} placeholder="Décrivez ce que vous observez : homme seul, famille, besoin visible d'une couverture..." multiline />
    <View style={styles.quickBlock}><Text style={styles.quickLabel}>Ajouter une photo (optionnel)</Text><View style={styles.photoActions}><Pressable style={styles.photoButton} onPress={takePhoto}><Ionicons name="camera-outline" size={22} color={colors.green}/><Text style={styles.photoButtonText}>Prendre une photo</Text></Pressable><Pressable style={styles.photoButton} onPress={pickImage}><Ionicons name="images-outline" size={22} color={colors.green}/><Text style={styles.photoButtonText}>Choisir une image</Text></Pressable></View>{imageData && <View style={styles.photoPreview}><Image source={{ uri: imageData }} style={styles.photoPreviewImage}/><Pressable style={styles.photoRemove} onPress={() => setImageData("")}><Ionicons name="close-circle" size={25} color={colors.red}/></Pressable></View>}</View>
    <View style={styles.quickBlock}><Text style={styles.quickLabel}>Besoins observés</Text><View style={styles.wrap}>{needs.map((need) => <Chip key={need} title={`${chosen.includes(need) ? "✓ " : ""}${labels[need]}`} selected={chosen.includes(need)} onPress={() => toggleNeed(need)} />)}</View></View>
    <View style={styles.quickBlock}><Text style={styles.quickLabel}>Niveau d'urgence</Text><View style={styles.quickUrgencies}>{[["green","Stable","Pas de danger immédiat"],["yellow","Important","Intervention rapide requise"],["red","Critique","Urgence médicale / détresse"]].map(([id,title,description]) => <Pressable key={id} onPress={() => setUrgency(id)} style={[styles.quickUrgency, urgency === id && styles.quickUrgencySelected, id === "red" && urgency === id && styles.quickUrgencyRed]}><Text style={[styles.quickUrgencyTitle, urgency === id && styles.quickUrgencyTitleSelected]}>{title}</Text><Text style={styles.quickUrgencyText}>{description}</Text></Pressable>)}</View></View>
    <View style={styles.quickActions}><Button title="Annuler" variant="secondary" onPress={close}/><Button title={busy ? "Envoi…" : "Envoyer le signalement"} icon="send" disabled={busy} onPress={send}/></View>
  </ScrollView></SafeAreaView></Modal>;
}

function Donations({ user }) { const [items, setItems] = useState([]), [summary, setSummary] = useState(null), [form, setForm] = useState(false); const year = new Date().getFullYear(); const load = useCallback(async () => { try { const results = await Promise.all([api.get("/donations"), api.get(`/donations/annual-summary/${year}`).catch(() => ({ data: null }))]); setItems(results[0].data); setSummary(results[1].data); } catch (e) { Alert.alert("Erreur", errorMessage(e)); } }, []); useEffect(() => { load(); }, [load]); return <ScrollView contentContainerStyle={styles.page}><View style={styles.rowBetween}><Text style={styles.sectionTitle}>Invendus alimentaires</Text>{user.role === "restaurant" && <Button title="Déclarer" icon="add" onPress={() => setForm(true)}/>}</View>{summary && <Card><Text style={styles.cardTitle}>Bilan {year}</Text><Text style={styles.body}>{summary.donationCount || 0} don(s) · {summary.totalValueEur || 0} € valorisés</Text></Card>}{items.map(d => <Card key={d._id}><Text style={styles.cardTitle}>{d.description}</Text><Text style={styles.body}>{d.quantity} · disponible le {date(d.availableDate)}</Text><Text style={styles.small}>{statusLabels[d.status]}{d.restaurant?.organizationName ? ` · ${d.restaurant.organizationName}` : ""}</Text>{d.pickupSlots?.map((p,i) => <Text key={i} style={styles.small}>Retrait : {p.start} - {p.end}</Text>)}{user.role === "association" && d.status === "assigned" && <Button title="Marquer comme collecté" onPress={async () => { await api.patch(`/donations/${d._id}/status`, { status: "collected" }); load(); }}/>}</Card>)}{items.length === 0 && <Text style={styles.small}>Aucun don.</Text>}<DonationForm visible={form} close={() => setForm(false)} created={load}/></ScrollView>; }
function DonationForm({ visible, close, created }) { const [description, setDescription] = useState(""), [quantity, setQuantity] = useState(""), [availableDate, setDate] = useState(new Date().toISOString()), [photoUrl, setPhoto] = useState(""), [start, setStart] = useState(""), [end, setEnd] = useState(""); const send = async () => { try { await api.post("/donations", { description, quantity, availableDate, photoUrl: photoUrl || undefined, pickupSlots: start && end ? [{ start, end }] : [] }); Alert.alert("Don déclaré"); close(); created(); } catch (e) { Alert.alert("Erreur", errorMessage(e)); } }; return <Modal visible={visible} animationType="slide"><SafeAreaView style={styles.app}><ScrollView contentContainerStyle={styles.page}><View style={styles.rowBetween}><Text style={styles.sectionTitle}>Nouveau don</Text><Pressable onPress={close}><Ionicons name="close" size={28}/></Pressable></View><Field label="Description" value={description} onChangeText={setDescription} multiline/><Field label="Quantité" value={quantity} onChangeText={setQuantity} placeholder="ex. 20 repas"/><Field label="Date disponible (ISO)" value={availableDate} onChangeText={setDate}/><Field label="URL de photo" value={photoUrl} onChangeText={setPhoto}/><Field label="Début du créneau" value={start} onChangeText={setStart} placeholder="18:00"/><Field label="Fin du créneau" value={end} onChangeText={setEnd} placeholder="20:00"/><Button title="Publier le don" onPress={send}/></ScrollView></SafeAreaView></Modal>; }

function Admin() { const [view, setView] = useState("dashboard"); return <ScrollView contentContainerStyle={styles.page}><Text style={styles.sectionTitle}>Administration</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.wrap}>{[["dashboard","Vue d'ensemble"],["users","Utilisateurs"],["reports","Signalements"],["donations","Dons"],["blog","Blog"]].map(([id,t]) => <Chip key={id} title={t} selected={view === id} onPress={() => setView(id)}/>)}</View></ScrollView>{view === "dashboard" && <AdminDashboard/>}{view === "users" && <AdminUsers/>}{view === "reports" && <AdminReports/>}{view === "donations" && <AdminDonations/>}{view === "blog" && <AdminBlog/>}</ScrollView>; }
function AdminDashboard() { const [d,setD] = useState(null),[pending,setPending]=useState([]); const load=useCallback(async()=>{const r=await Promise.all([api.get("/admin/dashboard"),api.get("/admin/organizations/pending")]);setD(r[0].data);setPending(r[1].data);},[]);useEffect(()=>{load();},[load]);return <>{d&&<View style={styles.grid}>{Object.entries(d).map(([k,v])=><Card key={k} style={styles.metric}><Text style={styles.metricValue}>{v}</Text><Text style={styles.small}>{k}</Text></Card>)}</View>}<Text style={styles.cardTitle}>Organisations en attente</Text>{pending.map(x=><Card key={x._id}><Text style={styles.cardTitle}>{x.organizationName || x.email}</Text><Text style={styles.small}>{x.role} · {x.email}</Text><View style={styles.wrap}><Button title="Valider" onPress={async()=>{await api.patch(`/admin/organizations/${x._id}/status`,{status:"active"});load();}}/><Button title="Refuser" variant="danger" onPress={async()=>{await api.patch(`/admin/organizations/${x._id}/status`,{status:"rejected"});load();}}/></View></Card>)}</>; }
function AdminUsers() { const [data,setData]=useState([]); const load=useCallback(()=>api.get("/admin/users").then(r=>setData(r.data)),[]);useEffect(()=>{load();},[load]);return <>{data.map(x=><Card key={x._id}><Text style={styles.cardTitle}>{x.organizationName || x.email}</Text><Text style={styles.small}>{x.role} · {x.status} · {x.email}</Text><Button title="Supprimer" variant="danger" onPress={()=>Alert.alert("Supprimer", "Supprimer cet utilisateur ?", [{text:"Annuler"},{text:"Supprimer",style:"destructive",onPress:async()=>{await api.delete(`/admin/users/${x._id}`);load();}}])}/></Card>)}</>; }
function AdminReports() { const [data,setData]=useState([]); const load=useCallback(()=>api.get("/admin/reports").then(r=>setData(r.data)),[]);useEffect(()=>{load();},[load]);return <>{data.map(x=><Card key={x._id}><Text style={styles.cardTitle}>{x.type} · {statusLabels[x.status]}</Text><Text style={styles.small}>{x.addressHint} · {date(x.createdAt)}</Text><View style={styles.wrap}>{["new","in_progress","resolved","removed"].map(s=><Chip key={s} title={statusLabels[s]} selected={x.status===s} onPress={async()=>{await api.patch(`/reports/${x._id}`,{status:s});load();}}/>)}<Button title="Supprimer" variant="danger" onPress={async()=>{await api.delete(`/reports/${x._id}`);load();}}/></View></Card>)}</>; }
function AdminDonations() { const [data,setData]=useState([]),[restaurants,setRestaurants]=useState([]);const y=new Date().getFullYear();useEffect(()=>{Promise.all([api.get(`/admin/donations?year=${y}`),api.get("/admin/users?role=restaurant&status=active")]).then(([d,r])=>{setData(d.data);setRestaurants(r.data);});},[]);return <><Text style={styles.cardTitle}>Valorisation IA</Text>{data.map(x=><Card key={x._id}><Text style={styles.cardTitle}>{x.description}</Text><Text style={styles.body}>{x.quantity} · {x.valuation?.estimatedValueEur || 0} €</Text><Text style={styles.small}>{x.restaurant?.organizationName || x.restaurant?.email}</Text></Card>)}<Text style={styles.cardTitle}>Reçus fiscaux {y}</Text>{restaurants.map(r=><Card key={r._id}><Text style={styles.cardTitle}>{r.organizationName || r.email}</Text><Text style={styles.small}>{r.email}</Text><Button title="Envoyer le reçu fiscal" onPress={async()=>{try{const {data:receipt}=await api.post(`/admin/donations/${r._id}/fiscal-receipt/${y}`);Alert.alert("Reçu envoyé", `${receipt.donationCount} don(s) · ${receipt.totalValueEur} €`);}catch(e){Alert.alert("Erreur",errorMessage(e));}}}/></Card>)}</>; }
function AdminBlog() { const [posts,setPosts]=useState([]),[show,setShow]=useState(false),[f,setF]=useState({title:"",summary:"",content:"",imageUrl:"",category:"Actualité",author:"Équipe SOS CONNECT"});const load=useCallback(()=>api.get("/blog").then(r=>setPosts(r.data)),[]);useEffect(()=>{load();},[load]);const set=k=>v=>setF(q=>({...q,[k]:v}));return <><Button title={show?"Fermer":"Créer un article"} onPress={()=>setShow(x=>!x)}/>{show&&<Card><Field label="Titre" value={f.title} onChangeText={set("title")}/><Field label="Résumé" value={f.summary} onChangeText={set("summary")} multiline/><Field label="Contenu" value={f.content} onChangeText={set("content")} multiline/><Field label="Image URL" value={f.imageUrl} onChangeText={set("imageUrl")}/><Field label="Catégorie" value={f.category} onChangeText={set("category")}/><Field label="Auteur" value={f.author} onChangeText={set("author")}/><Button title="Publier" onPress={async()=>{try{await api.post("/blog",f);setShow(false);load();}catch(e){Alert.alert("Erreur",errorMessage(e));}}}/></Card>}{posts.map(p=><Card key={p._id}><Text style={styles.cardTitle}>{p.title}</Text><Text style={styles.small}>{p.category} · {p.author}</Text><Button title="Supprimer" variant="danger" onPress={async()=>{await api.delete(`/blog/${p._id}`);load();}}/></Card>)}</>; }

function PrivacyModal({ visible, close }) {
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={styles.app}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Confidentialité (RGPD)</Text>
            <Pressable onPress={close}><Ionicons name="close" size={28} color="#16352a"/></Pressable>
          </View>
          <Text style={styles.small}>SOS CONNECT · Conformité Google Play Console & RGPD 2026</Text>
          <Card>
            <Text style={styles.cardTitle}>1. Données collectées</Text>
            <Text style={styles.body}>• Géolocalisation : utilisée uniquement lors d'un signalement ou de l'inscription pour situer la zone d'intervention. Aucun suivi en arrière-plan.{"\n"}• Appareil photo et Photos : utilisé facultativement pour photographier ou joindre une image au signalement.{"\n"}• Compte : email et informations d'identification strictement nécessaires.</Text>
          </Card>
          <Card>
            <Text style={styles.cardTitle}>2. Utilisation solidaire & Partage</Text>
            <Text style={styles.body}>Vos données ne sont ni vendues, ni louées, ni cédées à des régies publicitaires. Les signalements sont uniquement orientés vers les associations et partenaires humanitaires de votre secteur.</Text>
          </Card>
          <Card>
            <Text style={styles.cardTitle}>3. Suppression du compte et des données</Text>
            <Text style={styles.body}>Conformément aux normes Google Play et au RGPD, vous disposez d'un droit de suppression total et irréversible de votre compte et de toutes vos données directement dans l'application (« Supprimer mon compte ») ou par formulaire web sur notre site officiel.</Text>
          </Card>
          <Button title="Fermer" onPress={close}/>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Confirm({ visible, title, text, confirm, close }) { return <Modal transparent visible={visible} animationType="fade"><View style={styles.overlay}><Card><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.body}>{text}</Text><View style={styles.wrap}><Button title="Annuler" variant="secondary" onPress={close}/><Button title="Confirmer" variant="danger" onPress={confirm}/></View></Card></View></Modal>; }

const colors={green:"#0F7D63",orange:"#F59E0B",red:"#DC2626"};
const styles=StyleSheet.create({app:{flex:1,backgroundColor:"#f5faf7"},flex:{flex:1},center:{flex:1,justifyContent:"center",alignItems:"center",padding:28,gap:16,backgroundColor:"#f5faf7"},content:{flex:1},page:{padding:18,gap:14,paddingBottom:32},hero:{paddingVertical:38,gap:15},logo:{fontSize:22,fontWeight:"900",color:colors.green,letterSpacing:.5},topLogo:{fontSize:16,fontWeight:"900",color:colors.green},subtitle:{color:"#63786f",fontSize:13},heroTitle:{fontSize:37,lineHeight:43,fontWeight:"900",color:"#16352a"},section:{gap:12,marginTop:8},sectionTitle:{fontSize:24,fontWeight:"800",color:"#16352a"},card:{backgroundColor:"#fff",borderColor:"#dbe9e3",borderWidth:1,borderRadius:14,padding:15,gap:8,marginBottom:1},voiceCard:{backgroundColor:"#edf8f3"},cardTitle:{fontSize:16,fontWeight:"800",color:"#16352a"},body:{fontSize:14,lineHeight:21,color:"#456158"},small:{fontSize:12,lineHeight:18,color:"#667d74"},button:{minHeight:43,borderRadius:10,justifyContent:"center",paddingHorizontal:15,alignSelf:"flex-start"},buttonInside:{flexDirection:"row",alignItems:"center",gap:7},button_primary:{backgroundColor:colors.green},button_secondary:{backgroundColor:"#fff",borderColor:colors.green,borderWidth:1},button_danger:{backgroundColor:colors.red},buttonText:{color:"#fff",fontWeight:"800",fontSize:14},buttonTextSecondary:{color:colors.green},disabled:{opacity:.55},field:{gap:6},label:{fontSize:13,fontWeight:"800",color:"#36564a",marginTop:4},input:{backgroundColor:"#fff",borderColor:"#cfe0d9",borderWidth:1,borderRadius:10,paddingHorizontal:12,paddingVertical:11,fontSize:15,color:"#17352a"},textarea:{minHeight:92,textAlignVertical:"top"},tabs:{flexDirection:"row",gap:8,marginVertical:8},wrap:{flexDirection:"row",gap:8,flexWrap:"wrap",alignItems:"center"},chip:{borderWidth:1,borderColor:"#c7dcd3",backgroundColor:"#fff",paddingHorizontal:11,paddingVertical:8,borderRadius:20},chipText:{fontWeight:"700",fontSize:12,color:"#426258"},topbar:{paddingHorizontal:18,paddingVertical:12,backgroundColor:"#fff",borderBottomWidth:1,borderBottomColor:"#dbe9e3",flexDirection:"row",justifyContent:"space-between",alignItems:"center"},nav:{height:64,backgroundColor:"#fff",borderTopColor:"#dbe9e3",borderTopWidth:1,flexDirection:"row",justifyContent:"space-around"},navItem:{alignItems:"center",justifyContent:"center",gap:3,paddingHorizontal:7},navText:{fontSize:10,color:"#71827b",fontWeight:"700"},navTextActive:{color:colors.green},dangerLink:{color:colors.red,textAlign:"center",fontSize:12,padding:7,fontWeight:"700"},rowBetween:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},metric:{width:"47%"},metricValue:{fontSize:28,fontWeight:"900",color:colors.green},urgency:{fontSize:11,fontWeight:"900"},reportImage:{width:"100%",height:150,borderRadius:9,marginTop:4},post:{width:245,marginRight:12},postImage:{height:110,borderRadius:9,backgroundColor:"#e5eee9"},overlay:{flex:1,backgroundColor:"rgba(0,0,0,.42)",padding:25,justifyContent:"center"}});
styles.link = { color: colors.green, fontWeight: "800", fontSize: 13, marginBottom: 8 };
styles.brandRow = { flexDirection: "row", alignItems: "center", gap: 10 };
styles.brandMark = { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.green, alignItems: "center", justifyContent: "center", shadowColor: colors.green, shadowOpacity: 0.22, shadowRadius: 12, elevation: 4 };
styles.heroImage = { width: "100%", height: 215, borderRadius: 24, resizeMode: "cover", marginTop: 4 };
styles.app = { flex: 1, backgroundColor: "#F4FAF8" };
styles.page = { padding: 20, gap: 16, paddingBottom: 34, backgroundColor: "#F4FAF8" };
styles.hero = { paddingVertical: 18, gap: 16 };
styles.logo = { fontSize: 22, fontWeight: "900", color: "#063D2E", letterSpacing: 0.4 };
styles.subtitle = { color: "#6B8179", fontSize: 11, marginTop: 2 };
styles.heroTitle = { fontSize: 34, lineHeight: 39, fontWeight: "900", color: "#063D2E", letterSpacing: -0.5 };
styles.heroImage = { width: "100%", height: 205, borderRadius: 24, resizeMode: "cover", marginTop: 2 };
styles.heroBell = { marginLeft: "auto", alignSelf: "flex-start", marginTop: 8 };
styles.button = { minHeight: 50, borderRadius: 14, justifyContent: "center", paddingHorizontal: 18, alignSelf: "stretch", shadowColor: colors.green, shadowOpacity: 0.14, shadowRadius: 8, elevation: 2 };
styles.button_primary = { backgroundColor: colors.green };
styles.button_secondary = { backgroundColor: "#FFFFFF", borderColor: colors.green, borderWidth: 1 };
styles.buttonText = { color: "#FFFFFF", fontWeight: "800", fontSize: 14 };
styles.buttonTextSecondary = { color: "#08745A" };
styles.section = { gap: 12, marginTop: 8 };
styles.sectionTitle = { fontSize: 22, fontWeight: "900", color: "#063D2E", letterSpacing: -0.2 };
styles.card = { backgroundColor: "#FFFFFF", borderColor: "#DCEBE5", borderWidth: 1, borderRadius: 16, padding: 16, gap: 8, marginBottom: 1, shadowColor: "#063D2E", shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 };
styles.cardTitle = { fontSize: 15, fontWeight: "800", color: "#063D2E" };
styles.body = { fontSize: 14, lineHeight: 21, color: "#46665D" };
styles.small = { fontSize: 12, lineHeight: 18, color: "#718A83" };
styles.featureGrid = { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 };
styles.feature = { width: "47.5%", minHeight: 92, alignItems: "center", justifyContent: "center", padding: 10, backgroundColor: "#E8F6F1", borderRadius: 16, gap: 3 };
styles.featureTitle = { fontSize: 12, fontWeight: "800", color: "#063D2E" };
styles.featureText = { fontSize: 10, color: "#6B8179", textAlign: "center" };
styles.topbar = { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#DCEBE5", flexDirection: "row", justifyContent: "space-between", alignItems: "center" };
styles.topLogo = { fontSize: 17, fontWeight: "900", color: "#063D2E", letterSpacing: 0.2 };
styles.nav = { height: 70, backgroundColor: "#FFFFFF", borderTopColor: "#DCEBE5", borderTopWidth: 1, flexDirection: "row", justifyContent: "space-around", paddingTop: 5 };
styles.navItem = { alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 7, minWidth: 62 };
styles.navText = { fontSize: 10, color: "#718A83", fontWeight: "700" };
styles.navTextActive = { color: colors.green };
styles.input = { backgroundColor: "#FFFFFF", borderColor: "#DCEBE5", borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#17352A" };
styles.label = { fontSize: 12, fontWeight: "800", color: "#36564A", marginTop: 4 };
styles.chip = { borderWidth: 1, borderColor: "#CDE4DB", backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 9, borderRadius: 20 };
styles.quickModal = { flex: 1, backgroundColor: "#F4FAF8" };
styles.quickPage = { padding: 20, gap: 14, paddingBottom: 28 };
styles.quickTitle = { fontSize: 22, fontWeight: "900", color: "#063D2E" };
styles.quickIntro = { fontSize: 13, color: "#46665D", marginTop: 6 };
styles.quickClose = { padding: 4, marginLeft: 8 };
styles.quickBlock = { gap: 7 };
styles.quickLabel = { fontSize: 13, fontWeight: "900", color: "#063D2E" };
styles.quickUrgencies = { flexDirection: "row", gap: 8 };
styles.quickUrgency = { flex: 1, minHeight: 72, padding: 9, borderRadius: 13, borderWidth: 1, borderColor: "#DCEBE5", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" };
styles.quickUrgencySelected = { backgroundColor: "#0F7D63", borderColor: "#0F7D63" };
styles.quickUrgencyRed = { backgroundColor: "#FEE2E2", borderColor: "#FECACA" };
styles.quickUrgencyTitle = { fontSize: 13, fontWeight: "900", color: "#063D2E" };
styles.quickUrgencyTitleSelected = { color: "#FFFFFF" };
styles.quickUrgencyText = { fontSize: 9, color: "#718A83", textAlign: "center", marginTop: 3 };
styles.quickActions = { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 2 };
styles.photoActions = { flexDirection: "row", gap: 10 };
styles.photoButton = { flex: 1, minHeight: 74, borderWidth: 1, borderStyle: "dashed", borderColor: "#B9DDD2", borderRadius: 14, backgroundColor: "#F8FCFA", alignItems: "center", justifyContent: "center", gap: 5, padding: 8 };
styles.photoButtonText = { color: "#08745A", fontSize: 12, fontWeight: "800", textAlign: "center" };
styles.photoPreview = { height: 150, marginTop: 8, borderRadius: 14, overflow: "hidden", position: "relative", backgroundColor: "#E8F7F2" };
styles.photoPreviewImage = { width: "100%", height: "100%", resizeMode: "cover" };
styles.photoRemove = { position: "absolute", top: 8, right: 8, backgroundColor: "#FFFFFF", borderRadius: 20 };
