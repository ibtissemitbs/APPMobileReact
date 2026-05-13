import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useAppSettings } from "../Config/appSettings";
import ModernBackground from "../components/ui/ModernBackground";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";


const auth = firebase.auth();

export default function Auth(props) {
  var email ,password;
  const { theme, t, isDark } = useAppSettings();
  const styles = getStyles(theme);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <ModernBackground source={require("../assets/backgr.jpg")} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.heroTop}>
          <View style={styles.brandMark}>
            <Ionicons name="chatbubbles-outline" size={28} color="#fff" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.kicker}>Secure messaging</Text>
            <Text style={styles.title}>{t("appName")}</Text>
            <Text style={styles.subtitle}>{t("loginSubtitle")}</Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={styles.featurePill}>
            <Ionicons name="shield-checkmark-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.featureText}>Private</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="flash-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.featureText}>Fast</Text>
          </View>
          <View style={styles.featurePill}>
            <Ionicons name="sparkles-outline" size={14} color={theme.colors.primary} />
            <Text style={styles.featureText}>Modern</Text>
          </View>
        </View>

        <View style={styles.inputBlock}>
          <View style={styles.inputShell}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.primary} />
            <TextInput
              onChangeText={(txt)=>{email=txt;}}
              keyboardType="email-address"
              placeholderTextColor={theme.colors.subtext}
              style={styles.Input}
              placeholder={t("emailPlaceholder")}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputShell}>
            <Ionicons name="lock-closed-outline" size={18} color={theme.colors.primary} />
            <TextInput
              onChangeText={(txt)=>{password=txt;}}
              secureTextEntry={!showPassword}
              placeholderTextColor={theme.colors.subtext}
              style={styles.Input}
              placeholder={t("passwordPlaceholder")}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.colors.subtext} />
            </TouchableOpacity>
          </View>
        </View>

        <PrimaryButton style={styles.button} onPress={()=>{
          if(email && password){
            auth.signInWithEmailAndPassword(email,password)
            .then(async ()=>{
              const userid = auth.currentUser.uid;
              await AsyncStorage.setItem("userid", userid);
              props.navigation.navigate("Home",{userId:userid})}
            )
            .catch((err)=>{
              alert(err.message)
            });
          }
          else{
            alert("Email and password are required")
          }
        }}>
          {t("signIn")}
        </PrimaryButton>

        <TouchableOpacity onPress={()=> props.navigation.navigate("SignUp")} style={styles.linkWrap}>
          <Text style={styles.link}>{t("createNewAccount")}</Text>
          <Ionicons name="arrow-forward" size={14} color={theme.colors.secondary} />
        </TouchableOpacity>
      </View>

        <StatusBar style={isDark ? "light" : "dark"} />
    </ModernBackground>
  );
}

  const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: theme.colors.glass,
    width: "100%",
    maxWidth: 460,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  brandMark: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  heroTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: theme.colors.text,
    lineHeight: 36,
  },
  subtitle: {
    color: theme.colors.subtext,
    marginBottom: 6,
    fontWeight: "600",
    marginTop: 2,
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
    marginBottom: 14,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.56)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  featureText: {
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 12,
  },
  inputBlock: {
    gap: 10,
    marginBottom: 12,
  },
  inputShell: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  Input: {
    width: "100%",
    height: 52,
    backgroundColor: "transparent",
    borderRadius: 16,
    color: theme.colors.text,
    flex: 1,
  },
  button: {
    width: "100%",
    marginTop: 10,
  },
  linkWrap: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  link: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "800",
  },
  eyeBtn: {
    padding: 6,
  },
});
