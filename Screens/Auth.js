import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, View } from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useAppSettings } from "../Config/appSettings";
import ModernBackground from "../components/ui/ModernBackground";
import { Ionicons } from "@expo/vector-icons";


const auth = firebase.auth();

export default function Auth(props) {
  var email ,password;
  const { theme, t, isDark } = useAppSettings();
  const styles = getStyles(theme);

  return (
    <ModernBackground source={require("../assets/backgr.jpg")} style={styles.container}>
      <View
        style={styles.card}
      >
        <View style={styles.brandMark}>
          <Ionicons name="chatbubble-ellipses" size={28} color="#fff" />
        </View>
        <Text style={styles.title}>
          {t("appName")}
        </Text>
        <Text style={styles.subtitle}>
          {t("loginSubtitle")}
        </Text>
        <TextInput 
        onChangeText={(txt)=>{email=txt;}} 
        keyboardType="email-address"
        placeholderTextColor={theme.colors.subtext}
        style={styles.Input} placeholder={t("emailPlaceholder")} />

        <TextInput 
        onChangeText={(txt)=>{password=txt;}} 
        secureTextEntry={true}
        placeholderTextColor={theme.colors.subtext}
        style={styles.Input} placeholder={t("passwordPlaceholder")} />

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

        <Text onPress={()=>   
         props.navigation.navigate("SignUp")
        } style={styles.link}
          
        >
            {t("createNewAccount")}
        </Text>
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
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)",
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
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
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.subtext,
    marginBottom: 22,
    fontWeight: "600",
  },
  Input: {
    width: "100%",
    height: 52,
    backgroundColor: theme.colors.surface,
    marginBottom: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  },
  button: {
    width: "100%",
    marginTop: 8,
  },
  link: {
    color: theme.colors.secondary,
    marginTop: 18,
    fontSize: 16,
    fontWeight: "800",
  },
});
