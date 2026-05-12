import React from "react";
import { Pressable, Text, StyleSheet, View } from "react-native";
import { useAppSettings } from "../../Config/appSettings";

export default function IconButton({ icon, onPress, style, size = 44 }) {
  const { theme } = useAppSettings();
  const styles = getStyles(theme);

  const content = typeof icon === "string" ? (
    <Text style={[styles.icon, { fontSize: Math.round(size * 0.4) }]}>{icon}</Text>
  ) : (
    icon
  );

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.muted }}
      style={({ pressed }) => [
        styles.wrap,
        { width: size, height: size, borderRadius: Math.round(size / 2) },
        pressed && styles.pressed,
        style
      ]}
    >
      <View style={styles.inner}>{content}</View>
    </Pressable>
  );
}

const getStyles = (theme) => StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.low
  },
  inner: {
    alignItems: "center",
    justifyContent: "center"
  },
  pressed: {
    opacity: 0.85
  },
  icon: {
    color: theme.colors.text
  }
});
