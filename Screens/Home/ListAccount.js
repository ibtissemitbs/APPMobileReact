import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import firebase from "../../Config";
import { useAppSettings } from "../../Config/appSettings";
import ModernBackground from "../../components/ui/ModernBackground";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const ref_all_messages = database.ref("allMessages");

export default function ListAccount(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const createGroupMode = props.route?.params?.mode === "createGroup";
  const preselectUsers = props.route?.params?.preselect || [];
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);
  const [isModalVisible, setisModalVisible] = useState(false);
  const [selectedAccount, setselectedAccount] = useState(null);
  const [data, setdata] = useState([]);
  const [recherche, setrecherche] = useState("");
  const [favoriteIds, setfavoriteIds] = useState([]);
  const [brokenImages, setBrokenImages] = useState({});
  const [chatUserIds, setchatUserIds] = useState([]);
  const [addedIds, setaddedIds] = useState([]);
  const [isAddVisible, setisAddVisible] = useState(false);
  const [fullNameInput, setfullNameInput] = useState("");
  const [pseudoInput, setpseudoInput] = useState("");
  const [phoneInput, setphoneInput] = useState("");
  const [storyUri, setstoryUri] = useState(null);
  const [storyAt, setstoryAt] = useState(null);
  const [editModalVisible, seteditModalVisible] = useState(false);
  const [editingContact, seteditingContact] = useState(null);
  const [editNom, seteditNom] = useState("");
  const [editPseudo, seteditPseudo] = useState("");
  const [editNumero, seteditNumero] = useState("");
  const [groupName, setgroupName] = useState("");
  const [selectedUsers, setselectedUsers] = useState(() => {
    const initial = {};
    preselectUsers.forEach((id) => {
      initial[String(id)] = true;
    });
    return initial;
  });
  const [selectAllMode, setselectAllMode] = useState(false);
  const [readAllMode, setreadAllMode] = useState(false);
  const [calls, setcalls] = useState([]);
  const [selectedChats, setselectedChats] = useState({});

  const storageKey = "favorite_contacts_" + userid;
  const addedKey = "added_contacts_" + userid;
  const storyKey = "my_story_" + userid;
  const storyDurationMs = 3 * 60 * 60 * 1000;

  function goToChat(item) {
    const params = {
      currentid: userid,
      secondid: item.Id,
    };

    const parentNavigation = props.navigation.getParent();
    if (parentNavigation) {
      parentNavigation.navigate("Chat", params);
    } else {
      props.navigation.navigate("Chat", params);
    }
  }

  function getContactInitial(item) {
    const sourceName = item?.Nom || item?.Pseudo || item?.Email || item?.Numero || "?";
    return sourceName.trim().charAt(0).toUpperCase();
  }

  function getContactNudeColor(item) {
    const palette = ["#C7DBC2", "#99B8A9"];
    const seed = `${item?.Id ?? ""}${item?.Nom ?? ""}${item?.Pseudo ?? ""}`;
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
      hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  function toggleGroupUser(userId) {
    const key = String(userId);
    setselectedUsers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function createGroupFromSelection() {
    if (!userid) {
      Alert.alert("Erreur", "Utilisateur introuvable");
      return;
    }

    const members = Object.keys(selectedUsers).filter((id) => selectedUsers[id]);
    if (members.length < 2) {
      Alert.alert("Erreur", "Sélectionnez au moins 2 utilisateurs");
      return;
    }

    if (!groupName.trim()) {
      Alert.alert("Erreur", "Entrez un nom de groupe");
      return;
    }

    const groupId = ref_groups.push().key;
    const membersMap = { [String(userid)]: true };
    members.forEach((id) => {
      membersMap[String(id)] = true;
    });

    await ref_groups.child(groupId).set({
      id: groupId,
      nom: groupName.trim(),
      admin: userid,
      members: membersMap,
      createdAt: new Date().toISOString(),
    });

    props.navigation.navigate("GroupChat", { groupId, userid });
  }

  function callUser(item) {
    const numero = item?.Numero || item?.numero;
    if (!numero) {
      Alert.alert("Numero introuvable", "Ce contact n'a pas de numero.");
      return;
    }
    Linking.openURL(`tel:${numero}`);
  }

  function deleteContact(contactId) {
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir supprimer ce contact?",
      [
        { text: "Annuler", onPress: () => {}, style: "cancel" },
        {
          text: "Supprimer",
          onPress: () => {
            const updatedAdded = addedIds.filter((id) => id !== contactId);
            saveAdded(updatedAdded);
            setisModalVisible(false);
            Alert.alert("Succès", "Contact supprimé");
          },
          style: "destructive",
        },
      ]
    );
  }

  function openEditContact(contact) {
    seteditingContact(contact);
    seteditNom(contact.Nom || "");
    seteditPseudo(contact.Pseudo || "");
    seteditNumero(contact.Numero || "");
    seteditModalVisible(true);
    setisModalVisible(false);
  }

  function saveEditContact() {
    if (!editingContact || !editNom.trim()) {
      Alert.alert("Erreur", "Le nom ne peut pas être vide");
      return;
    }

    const updates = {};
    updates[`allaccounts/${editingContact.Id}/Nom`] = editNom.trim();
    updates[`allaccounts/${editingContact.Id}/Pseudo`] = editPseudo.trim();
    updates[`allaccounts/${editingContact.Id}/Numero`] = editNumero.trim();

    database.ref().update(updates).then(() => {
      Alert.alert("Succès", "Contact mis à jour");
      seteditModalVisible(false);
      seteditingContact(null);
    }).catch((error) => {
      console.error("Erreur:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le contact");
    });
  }

  async function loadFavorites() {
    try {
      const txt = await AsyncStorage.getItem(storageKey);
      if (txt) {
        setfavoriteIds(JSON.parse(txt));
      } else {
        setfavoriteIds([]);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function saveFavorites(ids) {
    try {
      setfavoriteIds(ids);
      await AsyncStorage.setItem(storageKey, JSON.stringify(ids));
    } catch (err) {
      console.log(err);
    }
  }

  async function loadAdded() {
    try {
      const txt = await AsyncStorage.getItem(addedKey);
      if (txt) {
        setaddedIds(JSON.parse(txt));
      } else {
        setaddedIds([]);
      }
    } catch (err) {
      console.log(err);
    }
  }

  async function loadStory() {
    try {
      const txt = await AsyncStorage.getItem(storyKey);
      if (!txt) {
        setstoryUri(null);
        setstoryAt(null);
        return;
      }

      const saved = JSON.parse(txt);
      const now = Date.now();
      if (!saved?.uri || !saved?.at || now - saved.at > storyDurationMs) {
        setstoryUri(null);
        setstoryAt(null);
        await AsyncStorage.removeItem(storyKey);
        return;
      }

      setstoryUri(saved.uri);
      setstoryAt(saved.at);
    } catch (err) {
      console.log(err);
    }
  }

  async function saveStory(uri, at) {
    try {
      const payload = JSON.stringify({ uri, at });
      await AsyncStorage.setItem(storyKey, payload);
    } catch (err) {
      console.log(err);
    }
  }

  async function saveAdded(ids) {
    try {
      setaddedIds(ids);
      await AsyncStorage.setItem(addedKey, JSON.stringify(ids));
    } catch (err) {
      console.log(err);
    }
  }

  function toggleFavorite(id) {
    if (!id) {
      return;
    }

    if (favoriteIds.includes(id)) {
      saveFavorites(favoriteIds.filter((item) => item != id));
    } else {
      saveFavorites([...favoriteIds, id]);
    }
  }

  function openAddUser() {
    setfullNameInput("");
    setpseudoInput("");
    setphoneInput("");
    setisAddVisible(true);
  }

  async function pickStoryImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission requise", "Autorisez l'acces aux images pour ajouter une story.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!res.canceled) {
      const now = Date.now();
      setstoryUri(res.assets[0].uri);
      setstoryAt(now);
      saveStory(res.assets[0].uri, now);
    }
  }

  function addUserByPhone() {
    const phone = phoneInput.trim();
    if (!phone) {
      Alert.alert("Erreur", "Entrez un numero.");
      return;
    }

    const account = data.find((item) => String(item.Numero || "") === phone);
    if (!account) {
      const Key = ref_all_accounts.push().key;
      const newAccount = {
        Id: Key,
        Nom: fullNameInput.trim() || "Nouveau contact",
        Pseudo: pseudoInput.trim() || "",
        Numero: phone,
        Email: "",
        UrlImage: null,
      };

      ref_all_accounts.child(Key).set(newAccount);
      saveAdded(Array.from(new Set([...addedIds, Key])));
      setisAddVisible(false);
      goToChat(newAccount);
      return;
    }

    if (!addedIds.includes(account.Id)) {
      saveAdded([...addedIds, account.Id]);
    }
    setisAddVisible(false);
    goToChat(account);
  }

  useEffect(() => {
    loadFavorites();
    loadAdded();
    loadStory();

    const onValue = (snapshot) => {
      var d = [];
      snapshot.forEach((one_account) => {
        d.push(one_account.val());
      });
      setdata(d);
      setBrokenImages({});
    };

    ref_all_accounts.on("value", onValue);
  
    return () => {
      ref_all_accounts.off("value", onValue);
    }
  }, [])

  useEffect(() => {
    if (!userid) return;

    const onMessages = (snapshot) => {
      const ids = new Set();

      snapshot.forEach((discussion) => {
        const chat = discussion.child("chat");
        chat.forEach((msg) => {
          const val = msg.val() || {};
          if (val.idsender == userid) {
            ids.add(val.idreceiver);
          } else if (val.idreceiver == userid) {
            ids.add(val.idsender);
          }
        });
      });

      setchatUserIds(Array.from(ids));
    };

    ref_all_messages.on("value", onMessages);
    return () => ref_all_messages.off("value", onMessages);
  }, [userid]);

  const handleSelectAll = () => {
    if (selectAllMode) {
      setselectAllMode(false);
      setselectedChats({});
    } else {
      setselectAllMode(true);
    }
  };

  const handleReadAll = () => {
    if (!readAllMode) {
      setreadAllMode(true);
      // Mark all chats as read (optional: implement marking logic)
    } else {
      setreadAllMode(false);
    }
  };

  const toggleChatSelection = (contactId) => {
    const key = String(contactId);
    setselectedChats((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleArchiveChats = () => {
    const selected = Object.keys(selectedChats).filter((id) => selectedChats[id]);
    if (selected.length === 0) return;
    Alert.alert("Archive", `Archive ${selected.length} chat(s)?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Archive",
        onPress: () => {
          selected.forEach((id) => {
            // Implement archive logic in Firebase
            console.log("Archiving chat:", id);
          });
          setselectedChats({});
          Alert.alert("Success", "Chats archived");
        },
      },
    ]);
  };

  const handleReadChats = () => {
    const selected = Object.keys(selectedChats).filter((id) => selectedChats[id]);
    if (selected.length === 0) return;
    selected.forEach((id) => {
      // Mark as read in Firebase
      console.log("Marking as read:", id);
    });
    setselectedChats({});
    Alert.alert("Success", "Chats marked as read");
  };

  const handleDeleteChats = () => {
    const selected = Object.keys(selectedChats).filter((id) => selectedChats[id]);
    if (selected.length === 0) return;
    Alert.alert(
      "Delete chats",
      `Delete ${selected.length} chat(s)? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await Promise.all(
                selected.map((id) => database.ref(`allMessages/${id}`).remove())
              );

              const selectedSet = new Set(selected.map((id) => String(id)));
              const nextAddedIds = addedIds.filter(
                (id) => !selectedSet.has(String(id))
              );
              await saveAdded(nextAddedIds);

              setselectedChats({});
              setchatUserIds((prev) =>
                prev.filter((id) => !selectedSet.has(String(id)))
              );
              Alert.alert("Success", "Chats deleted");
            } catch (err) {
              console.error("Error deleting chats:", err);
              Alert.alert("Erreur", "Impossible de supprimer les chats");
            }
          },
        },
      ]
    );
  };

  const visibleIds = new Set([...chatUserIds, ...addedIds]);
  const data_discussions = createGroupMode
    ? data.filter((item) => String(item.Id) !== String(userid))
    : data.filter((item) => visibleIds.has(item.Id));

  const data_filtre = data_discussions.filter((item) => {
    const texte = recherche.toLowerCase();
    return (
      (item.Nom && item.Nom.toLowerCase().includes(texte)) ||
      (item.Pseudo && item.Pseudo.toLowerCase().includes(texte)) ||
      (item.Email && item.Email.toLowerCase().includes(texte)) ||
      (item.Numero && item.Numero.toString().includes(texte))
    );
  });

  const data_sorted = [...data_filtre].sort((a, b) => {
    const aFav = favoriteIds.includes(a.Id);
    const bFav = favoriteIds.includes(b.Id);

    if (aFav && !bFav) {
      return -1;
    }
    if (!aFav && bFav) {
      return 1;
    }

    const aName = (a.Nom || a.Pseudo || "").toLowerCase();
    const bName = (b.Nom || b.Pseudo || "").toLowerCase();
    return aName.localeCompare(bName);
  });

  return (
    <ModernBackground
      style={styles.container}
      source={require("../../assets/backgr.jpg")}
    >
      <View style={styles.header}>
        <Text style={styles.welcome}>Welcome back</Text>
        <View style={styles.headerRow}>
          {selectAllMode ? (
            <Text style={styles.logo}>
              {Object.values(selectedChats).filter(Boolean).length} selected
            </Text>
          ) : (
            <>
              <Text style={styles.logo}>Chats</Text>
              <View style={styles.headerPill}>
                <Text style={styles.headerPillText}>{data_sorted.length}</Text>
              </View>
            </>
          )}

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => props.navigation.navigate("Groupe", { userid })}
              style={styles.headerIcon}
            >
              <Ionicons name="people-outline" size={18} color={theme.colors.text} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => props.navigation.navigate("MyAccount", { userid })}
              style={styles.headerIcon}
            >
              <Ionicons name="person-outline" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.chatActionsRow}>
        <TouchableOpacity
          onPress={handleSelectAll}
          style={[styles.chatActionBtn, selectAllMode && styles.chatActionBtnActive]}
        >
          <Ionicons name={selectAllMode ? "checkmark-done-circle" : "ellipsis-vertical"} size={16} color={selectAllMode ? "#fff" : theme.colors.text} />
          <Text style={[styles.chatActionBtnText, selectAllMode && { color: "#fff" }]}>Select chats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleReadAll}
          style={[styles.chatActionBtn, readAllMode && styles.chatActionBtnActive]}
        >
          <Ionicons name={readAllMode ? "checkmark-all" : "mail"} size={16} color={readAllMode ? "#fff" : theme.colors.text} />
          <Text style={[styles.chatActionBtnText, readAllMode && { color: "#fff" }]}>Read all</Text>
        </TouchableOpacity>
      </View>

      

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          placeholder={createGroupMode ? "Search users..." : "Search chats, people..."}
          placeholderTextColor={theme.colors.subtext}
          value={recherche}
          onChangeText={(txt) => {
            setrecherche(txt);
          }}
          style={styles.search}
        ></TextInput>
      </View>

      {createGroupMode && (
        <View style={styles.createGroupPanel}>
          <Text style={styles.createGroupTitle}>Créer un groupe</Text>
          <TextInput
            value={groupName}
            onChangeText={setgroupName}
            placeholder="Nom du groupe"
            placeholderTextColor={theme.colors.subtext}
            style={styles.createGroupInput}
          />
          <Text style={styles.createGroupHint}>
            Sélectionnés: {Object.values(selectedUsers).filter(Boolean).length}
          </Text>
          <TouchableOpacity style={styles.createGroupButton} onPress={createGroupFromSelection}>
            <Text style={styles.createGroupButtonText}>Créer le groupe</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stories} contentContainerStyle={{ paddingRight: 6 }}>
        <TouchableOpacity style={styles.storyItem} onPress={pickStoryImage}>
          <View style={styles.storyAdd}>
            {storyUri ? (
              <Image source={{ uri: storyUri }} style={styles.storyPreview} />
            ) : (
              <Text style={styles.storyAddText}>＋</Text>
            )}
          </View>
          <Text style={styles.storyLabel}>Your story</Text>
        </TouchableOpacity>
        {data_sorted.slice(0, 6).map((item) => (
          <TouchableOpacity key={item.Id} style={styles.storyItem}>
            <View style={styles.storyRing}>
              {item.UrlImage && !brokenImages[item.Id] ? (
                <Image
                  style={styles.storyAvatar}
                  source={{ uri: item.UrlImage }}
                  onError={() => {
                    setBrokenImages((prev) => ({ ...prev, [item.Id]: true }));
                  }}
                />
              ) : (
                <View style={[styles.storyAvatar, styles.storyAvatarPlaceholder, { backgroundColor: getContactNudeColor(item) }]}>
                  <Text style={styles.storyAvatarText}>{getContactInitial(item)}</Text>
                </View>
              )}
            </View>
            <Text style={styles.storyLabel} numberOfLines={1}>{(item.Nom || item.Pseudo || "").split(" ")[0]}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={data_sorted}
        renderItem={({ item }) => {
          const isFav = favoriteIds.includes(item.Id);
          const isSelected = !!selectedUsers[String(item.Id)];
          const isChatSelected = !!selectedChats[String(item.Id)];
          return (
            <View style={styles.contact}>
              <TouchableOpacity
                onPress={() => {
                  if (selectAllMode) {
                    toggleChatSelection(item.Id);
                    return;
                  }
                  if (createGroupMode) {
                    toggleGroupUser(item.Id);
                    return;
                  }
                  setselectedAccount(item);
                  setisModalVisible(true);
                }}
              >
              <View style={[styles.avatarFrame, (item.Online || item.online || item.isOnline) ? styles.avatarFrameOnline : styles.avatarFrameOffline]}>
                {item.UrlImage && !brokenImages[item.Id] ? (
                  <Image
                    style={styles.avatar}
                    source={{ uri: item.UrlImage }}
                    onError={() => {
                      setBrokenImages((prev) => ({ ...prev, [item.Id]: true }));
                    }}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: getContactNudeColor(item) }]}>
                    <Text style={styles.avatarText}>{getContactInitial(item)}</Text>
                  </View>
                )}
                <View style={[styles.presenceDot, (item.Online || item.online || item.isOnline) ? styles.presenceOnline : styles.presenceOffline]} />
              </View>
              {selectAllMode ? (
                <View style={[styles.selectionBadge, isChatSelected && styles.selectionBadgeActive]}>
                  <Text style={styles.selectionBadgeText}>{isChatSelected ? "✓" : ""}</Text>
                </View>
              ) : createGroupMode ? (
                <View style={[styles.selectionBadge, isSelected && styles.selectionBadgeActive]}>
                  <Text style={styles.selectionBadgeText}>{isSelected ? "✓" : ""}</Text>
                </View>
              ) : null}
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.name}> {item.Nom || "Sans nom"} {isFav ? "⭐" : ""}</Text>
                <Text style={styles.info}> {item.Pseudo} - {item.Numero} </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                {!selectAllMode && (
                  <TouchableOpacity
                    onPress={() => {
                      toggleFavorite(item.Id);
                    }}
                    style={[styles.smallButton, { backgroundColor: "transparent" }]}
                  >
                    <Text style={styles.buttonText}>{isFav ? "Fav" : "+Fav"}</Text>
                  </TouchableOpacity>
                )}
                {!selectAllMode && (
                  <TouchableOpacity
                    onPress={() => {
                      callUser(item);
                    }}
                    style={styles.smallButton}
                  >
                  <Text style={styles.buttonText}>Call</Text>
                </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    goToChat(item);
                  }}
                  style={styles.smallButton2}
                >
                  <Text style={styles.buttonText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        keyExtractor={(item, index) => {
          return item.Id || index.toString();
        }}
        style={{ width: "95%", flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 4 }}
      ></FlatList>

      {selectAllMode && Object.values(selectedChats).some(Boolean) && (
        <View style={styles.actionBar}>
          <TouchableOpacity
            style={styles.actionBarBtn}
            onPress={handleArchiveChats}
          >
            <Ionicons name="archive-outline" size={16} color={theme.colors.text} />
            <Text style={styles.actionBarBtnText}>Archive</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBarBtn}
            onPress={handleReadChats}
          >
            <Ionicons name="mail-outline" size={16} color={theme.colors.text} />
            <Text style={styles.actionBarBtnText}>Read</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBarBtn, styles.actionBarBtnDelete]}
            onPress={handleDeleteChats}
          >
            <Ionicons name="trash-outline" size={16} color="#fff" />
            <Text style={[styles.actionBarBtnText, { color: "#fff" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddUser}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      <Modal visible={isAddVisible} transparent animationType="fade" onRequestClose={() => setisAddVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.addModalContent}>
            <View style={styles.addHeader}>
              <View style={styles.addIconCircle}>
                <Text style={styles.addIconText}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addTitle}>Ajouter un contact</Text>
                <Text style={styles.addSubtitle}>Invitez un ami sur WhatsUp</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setisAddVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Nom complet</Text>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIcon}>👤</Text>
                <TextInput
                  placeholder="Sara Bennani"
                  placeholderTextColor={theme.colors.subtext}
                  value={fullNameInput}
                  onChangeText={setfullNameInput}
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Pseudo</Text>
              <View style={styles.fieldWrap}> 
                <Text style={styles.fieldIcon}>@</Text>
                <TextInput
                  placeholder="sara_b"
                  placeholderTextColor={theme.colors.subtext}
                  value={pseudoInput}
                  onChangeText={setpseudoInput}
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Telephone (optionnel)</Text>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIcon}>☎</Text>
                <TextInput
                  placeholder="+212 6 00 00 00 00"
                  placeholderTextColor={theme.colors.subtext}
                  keyboardType="phone-pad"
                  inputMode="numeric"
                  returnKeyType="done"
                  value={phoneInput}
                  onChangeText={setphoneInput}
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.addActions}>
              <TouchableOpacity onPress={() => setisAddVisible(false)} style={styles.addCancelWide}>
                <Text style={styles.addCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addUserByPhone} style={styles.addConfirmWide}>
                <Text style={styles.addConfirmText}>Ajouter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {selectedAccount &&
      <Modal visible={isModalVisible} transparent animationType="fade"
       onRequestClose={() => setisModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image
              source={
                selectedAccount?.UrlImage && !brokenImages[selectedAccount?.Id]
                  ? { uri: selectedAccount.UrlImage }
                  : require("../../assets/prof.png")
              }
              style={{ width: 95, height: 95, borderRadius: 48, marginBottom: 12 }}
              onError={() => {
                if (selectedAccount?.Id) {
                  setBrokenImages((prev) => ({ ...prev, [selectedAccount.Id]: true }));
                }
              }}
            />
            <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8, color: theme.colors.primary }}>
              {selectedAccount?.Nom}
            </Text>
            <Text style={{ color: theme.colors.subtext }}>{selectedAccount?.Pseudo}</Text>
            <Text style={{ color: theme.colors.subtext }}>{selectedAccount?.Numero}</Text>

            <TouchableOpacity
              style={styles.profileCloseBtn}
              onPress={() => setisModalVisible(false)}
            >
              <Text style={styles.profileCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      }

      {/* Modal Edit Contact */}
      <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => seteditModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.editModalContent}>
            <View style={styles.addHeader}>
              <View style={styles.addIconCircle}>
                <Text style={styles.addIconText}>✏️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addTitle}>Modifier le contact</Text>
                <Text style={styles.addSubtitle}>Mettez à jour les informations</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => seteditModalVisible(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Nom</Text>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIcon}>👤</Text>
                <TextInput
                  placeholder="Nom complet"
                  placeholderTextColor={theme.colors.subtext}
                  value={editNom}
                  onChangeText={seteditNom}
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Pseudo</Text>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIcon}>@</Text>
                <TextInput
                  placeholder="Pseudo"
                  placeholderTextColor={theme.colors.subtext}
                  value={editPseudo}
                  onChangeText={seteditPseudo}
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Numéro</Text>
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldIcon}>☎</Text>
                <TextInput
                  placeholder="Numéro de téléphone"
                  placeholderTextColor={theme.colors.subtext}
                  value={editNumero}
                  onChangeText={seteditNumero}
                  keyboardType="phone-pad"
                  style={styles.fieldInput}
                />
              </View>
            </View>

            <View style={styles.addActions}>
              <TouchableOpacity onPress={() => seteditModalVisible(false)} style={styles.addCancelWide}>
                <Text style={styles.addCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEditContact} style={styles.addConfirmWide}>
                <Text style={styles.addConfirmText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ModernBackground>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    backgroundColor: theme.colors.background,
  },
  header: {
    width: "95%",
    backgroundColor: theme.colors.glass,
    padding: 18,
    paddingTop: 22,
    marginBottom: 10,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.52)",
    ...theme.elevation.mid,
  },
  welcome: {
    color: theme.colors.subtext,
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerPill: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  headerPillText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  chatActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 12,
  },
  chatActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: 6,
  },
  chatActionBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chatActionBtnText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  actionBar: {
    position: "absolute",
    bottom: 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBarBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionBarBtnDelete: {
    backgroundColor: "#e14b4b",
    borderColor: "#e14b4b",
  },
  actionBarBtnText: {
    color: theme.colors.text,
    fontWeight: "600",
    fontSize: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#ffffff33",
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    color: "#fff",
    fontSize: 16,
  },
  logo: {
    fontSize: 28,
    color: theme.colors.text,
    fontWeight: "800",
  },
  searchWrap: {
    width: "95%",
    backgroundColor: theme.colors.surface,
    marginBottom: 8,
    borderRadius: 20,
    height: 50,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.low,
  },
  searchIcon: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  search: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
  },
  createGroupPanel: {
    width: "95%",
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  createGroupTitle: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  createGroupInput: {
    backgroundColor: theme.colors.surface,
    color: theme.colors.text,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  createGroupHint: {
    color: theme.colors.subtext,
    fontSize: 12,
    fontWeight: "600",
  },
  createGroupButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
  },
  createGroupButtonText: {
    color: "#fff",
    fontWeight: "800",
  },
  stories: {
    width: "95%",
    height: 86,
    maxHeight: 86,
    marginBottom: 6,
  },
  storyItem: {
    alignItems: "center",
    marginRight: 10,
    width: 64,
  },
  storyRing: {
    padding: 2,
    borderRadius: 999,
    backgroundColor: theme.colors.secondary,
  },
  storyAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  storyAvatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  storyAvatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  storyAdd: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ffffffaa",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff22",
    overflow: "hidden",
  },
  storyPreview: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  storyAddText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  storyLabel: {
    color: theme.colors.text,
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },
  contact: {
    flexDirection: "row",
    backgroundColor: theme.colors.glass,
    marginBottom: 10,
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    ...theme.elevation.low,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.muted,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
  },
  avatarFrame: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  avatarFrameOnline: {
    borderColor: "#40D39B",
  },
  avatarFrameOffline: {
    borderColor: "rgba(255,255,255,0.72)",
  },
  selectionBadge: {
    position: "absolute",
    right: -4,
    top: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionBadgeActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  selectionBadgeText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 12,
  },
  presenceDot: {
    position: "absolute",
    right: 4,
    bottom: 5,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  presenceOnline: {
    backgroundColor: "#40D39B",
  },
  presenceOffline: {
    backgroundColor: "#A7B4B7",
  },
  name: {
    fontWeight: "800",
    fontSize: 16,
    color: theme.colors.text,
  },
  info: {
    color: theme.colors.subtext,
  },
  navButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  navButton2: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginHorizontal: 4,
  },
  smallButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  smallButton2: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginHorizontal: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalContainer: {
    backgroundColor: "#0007",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "84%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.mid,
  },
  addModalContent: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    width: "90%",
    maxWidth: 520,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.mid,
  },
  editModalContent: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 20,
    width: "90%",
    maxWidth: 520,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.mid,
  },
  addHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addIconText: {
    color: "#fff",
    fontSize: 18,
  },
  addTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  addSubtitle: {
    fontSize: 12,
    color: theme.colors.subtext,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  profileCloseBtn: {
    alignSelf: "center",
    marginTop: 18,
    minWidth: 120,
    height: 42,
    paddingHorizontal: 22,
    borderRadius: 21,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileCloseBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
  },
  fieldBlock: {
    marginBottom: 12,
  },
  fieldLabel: {
    color: theme.colors.subtext,
    fontWeight: "700",
    marginBottom: 6,
  },
  fieldWrap: {
    backgroundColor: theme.colors.muted,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  fieldIcon: {
    color: theme.colors.subtext,
    fontSize: 14,
  },
  fieldInput: {
    flex: 1,
    color: theme.colors.text,
  },
  addActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  addCancelWide: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
  },
  addConfirmWide: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
  },
  addCancelText: {
    color: theme.colors.text,
    fontWeight: "700",
  },
  addConfirmText: {
    color: "#fff",
    fontWeight: "700",
  },
  fab: {
    position: "absolute",
    right: 22,
    bottom: 100,
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.elevation.mid,
  },
  fabText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
});
