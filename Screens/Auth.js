import { StatusBar } from "expo-status-bar";
import { ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import firebase from "../Config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PrimaryButton from "../components/ui/PrimaryButton";
import { useAppSettings } from "../Config/appSettings";


const auth = firebase.auth();

export default function Auth(props) {
  var email ,password;
  const { theme, t, isDark } = useAppSettings();
  const styles = getStyles(theme);

  return (
    <ImageBackground source={require("../assets/backgr.jpg")} style={styles.container}>
      <View
        style={styles.card}
      >
        <Text style={styles.title}>
          {t("appName")}
        </Text>
        <Text style={styles.subtitle}>
          {t("loginSubtitle")}
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
    backgroundColor: "#fffffff5",
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
    fontSize: 36,
    fontWeight: "800",
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.subtext,
    marginBottom: 18,
    fontWeight: "600",
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
  button: {
    width: "100%",
    marginTop: 6,
  },
  link: {
    color: theme.colors.primary,
    marginTop: 14,
    fontSize: 16,
    fontWeight: "700",
  },
});
