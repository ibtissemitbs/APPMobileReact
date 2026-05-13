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
import ModernBackground from "../../components/ui/ModernBackground";

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

  const deleteAccount = async () => {
    if (!ref) {
      Alert.alert("Erreur", "Compte introuvable.");
      return;
    }

    try {
      await ref.remove();
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete();
      }
      await AsyncStorage.multiRemove(["userid", "userId"]);
      Alert.alert("Compte supprimé", "Votre compte a été supprimé.");
      props.navigation.replace("Auth");
    } catch (err) {
      console.log("Erreur lors de la suppression du compte:", err);
      Alert.alert(
        "Erreur",
        err?.code === "auth/requires-recent-login"
          ? "Veuillez vous reconnecter puis réessayer de supprimer le compte."
          : err?.message || "Impossible de supprimer le compte."
      );
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ModernBackground source={require("../../assets/backgr.jpg")} style={styles.bg}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} scrollEnabled={true}>
          <View style={[styles.pageHero, isDark && styles.pageHeroDark]}>
            <View style={styles.pageHeroGlowA} />
            <View style={styles.pageHeroGlowB} />

            <View style={styles.pageHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.pageEyebrowRow}>
                  <Ionicons name="person-circle-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.pageEyebrow}>{t("profile")}</Text>
                </View>
                <Text style={styles.pageTitle}>{Nom || t("profile")}</Text>
                <Text style={styles.pageSubtitle}>{Pseudo ? `@${Pseudo}` : Email || ""}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowEdit(!showEdit)}
                style={[styles.headerAction, showEdit && styles.headerActionActive]}
              >
                <Ionicons name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.pageMetaRow}>
              <View style={styles.metaPill}>
                <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
                
              </View>
              <View style={styles.metaPillSoft}>
                <Text style={styles.metaPillTextSoft}>{showEdit ? "Editing" : "Overview"}</Text>
              </View>
            </View>
          </View>

          <View style={[styles.profileCard, isDark && styles.profileCardDark]}>
            <View style={styles.heroTopRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarShell}>
                  <Image
                    source={(previewImage || (UrlImage && !imageLoadError)) ? { uri: previewImage || UrlImage } : require("../../assets/profil.png")}
                    onError={() => setImageLoadError(true)}
                    style={styles.avatar}
                  />
                </View>
                <TouchableOpacity onPress={pickImage} style={styles.cameraBtn}>
                  <Ionicons name="camera" size={16} color="#537978" />
                </TouchableOpacity>
              </View>

              <View style={styles.heroInfo}>
                <Text style={[styles.name, isDark && styles.textOnDark]} numberOfLines={1}>{Nom || t("profile")}</Text>
                <Text style={[styles.sub, isDark && styles.subOnDark]} numberOfLines={1}>{Pseudo ? `@${Pseudo}` : ""}</Text>
                <View style={styles.badgeRow}>
                  <View style={styles.infoBadge}>
                    <Ionicons name="mail-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.infoBadgeText} numberOfLines={1}>{Email || "—"}</Text>
                  </View>
                  <View style={styles.infoBadge}>
                    <Ionicons name="call-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.infoBadgeText} numberOfLines={1}>{Numero || "—"}</Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.primaryChip} onPress={() => setShowEdit(!showEdit)}>
              <Ionicons name={showEdit ? "checkmark-circle" : "create-outline"} size={16} color="#fff" />
              <Text style={styles.primaryChipText}>{showEdit ? t("save") : t("editProfile")}</Text>
            </TouchableOpacity>

            {showEdit && (
              <View style={styles.editSection}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nom</Text>
                  <TextInput value={Nom} onChangeText={setNom} editable={true} style={styles.input} placeholder="Nom" placeholderTextColor={theme.colors.subtext} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Pseudo</Text>
                  <TextInput value={Pseudo} onChangeText={setPseudo} editable={true} style={styles.input} placeholder="Pseudo" placeholderTextColor={theme.colors.subtext} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput value={Email} editable={false} style={[styles.input, styles.inputReadonly]} />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Numero</Text>
                  <TextInput value={Numero} onChangeText={setNumero} editable={true} style={styles.input} placeholder="Numero" placeholderTextColor={theme.colors.subtext} />
                </View>

                <View style={{ marginTop: 14 }}>
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
              <View style={styles.settingsRowBody}>
                <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("notifications")}</Text>
                <Text style={[styles.settingsHint, isDark && styles.subOnDark]}>Alertes et messages</Text>
              </View>
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
              <View style={styles.settingsRowBody}>
                <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("appearance")}</Text>
                <Text style={[styles.settingsHint, isDark && styles.subOnDark]}>Thème, langue, apparence</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.subtext} />
            </TouchableOpacity>
            <View style={[styles.settingsRow, { borderBottomWidth: 0 }, isDark && styles.settingsRowDark]}>
              <View style={styles.settingsIcon}>
                <Ionicons name="moon" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.settingsRowBody}>
                <Text style={[styles.settingsText, isDark && styles.textOnDark]}>{t("darkMode")}</Text>
                <Text style={[styles.settingsHint, isDark && styles.subOnDark]}>Mode sombre</Text>
              </View>
              <Switch
                value={themeMode === "Dark"}
                onValueChange={(value) => {
                  setThemeMode(value ? "Dark" : "Light");
                }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => { auth.signOut().then(() => props.navigation.replace("Auth")); }}
              style={styles.logout}
            >
              <Ionicons name="log-out" size={18} color="#e14b4b" />
              <Text style={styles.logoutText}>{t("logout")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Delete Account",
                  "This action will permanently delete your account and profile data.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: deleteAccount },
                  ]
                );
              }}
              style={styles.deleteAccount}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteAccountText}>{t("deleteAccount")}</Text>
            </TouchableOpacity>
          </View>
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
      </ModernBackground>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.background },
  bg: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 140,
    paddingTop: 72,
    flexGrow: 1,
    justifyContent: "flex-start",
  },
  pageHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
    zIndex: 1,
  },
  pageHero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 30,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.5)",
    ...theme.elevation.mid,
  },
  pageHeroDark: {
    backgroundColor: "rgba(15,30,31,0.72)",
    borderColor: "rgba(255,255,255,0.12)",
  },
  pageHeroGlowA: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(83,121,120,0.14)",
    right: -48,
    top: -42,
  },
  pageHeroGlowB: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.22)",
    left: -18,
    bottom: -26,
  },
  pageEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  pageEyebrow: {
    color: theme.colors.subtext,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  pageTitle: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 32,
  },
  pageSubtitle: {
    color: theme.colors.subtext,
    marginTop: 4,
    fontSize: 13,
    fontWeight: "600",
  },
  pageMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
    zIndex: 1,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.65)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaPillSoft: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.28)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  metaPillText: {
    color: theme.colors.text,
    fontWeight: "800",
    fontSize: 12,
  },
  metaPillTextSoft: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.low,
  },
  headerActionActive: {
    transform: [{ scale: 0.98 }],
  },
  profileCard: {
    backgroundColor: theme.colors.glass,
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(66, 121, 97, 0.52)",
    marginBottom: 24,
    ...theme.elevation.mid,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  avatarWrap: { alignItems: "center" },
  avatarShell: {
    width: 100,
    height: 100,
    borderRadius: 34,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: { width: 90, height: 90, borderRadius: 26 },
  cameraBtn: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
  },
  name: { fontSize: 22, fontWeight: "900", color: theme.colors.text },
  sub: { color: theme.colors.subtext, marginTop: 4, fontWeight: "600" },
  bio: { marginTop: 8, color: theme.colors.subtext, textAlign: "center" },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.62)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxWidth: "100%",
  },
  infoBadgeText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
    flexShrink: 1,
  },
  primaryChip: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
  },
  primaryChipText: { color: "#fff", fontWeight: "800" },
  editSection: { width: "100%", marginTop: 18 },
  fieldGroup: {
    marginBottom: 8,
  },
  label: { marginTop: 12, color: theme.colors.subtext, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(255,255,255,0.5)",
    padding: 14,
    borderRadius: 16,
    marginTop: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  inputReadonly: { color: theme.colors.subtext },
  settingsCard: {
    marginTop: 8,
    backgroundColor: theme.colors.glass,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.52)",
    overflow: "hidden",
    ...theme.elevation.low,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingsRowBody: {
    flex: 1,
    minWidth: 0,
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
  settingsHint: {
    marginTop: 2,
    fontSize: 12,
    color: theme.colors.subtext,
    fontWeight: "500",
  },
  actionRow: {
    marginTop: 24,
    gap: 12,
  },
  logout: {
    marginTop: 0,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#e14b4b", fontWeight: "700" },
  deleteAccount: {
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#e14b4b",
    borderWidth: 1,
    borderColor: "#e14b4b",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  deleteAccountText: { color: "#fff", fontWeight: "800" },
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
