import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Linking, SafeAreaView } from 'react-native';
import firebase from "../Config";
import { useAppSettings } from "../Config/appSettings";

const database = firebase.database();
const ref_groups = database.ref("groups");
const ref_all_messages = database.ref("allMessages");

export default function MediaGallery({ route, navigation }) {
  const { theme } = useAppSettings();
  const styles = getStyles(theme);
  const { mode, id } = route.params || {}; // mode: 'group' or 'private', id: groupId or discussionId

  const [items, setItems] = useState(null);

  useEffect(() => {
    let ref = null;
    if (mode === 'group') {
      ref = ref_groups.child(id).child('messages');
    } else {
      ref = ref_all_messages.child(id).child('chat');
    }

    const onValue = (snapshot) => {
      const d = [];
      snapshot.forEach((one) => {
        const val = one.val() || {};
        if (['image', 'video', 'file'].includes(val.type)) {
          d.push({ key: one.key, ...val });
        }
      });
      setItems(d.reverse());
    };

    ref.on('value', onValue);
    return () => ref.off('value', onValue);
  }, [mode, id]);

  if (!items) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>Aucun media trouvé</Text>
      </View>
    );
  }

  const openItem = (it) => {
    if (it.type === 'image' || it.type === 'video') {
      Linking.openURL(it.message);
    } else {
      Linking.openURL(it.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Médias</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        numColumns={2}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openItem(item)}>
            {item.type === 'image' || item.type === 'video' ? (
              <Image source={{ uri: item.message }} style={styles.thumb} />
            ) : (
              <View style={styles.fileCard}>
                <Text style={styles.fileText}>{item.fileName || 'Fichier'}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      </View>
    </SafeAreaView>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 14,
      paddingTop: 10,
      paddingBottom: 8,
      marginTop: 4,
      zIndex: 2,
      elevation: 2,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '800',
    },
    headerSpacer: {
      width: 72,
    },
    backButton: {
      minHeight: 40,
      minWidth: 92,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 999,
      backgroundColor: theme.colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backButtonText: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    center: { alignItems: 'center', justifyContent: 'center' },
    emptyText: { color: theme.colors.subtext },
    card: {
      flex: 1,
      margin: 6,
      height: 180,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
    },
    thumb: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    fileCard: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    fileText: { color: theme.colors.text },
  });
