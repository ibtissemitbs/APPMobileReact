import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firebase from "../../Config";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { Ionicons } from "@expo/vector-icons";
import { useAppSettings } from "../../Config/appSettings";

const auth = firebase.auth();
const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");

export default function MyAccount(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const ref = userid ? ref_all_accounts.child(userid) : null;

  const [Nom, setNom] = useState("");
  const [Pseudo, setPseudo] = useState("");
  const [Email, setEmail] = useState("");
  const [Numero, setNumero] = useState("");
  const [UrlImage, setUrlImage] = useState(null);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const {
    theme,
    t,
    isDark,
    themeMode,
    setThemeMode,
    language,
    setLanguage,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useAppSettings();
  const styles = getStyles(theme);

  useEffect(() => {
    if (!ref) return;
    const onValue = (snap) => {
      const data = snap.val();
      if (!data) return;
      setNom(data.Nom ?? "");
      setPseudo(data.Pseudo ?? "");
      setEmail(data.Email || auth.currentUser?.email || "");
      setNumero(data.Numero ?? "");
      setUrlImage(data.UrlImage ?? null);
      setSavedImageUrl(data.UrlImage ?? null);
      setPreviewImage(null);
      setImageLoadError(false);
    };
    ref.on("value", onValue);
    return () => ref.off("value", onValue);
  }, [userid]);


  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Permission required", "Permission to access photos is required.");
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.2,
      base64: true,
    });
    if (!res.canceled) {
      const asset = res.assets[0];
      if (!asset.base64) {
        Alert.alert("Erreur", "Impossible de preparer cette image pour Firebase.");
        return;
      }

      const image = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
      setPreviewImage(image);
      setUrlImage(image);
      setImageLoadError(false);
    }
  };

  const saveAccount = async () => {
    if (!ref) return Alert.alert("Erreur", "Compte introuvable.");
    const link = previewImage || UrlImage || savedImageUrl || null;
    const authEmail = auth.currentUser?.email || "";
    const emailToSave = Email || authEmail;

    try {
      // Vérifier la taille avant d'enregistrer
      if (link && link.length > 8000000) {
        Alert.alert("Erreur", "L'image est trop grande. Veuillez en sélectionner une plus petite.");
        return;
      }

      const payload = { Id: userid, Nom, Pseudo, Numero, UrlImage: link };
      if (emailToSave) {
        payload.Email = emailToSave;
      }
      console.log("Image size:", (link?.length * 0.75 / 1024 / 1024).toFixed(2), "MB");
      await ref.update(payload);
      if (emailToSave) {
        setEmail(emailToSave);
      }
      setSavedImageUrl(link);
      setUrlImage(link);
      setPreviewImage(null);
      setShowEdit(false);
      Alert.alert("Succes", "Profil enregistre.");
    } catch (err) {
      console.log("Erreur lors de la sauvegarde:", err);
      Alert.alert("Erreur", err?.message || "Impossible d'enregistrer le profil.");
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ImageBackground source={require("../../assets/backgr.jpg")} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.profileCard, isDark && styles.profileCardDark]}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarShell}>
                <Image
                  source={(previewImage || (UrlImage && !imageLoadError)) ? { uri: previewImage || UrlImage } : require("../../assets/profil.png")}
                  onError={() => setImageLoadError(true)}
                  style={styles.avatar}
                />
              </View>
              <TouchableOpacity onPress={pickImage} style={styles.cameraBtn}>
                <Ionicons name="camera" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.name, isDark && styles.textOnDark]}>{Nom || t("profile")}</Text>
            <Text style={[styles.sub, isDark && styles.subOnDark]}>{Pseudo ? `@${Pseudo}` : ""}</Text>
            <Text style={[styles.bio, isDark && styles.subOnDark]}></Text>

            <TouchableOpacity style={styles.editBtn} onPress={() => setShowEdit(!showEdit)}>
              <Ionicons name="pencil" size={16} color="#fff" />
              <Text style={styles.editBtnText}>{t("editProfile")}</Text>
            </TouchableOpacity>

            {showEdit && (
              <View style={styles.editSection}>
                <Text style={styles.label}>Nom</Text>
                <TextInput value={Nom} onChangeText={setNom} editable={true} style={styles.input} />

                <Text style={styles.label}>Pseudo</Text>
                <TextInput value={Pseudo} onChangeText={setPseudo} editable={true} style={styles.input} />

                <Text style={styles.label}>Email</Text>
                <TextInput value={Email} editable={false} style={[styles.input, styles.inputReadonly]} />

                <Text style={styles.label}>Numero</Text>
                <TextInput value={Numero} onChangeText={setNumero} editable={true} style={styles.input} />

                <View style={{ marginTop: 12 }}>
                  <PrimaryButton onPress={saveAccount}>{t("save")}</PrimaryButton>
                </View>
              </View>
            )}
          </View>

          <View style={[styles.settingsCard, isDark && styles.settingsCardDark]}>
            <View style={[styles.settingsRow, isDark && styles.settingsRowDark]}>
              <View style={styles.settingsIcon}>
                <Ionicons name="notifications" size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("notifications")}</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={(value) => {
                  setNotificationsEnabled(value);
                }}
                thumbColor="#fff"
              />
            </View>
            <TouchableOpacity
              style={[styles.settingsRow, isDark && styles.settingsRowDark]}
              onPress={() => {
                setAppearanceOpen(true);
              }}
            >
              <View style={styles.settingsIcon}>
                <Ionicons name="color-palette" size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("appearance")}</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.subtext} />
            </TouchableOpacity>
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }, isDark && styles.settingsRowDark]}>
              <View style={styles.settingsIcon}>
                <Ionicons name="moon" size={18} color={theme.colors.primary} />
              </View>
              <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("darkMode")}</Text>
              <Switch
                value={themeMode === "Dark"}
                onValueChange={(value) => {
                  setThemeMode(value ? "Dark" : "Light");
                }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={() => { auth.signOut().then(() => props.navigation.replace("Auth")); }}
            style={styles.logout}
          >
            <Ionicons name="log-out" size={18} color="#e14b4b" />
            <Text style={styles.logoutText}>{t("logout")}</Text>
          </TouchableOpacity>
        </ScrollView>

        <Modal
          visible={appearanceOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setAppearanceOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, isDark && styles.modalCardDark]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, isDark && styles.textOnDark]}>{t("appearance")}</Text>
                <TouchableOpacity onPress={() => setAppearanceOpen(false)}>
                  <Ionicons name="close" size={18} color={theme.colors.subtext} />
                </TouchableOpacity>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="color-palette" size={16} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, isDark && styles.textOnDark]}>{t("theme")}</Text>
                </View>
                <View style={styles.pillWrap}>
                  {[t("light"), t("dark"), t("auto")].map((label, index) => {
                    const modeValue = ["Light", "Dark", "Auto"][index];
                    return (
                    <TouchableOpacity
                      key={modeValue}
                      onPress={() => {
                        setThemeMode(modeValue);
                      }}
                      style={[
                        styles.pill,
                        themeMode === modeValue && styles.pillActive,
                      ]}
                    >
                      <Text style={[styles.pillText, themeMode === modeValue && styles.pillTextActive]}>{label}</Text>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="globe" size={16} color={theme.colors.primary} />
                  <Text style={[styles.sectionTitle, isDark && styles.textOnDark]}>{t("language")}</Text>
                </View>
                <View style={styles.pillGrid}>
                  {["English", "Francais", "Arabic", "Espanol"].map((item) => (
                    <TouchableOpacity
                      key={item}
                      onPress={() => {
                        setLanguage(item);
                      }}
                      style={[
                        styles.pill,
                        styles.pillWide,
                        language === item && styles.pillActive,
                      ]}
                    >
                      <Text style={[styles.pillText, language === item && styles.pillTextActive]}>{item}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  bg: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    paddingTop: 20,
  },
  profileCard: {
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 28,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.mid,
  },
  avatarWrap: { alignItems: "center" },
  avatarShell: {
    width: 98,
    height: 98,
    borderRadius: 26,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 88, height: 88, borderRadius: 22 },
  cameraBtn: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  name: { fontSize: 20, fontWeight: "800", color: theme.colors.text, marginTop: 12 },
  sub: { color: theme.colors.subtext, marginTop: 2 },
  bio: { marginTop: 8, color: theme.colors.subtext, textAlign: "center" },
  editBtn: {
    marginTop: 14,
    backgroundColor: "transparent",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  editBtnText: { color: "#fff", fontWeight: "700" },
  editSection: { width: "100%", marginTop: 16 },
  label: { marginTop: 12, color: theme.colors.subtext, fontWeight: "700" },
  input: { backgroundColor: "transparent", padding: 14, borderRadius: 14, marginTop: 6, borderWidth: 1, borderColor: theme.colors.border },
  inputReadonly: { color: theme.colors.subtext },
  settingsCard: {
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    ...theme.elevation.low,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsText: { flex: 1, fontWeight: "700", color: theme.colors.text },
  logout: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.45)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#e14b4b", fontWeight: "700" },
  profileCardDark: {
    backgroundColor: "rgba(15,30,31,0.65)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  settingsCardDark: {
    backgroundColor: "rgba(15,30,31,0.55)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  settingsRowDark: {
    backgroundColor: "rgba(15,30,31,0.35)",
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#ffffffee",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalCardDark: {
    backgroundColor: "rgba(15,30,31,0.85)",
    borderColor: "rgba(255,255,255,0.15)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  modalTitle: { fontSize: 16, fontWeight: "800", color: theme.colors.text },
  section: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontWeight: "800", color: theme.colors.text },
  pillWrap: {
    flexDirection: "row",
    gap: 10,
  },
  pillGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: "rgba(235,244,242,0.9)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillWide: { minWidth: "47%", alignItems: "center" },
  pillActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  pillText: { fontWeight: "700", color: theme.colors.subtext },
  pillTextActive: { color: "#fff" },
  textOnDark: { color: "#EAF3F3" },
  subOnDark: { color: "#B8D0D1" },
});
