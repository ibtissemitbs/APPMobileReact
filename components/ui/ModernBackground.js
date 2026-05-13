import React from "react";
import { StyleSheet, View } from "react-native";
import { useAppSettings } from "../../Config/appSettings";

export default function ModernBackground({ children, source, style, imageStyle }) {
  const { theme } = useAppSettings();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      <View pointerEvents="none" style={styles.topGlow} />
      <View pointerEvents="none" style={styles.topArc} />
      <View pointerEvents="none" style={styles.middleArc} />
      <View pointerEvents="none" style={styles.bottomArc} />
      <View pointerEvents="none" style={styles.diagonalWash} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: "hidden",
  },
  topGlow: {
    position: "absolute",
    top: -180,
    right: -120,
    width: 680,
    height: 680,
    borderRadius: 340,
    backgroundColor: "#CB9DAE",
    opacity: 0.58,
  },
  topArc: {
    position: "absolute",
    top: -100,
    left: -140,
    width: 860,
    height: 860,
    borderRadius: 430,
    backgroundColor: "#7ECBC8",
    opacity: 0.65,
  },
  middleArc: {
    position: "absolute",
    top: 240,
    right: -200,
    width: 820,
    height: 820,
    borderRadius: 410,
    backgroundColor: "#CB9DAE",
    opacity: 0.52,
  },
  bottomArc: {
    position: "absolute",
    bottom: -280,
    left: -100,
    width: 1100,
    height: 1100,
    borderRadius: 550,
    backgroundColor: "#4BA9A3",
    opacity: 0.48,
  },
  diagonalWash: {
    position: "absolute",
    top: "20%",
    left: -80,
    width: "160%",
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(248,248,248,0.08)",
    transform: [{ rotate: "-22deg" }],
  },
});
