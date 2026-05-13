import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useAppSettings } from "../Config/appSettings";
import ModernBackground from "../components/ui/ModernBackground";
import { Ionicons } from "@expo/vector-icons";

const auth = firebase.auth();

export default function SignUp(props) {
  var email ,password,confirmPassword;
  const { theme, t, isDark } = useAppSettings();
  const styles = getStyles(theme);

  return (
    <ModernBackground source={require("../assets/backgr.jpg")} style={styles.container}>
      <View style={styles.card}>
        <View style={styles.brandMark}>
          <Ionicons name="person-add" size={27} color="#fff" />
        </View>
        <Text style={styles.title}>
          {t("createNewAccount")}
        </Text>
        <Text style={styles.subtitle}>Creez votre espace de conversation</Text>
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

        <TextInput 
        onChangeText={(txt)=>{confirmPassword=txt;}} 
        secureTextEntry={true}
        placeholderTextColor={theme.colors.subtext}
        style={styles.Input} placeholder={t("confirmPasswordPlaceholder")} />

        <View style={styles.actions}>

        <PrimaryButton style={styles.button} onPress={()=> {
          if(password===confirmPassword){
            auth.createUserWithEmailAndPassword(email,password)
            .then(async ()=>{
              const userid = auth.currentUser.uid;
              await AsyncStorage.setItem("userid", userid);
              props.navigation.replace("MyAccount",{userId:userid})})
            .catch((err)=>{
              alert(err.message)
            });
            
          }
          else{
            alert("password not match")
          }
        } }>
          {t("signUp")}
        </PrimaryButton>

        <TouchableOpacity style={[styles.button, {backgroundColor:"transparent"}]} onPress={()=> 
          props.navigation.goBack()
         }>
          <Text style={styles.buttonText}>{t("back")}</Text>
        </TouchableOpacity>
        </View>
        
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
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    backgroundColor: "#0000",
    fontSize: 28,
    fontWeight: "800",
    color: theme.colors.text,
    textAlign: "center",
  },
  subtitle: {
    color: theme.colors.subtext,
    marginTop: 4,
    marginBottom: 18,
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
  actions: { width: "100%", gap: 10, marginTop: 10 },
  button: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: theme.colors.secondary,
    fontSize: 16,
    fontWeight: "800",
  },
});
