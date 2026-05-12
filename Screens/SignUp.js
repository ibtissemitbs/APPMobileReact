import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useAppSettings } from "../Config/appSettings";

const auth = firebase.auth();

export default function SignUp(props) {
  var email ,password,confirmPassword;
  const { theme, t, isDark } = useAppSettings();
  const styles = getStyles(theme);

  return (
    <ImageBackground source={require("../assets/backgr.jpg")} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>
          {t("createNewAccount")}
        </Text>
        <TextInput 
        onChangeText={(txt)=>{email=txt;}} 
        keyboardType="email-address"
        placeholderTextColor={theme.colors.primary}
        style={styles.Input} placeholder={t("emailPlaceholder")} />

        <TextInput 
        onChangeText={(txt)=>{password=txt;}} 
        secureTextEntry={true}
        placeholderTextColor={theme.colors.primary}
        style={styles.Input} placeholder={t("passwordPlaceholder")} />

        <TextInput 
        onChangeText={(txt)=>{confirmPassword=txt;}} 
        secureTextEntry={true}
        placeholderTextColor={theme.colors.primary}
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
    </ImageBackground>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fffffff2",
    width: "90%",
    paddingVertical: 28,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  title: {
    backgroundColor: "#0000",
    fontSize: 34,
    fontWeight: "800",
    color: theme.colors.primary,
    marginBottom: 12,
  },
  Input: {
    width: "100%",
    height: 52,
    backgroundColor: theme.colors.muted,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 15 },
  button: {
    width: 110,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
