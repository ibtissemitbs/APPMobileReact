import { View, Text } from 'react-native'
import React, { useEffect, useState } from 'react'
import Auth from './Screens/Auth'
import SignUp from './Screens/SignUp'
import Home from './Screens/Home'
import MyAccount from './Screens/Home/MyAccount';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Chat from './Screens/Chat'
import GroupChat from './Screens/GroupChat'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { AppSettingsProvider, useAppSettings } from './Config/appSettings';

const Stack = createNativeStackNavigator();

function AppShell() {
  const [userid, setuserid] = useState(null);
  const [isLoading, setisLoading] = useState(true);
  const { theme, isDark } = useAppSettings();

  useEffect(() => {
    AsyncStorage.getItem("userid")
    .then((id)=>{
      if(id){
        setuserid(id);
      }
      setisLoading(false);
    })
    .catch((err)=>{
      console.log(err);
      setisLoading(false);
    })
  }, [])

  if(isLoading){
    return(
      <View style={{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:theme.colors.background}}>
        <Text style={{color:theme.colors.primary,fontWeight:"700"}}>Loading ...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? "light" : "dark"} />

      <Stack.Navigator initialRouteName={userid ? "Home" : "Auth"} screenOptions={{headerShown:false}}>
        <Stack.Screen name="Auth" component={Auth} />
        <Stack.Screen name="SignUp" component={SignUp}/>
        <Stack.Screen name="Home" component={Home} initialParams={{userId:userid}} />
        <Stack.Screen name="MyAccount" component={MyAccount} />
        <Stack.Screen name="Chat" component={Chat} />
        <Stack.Screen name="GroupChat" component={GroupChat} />
      </Stack.Navigator>
    </NavigationContainer>
    
  );
}

export default function App() {
  return (
    <AppSettingsProvider>
      <AppShell />
    </AppSettingsProvider>
  );
}
