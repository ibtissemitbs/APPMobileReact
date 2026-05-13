import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, StyleSheet } from 'react-native';
import firebase from '../Config';
import { useAppSettings } from '../Config/appSettings';

const database = firebase.database();
const ref_all_accounts = database.ref('allaccounts');
const ref_groups = database.ref('groups');

export default function CreateGroup({ route, navigation }) {
  const { theme } = useAppSettings();
  const styles = getStyles(theme);
  const currentUserId = route.params?.currentid;
  const preselect = route.params?.preselect || []; // array of user ids preselected (e.g., contact)

  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(() => {
    const s = {};
    (preselect || []).forEach((id) => (s[id] = true));
    return s;
  });
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    const onVal = (snapshot) => {
      const d = [];
      snapshot.forEach((one) => d.push({ key: one.key, ...one.val() }));
      setAccounts(d);
    };
    ref_all_accounts.on('value', onVal);
    return () => ref_all_accounts.off('value', onVal);
  }, []);

  function toggleSelect(id) {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  async function create() {
    const members = Object.keys(selected).filter((k) => selected[k]);
    if (!members || members.length < 2) {
      Alert.alert('Erreur', 'Sélectionnez au moins 2 utilisateurs pour créer un groupe');
      return;
    }
    if (!groupName.trim()) {
      Alert.alert('Erreur', 'Entrez un nom de groupe');
      return;
    }

    const key = ref_groups.push().key;
    const membersObj = {};
    members.forEach((m) => (membersObj[m] = true));

    await ref_groups.child(key).set({
      nom: groupName.trim(),
      members: membersObj,
      createdAt: new Date().toISOString(),
    });

    navigation.replace('GroupChat', { groupId: key, userid: currentUserId });
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create group</Text>
      <TextInput style={styles.input} value={groupName} onChangeText={setGroupName} placeholder="Group name" placeholderTextColor={theme.colors.subtext} />
      <Text style={styles.subtitle}>Select members</Text>
      <ScrollView>
        {accounts.map((acc) => (
          <TouchableOpacity key={acc.Id} style={styles.row} onPress={() => toggleSelect(String(acc.Id))}>
            <Text style={styles.rowText}>{acc.Pseudo || acc.Nom || acc.Email}</Text>
            <Text style={[styles.rowText, { color: selected[String(acc.Id)] ? theme.colors.primary : theme.colors.subtext }]}>
              {selected[String(acc.Id)] ? '✓' : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.saveBtn} onPress={create}>
        <Text style={styles.saveBtnText}>Create</Text>
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: 16 },
    title: { fontSize: 20, fontWeight: '800', color: theme.colors.text, marginBottom: 8 },
    input: { backgroundColor: theme.colors.surface, padding: 12, borderRadius: 10, color: theme.colors.text, marginBottom: 12 },
    subtitle: { color: theme.colors.subtext, marginBottom: 8 },
    row: { padding: 12, backgroundColor: theme.colors.glass, borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
    rowText: { color: theme.colors.text },
    saveBtn: { marginTop: 12, backgroundColor: theme.colors.primary, padding: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '800' },
  });
