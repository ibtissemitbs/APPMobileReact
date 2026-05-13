import React from "react";
import MyAccount from "./Home/MyAccount";
import Groupe from "./Home/Groupe";
import ListAccount from "./Home/ListAccount";
import Calls from "./Home/Calls";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppSettings } from "../Config/appSettings";

const Tab = createBottomTabNavigator();

export default function Home(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);

  const renderIcon = (focused, activeName, inactiveName) => (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons
        name={focused ? activeName : inactiveName}
        size={18}
        color={focused ? "#fff" : theme.colors.subtext}
      />
    </View>
  );

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.subtext,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
      }}
    >
      <Tab.Screen
        name="ListAccount"
        component={ListAccount}
        options={{
          tabBarLabel: t("chats"),
          tabBarIcon: ({ focused }) => renderIcon(focused, "chatbubbles", "chatbubbles-outline"),
        }}
        initialParams={{ userid }}
      />
      <Tab.Screen
        name="Groupe"
        component={Groupe}
        options={{
          tabBarLabel: t("groups"),
          tabBarIcon: ({ focused }) => renderIcon(focused, "people", "people-outline"),
        }}
        initialParams={{ userid }}
      />
      <Tab.Screen
        name="Calls"
        component={Calls}
        options={{
          tabBarLabel: t("calls"),
          tabBarIcon: ({ focused }) => renderIcon(focused, "call", "call-outline"),
        }}
        initialParams={{ userid }}
      />
      <Tab.Screen
        name="MyAccount"
        component={MyAccount}
        options={{
          tabBarLabel: t("profileTab"),
          tabBarIcon: ({ focused }) => renderIcon(focused, "person", "person-outline"),
        }}
        initialParams={{ userid }}
      />
    </Tab.Navigator>
  );
}

const getStyles = (theme) => StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.surface + "F5",
    height: 74,
    paddingBottom: 10,
    paddingTop: 8,
    borderTopWidth: 0,
    borderRadius: 26,
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 12,
    overflow: "hidden",
    ...theme.elevation.mid,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: theme.colors.surface + "F5",
  },
  tabBarLabel: {
    fontWeight: "600",
    fontSize: 11,
    marginTop: -2,
  },
  tabBarItem: {
    borderRadius: 18,
    marginHorizontal: 2,
    backgroundColor: "transparent",
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapActive: {
    backgroundColor: theme.colors.primary,
  },
});
