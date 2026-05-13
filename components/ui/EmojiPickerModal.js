import React from "react";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
  "😊", "😇", "🙂", "😉", "😍", "😘", "😋", "😎",
  "🥳", "🤩", "😏", "😢", "😭", "😡", "🤔", "🙄",
  "👍", "👎", "👏", "🙌", "🙏", "💪", "🤝", "👌",
  "❤️", "💙", "💚", "💛", "💜", "🖤", "🔥", "✨",
  "🌹", "🌸", "🎉", "🎁", "⭐", "💯", "✅", "📌",
];

export default function EmojiPickerModal({ visible, onClose, onSelect, theme }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Emojis</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: theme.colors.primary }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[styles.emojiButton, { backgroundColor: theme.colors.muted }]}
                onPress={() => onSelect(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  backdrop: {
    flex: 1,
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 14,
    paddingBottom: 22,
    maxHeight: "48%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
  },
  closeButton: {
    padding: 6,
  },
  closeText: {
    fontWeight: "700",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 8,
  },
  emojiButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: {
    fontSize: 24,
  },
});
