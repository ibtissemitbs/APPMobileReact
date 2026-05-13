import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useAppSettings } from "../../Config/appSettings";

export default function PrimaryButton({ children, onPress, style, disabled, loading }) {
  const { theme } = useAppSettings();
  const styles = getStyles(theme);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      android_ripple={{ color: theme.colors.muted }}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
        style
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, disabled && styles.disabledText]}>{children}</Text>
      )}
    </Pressable>
  );
}

const getStyles = (theme) => StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    minHeight: 50,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    ...theme.elevation.mid
  },
  pressed: {
    opacity: 0.95
  },
  text: {
    color: "#fff",
    fontWeight: theme.typography.weights.bold,
    fontSize: theme.typography.body
  },
  disabled: {
    backgroundColor: theme.colors.muted
  },
  disabledText: {
    color: theme.colors.subtext
  }
});
