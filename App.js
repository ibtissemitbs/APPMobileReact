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
import MediaGallery from './Screens/MediaGallery'
import CreateGroup from './Screens/CreateGroup'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { AppSettingsProvider, useAppSettings } from './Config/appSettings';

const Stack = createNativeStackNavigator();

function CallScreenWrapper(props) {
  const [CallScreen, setCallScreen] = useState(null);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    try {
      const loaded = require('./Screens/Call').default;
      setCallScreen(() => loaded);
    } catch (err) {
      setLoadError(err);
    }
  }, []);

  if (loadError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#0F2E31' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
          L'appel video natif n'est pas disponible dans ce runtime.
        </Text>
        <Text style={{ color: '#cfe7e5', marginTop: 10, textAlign: 'center' }}>
          Lance l'application avec un dev client ou une build native, pas Expo Go.
        </Text>
      </View>
    );
  }

  if (!CallScreen) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F2E31' }}>
        <Text style={{ color: '#fff' }}>Chargement de l'appel...</Text>
      </View>
    );
  }

  return <CallScreen {...props} />;
}

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
        <Stack.Screen name="Call" component={CallScreenWrapper} />
        <Stack.Screen name="GroupChat" component={GroupChat} />
        <Stack.Screen name="MediaGallery" component={MediaGallery} />
        <Stack.Screen name="CreateGroup" component={CreateGroup} />
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
