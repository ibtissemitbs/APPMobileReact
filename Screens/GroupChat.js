import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Alert,
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
import firebase from "../Config";
import { supabase } from "../Config";
import EmojiSelector from "react-native-emoji-selector";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppSettings } from "../Config/appSettings";

const database = firebase.database();
const ref_groups = database.ref("groups");
const ref_all_accounts = database.ref("allaccounts");

export default function GroupChat(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const groupId = props.route?.params?.groupId;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);

  const [group, setgroup] = useState(null);
  const [accounts, setaccounts] = useState([]);
  const [messages, setmessages] = useState([]);
  const [message, setmessage] = useState("");
  const [menuOpen, setmenuOpen] = useState(false);
  const [isMediaModalVisible, setisMediaModalVisible] = useState(false);
  const [isEmojiVisible, setisEmojiVisible] = useState(false);
  const [addMemberModalVisible, setaddMemberModalVisible] = useState(false);
  const [searchModalVisible, setsearchModalVisible] = useState(false);
  const [searchQuery, setsearchQuery] = useState("");
  const [isGroupPinned, setisGroupPinned] = useState(false);
  const [isGroupMuted, setisGroupMuted] = useState(false);
  const [selectedMembers, setselectedMembers] = useState({});
  const [membersModalVisible, setmembersModalVisible] = useState(false);
  const [editProfileModalVisible, seteditProfileModalVisible] = useState(false);
  const [editingUserId, seteditingUserId] = useState(null);
  const [editFormData, seteditFormData] = useState({
    Pseudo: "",
    Email: "",
    Numero: "",
  });
  const [groupPhotoModalVisible, setgroupPhotoModalVisible] = useState(false);
  const memberIds = group?.members ? Object.keys(group.members) : [];

  useEffect(() => {
    if (!groupId) {
      return;
    }

    const ref_group = ref_groups.child(groupId);
    const ref_messages = ref_group.child("messages");

    ref_group.on("value", (snapshot) => {
      if (snapshot.exists()) {
        setgroup({ key: snapshot.key, ...snapshot.val() });
      } else {
        setgroup(null);
      }
    });

    ref_messages.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((one_message) => {
        d.push({ key: one_message.key, ...one_message.val() });
      });
      setmessages(d);
    });

    return () => {
      ref_group.off();
      ref_messages.off();
    };
  }, [groupId]);

  useEffect(() => {
    ref_all_accounts.on("value", (snapshot) => {
      const d = [];
      snapshot.forEach((one_account) => {
        d.push(one_account.val());
      });
      setaccounts(d);
    });

    return () => {
      ref_all_accounts.off();
    };
  }, []);

  function getAccountName(id) {
    const account = accounts.find((item) => item.Id == id);
    if (account) {
      return account.Pseudo || account.Nom || account.Email || account.Numero;
    }
    return "User";
  }

  function getAccountInitial(id) {
    const name = getAccountName(id);
    return name ? name.charAt(0).toUpperCase() : "U";
  }

  const uploadFileToSupabase = async (url, filename, contentType) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    await supabase.storage.from("Images").upload(filename, arraybuffer, {
      upsert: true,
      contentType: contentType || "application/octet-stream",
    });

    const { data } = await supabase.storage
      .from("Images")
      .createSignedUrl(filename, 60 * 60 * 24 * 7);

    return data?.signedUrl || url;
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the media library is required.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = Date.now() + ".jpg";
      const link = await uploadFileToSupabase(localUri, filename, "image/jpeg");
      sendGroupMessage(link, "image");
      setisMediaModalVisible(false);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the camera is required.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = Date.now() + ".jpg";
      const link = await uploadFileToSupabase(localUri, filename, "image/jpeg");
      sendGroupMessage(link, "image");
      setisMediaModalVisible(false);
    }
  };

  const recordVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the camera is required.");
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["videos"],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = Date.now() + ".mp4";
      const link = await uploadFileToSupabase(localUri, filename, "video/mp4");
      sendGroupMessage(link, "video");
      setisMediaModalVisible(false);
    }
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
    });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];
    const filename = asset.name || Date.now() + ".file";
    const link = await uploadFileToSupabase(asset.uri, filename, asset.mimeType);
    sendGroupMessage(link, "file", { fileName: filename });
    setisMediaModalVisible(false);
  };

  function sendGroupMessage(content, type = "text") {
    if (!groupId || !content || content.trim().length === 0) {
      return;
    }

    const ref_messages = ref_groups.child(groupId).child("messages");
    const Key = ref_messages.push().key;
    ref_messages.child(Key).set({
      sender: userid,
      message: content,
      time: new Date().toLocaleTimeString().slice(0, 5),
      type: type,
    });

    if (type === "text") {
      setmessage("");
    }
  }

  function leaveGroup() {
    if (!groupId || !userid) return;
    Alert.alert("Quitter le groupe", "Voulez-vous quitter ce groupe ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Quitter",
        style: "destructive",
        onPress: () => {
          ref_groups.child(groupId).child("members").child(userid).remove();
          props.navigation.goBack();
        },
      },
    ]);
  }

  function deleteGroup() {
    if (!groupId) return;
    Alert.alert("Supprimer le groupe", "Supprimer ce groupe pour tout le monde ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => {
          ref_groups.child(groupId).remove();
          props.navigation.goBack();
        },
      },
    ]);
  }

  function handleAddMember() {
    setmenuOpen(false);
    setselectedMembers({});
    setaddMemberModalVisible(true);
  }

  function addUserToGroup(userId) {
    if (!groupId || !userId) return;
    const ref_members = ref_groups.child(groupId).child("members");
    ref_members.child(userId).set(true);
    Alert.alert("Succès", "Utilisateur ajouté au groupe");
    setaddMemberModalVisible(false);
  }

  function toggleMemberSelection(userId) {
    setselectedMembers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  }

  function confirmAddMembers() {
    if (!groupId) {
      Alert.alert("Erreur", "ID du groupe non trouvé");
      return;
    }

    const usersToAdd = Object.keys(selectedMembers).filter((userId) => selectedMembers[userId]);
    
    if (usersToAdd.length === 0) {
      Alert.alert("Info", "Aucun utilisateur sélectionné");
      return;
    }

    const updates = {};
    usersToAdd.forEach((userId) => {
      updates[`groups/${groupId}/members/${userId}`] = true;
    });

    database.ref().update(updates).then(() => {
      Alert.alert("Succès", `${usersToAdd.length} utilisateur(s) ajouté(s) au groupe`);
      setselectedMembers({});
      setaddMemberModalVisible(false);
    }).catch((error) => {
      console.error("Erreur lors de l'ajout des utilisateurs:", error);
      Alert.alert("Erreur", "Impossible d'ajouter les utilisateurs");
    });
  }

  function handlePinChat() {
    if (!groupId) return;
    const newPinState = !isGroupPinned;
    ref_groups.child(groupId).child("pinned").set(newPinState);
    setisGroupPinned(newPinState);
    setmenuOpen(false);
    Alert.alert("Succès", newPinState ? "Chat épinglé" : "Chat désépinglé");
  }

  function handleMuteNotifications() {
    if (!groupId || !userid) return;
    const newMuteState = !isGroupMuted;
    ref_groups.child(groupId).child("mutedUsers").child(userid).set(newMuteState ? true : null);
    setisGroupMuted(newMuteState);
    setmenuOpen(false);
    Alert.alert("Succès", newMuteState ? "Notifications mises en sourdine" : "Notifications réactivées");
  }

  function handleSearchMessages() {
    setmenuOpen(false);
    setsearchModalVisible(true);
  }

  function handleViewMembers() {
    setmenuOpen(false);
    setmembersModalVisible(true);
  }

  async function pickGroupPhoto() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission requise", "Permission d'accès à la galerie requise");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && groupId) {
      const localUri = result.assets[0].uri;
      const filename = `group_${groupId}_${Date.now()}.jpg`;
      try {
        const link = await uploadFileToSupabase(localUri, filename, "image/jpeg");
        saveGroupPhoto(link);
      } catch (error) {
        console.error("Erreur lors de l'upload:", error);
        Alert.alert("Erreur", "Impossible de mettre à jour la photo");
      }
    }
  }

  function saveGroupPhoto(photoUrl) {
    if (!groupId) return;
    ref_groups.child(groupId).child("groupImage").set(photoUrl);
    Alert.alert("Succès", "Photo du groupe mise à jour");
    setgroupPhotoModalVisible(false);
  }

  function handleChangeGroupPhoto() {
    setmenuOpen(false);
    pickGroupPhoto();
  }

  function removeUserFromGroup(userId) {
    if (!groupId) return;
    
    Alert.alert(
      "Confirmer la suppression",
      "Êtes-vous sûr de vouloir retirer cet utilisateur du groupe?",
      [
        { text: "Annuler", onPress: () => {}, style: "cancel" },
        {
          text: "Retirer",
          onPress: () => {
            ref_groups.child(groupId).child("members").child(userId).remove();
            Alert.alert("Succès", "Utilisateur retiré du groupe");
          },
          style: "destructive",
        },
      ]
    );
  }

  function openEditProfile(member) {
    seteditingUserId(member.Id);
    seteditFormData({
      Pseudo: member.Pseudo || "",
      Email: member.Email || "",
      Numero: member.Numero || "",
    });
    seteditProfileModalVisible(true);
  }

  function saveProfileChanges() {
    if (!editingUserId) return;

    if (!editFormData.Pseudo.trim()) {
      Alert.alert("Erreur", "Le pseudo ne peut pas être vide");
      return;
    }

    const updates = {};
    updates[`allaccounts/${editingUserId}/Pseudo`] = editFormData.Pseudo.trim();
    updates[`allaccounts/${editingUserId}/Email`] = editFormData.Email.trim();
    updates[`allaccounts/${editingUserId}/Numero`] = editFormData.Numero.trim();

    database.ref().update(updates).then(() => {
      Alert.alert("Succès", "Profil mis à jour avec succès");
      seteditProfileModalVisible(false);
      seteditingUserId(null);
    }).catch((error) => {
      console.error("Erreur lors de la mise à jour:", error);
      Alert.alert("Erreur", "Impossible de mettre à jour le profil");
    });
  }

  const filteredMessages = searchQuery.trim()
    ? messages.filter((msg) => msg.message.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const membersCount = group && group.members ? Object.keys(group.members).length : 0;

  if (!groupId || !group) {
    return (
      <ImageBackground style={styles.container} source={require("../assets/backgr.jpg")}>
        <Text style={{ color: theme.colors.text }}>Groupe introuvable</Text>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground style={styles.container} source={require("../assets/backgr.jpg")}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => props.navigation.goBack()}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => setgroupPhotoModalVisible(true)}
        >
          {group?.groupImage ? (
            <Image 
              source={{ uri: group.groupImage }} 
              style={{ width: 44, height: 44, borderRadius: 22 }}
            />
          ) : (
            <Text style={styles.headerIconText}>{(group?.nom || "G").charAt(0)}</Text>
          )}
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={styles.headerTitle}>{group.nom}</Text>
          <Text style={styles.headerSubtitle}>{membersCount} members</Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert("Indisponible", "Appel de groupe non disponible.")}
        >
          <Ionicons name="videocam" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => Alert.alert("Indisponible", "Appel de groupe non disponible.")}
        >
          <Ionicons name="call" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setmenuOpen(!menuOpen)}>
          <Ionicons name="ellipsis-vertical" size={16} color="#fff" />
        </TouchableOpacity>

        {menuOpen && (
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleAddMember}>
              <Text style={styles.menuItemText}>Add member</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleMuteNotifications}>
              <Text style={styles.menuItemText}>{isGroupMuted ? "Unmute notifications" : "Mute notifications"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handlePinChat}>
              <Text style={styles.menuItemText}>{isGroupPinned ? "Unpin chat" : "Pin chat"}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={handleSearchMessages}>
              <Text style={styles.menuItemText}>Search messages</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleViewMembers}>
              <Text style={styles.menuItemText}>View members ({membersCount})</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleChangeGroupPhoto}>
              <Text style={styles.menuItemText}>📷 Change group photo</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={leaveGroup}>
              <Text style={[styles.menuItemText, styles.menuDanger]}>Leave group</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={deleteGroup}>
              <Text style={[styles.menuItemText, styles.menuDanger]}>Delete group</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.messagesWrap}>
        <View style={styles.datePill}>
          <Text style={styles.dateText}>GROUP CREATED · TODAY</Text>
        </View>

        {messages.map((item) => {
          const mine = item.sender == userid;
          return (
            <View key={item.key} style={[styles.messageRow, mine ? styles.rowRight : styles.rowLeft]}>
              {!mine && (
                <View style={styles.avatarBubble}>
                  <Text style={styles.avatarText}>{getAccountInitial(item.sender)}</Text>
                </View>
              )}
              <View style={[styles.messageBubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                {!mine && (
                  <Text style={styles.messageAuthor}>{getAccountName(item.sender)}</Text>
                )}
                {item.type === "image" ? (
                  <Image source={{ uri: item.message }} style={styles.groupImage} />
                ) : item.type === "video" ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.message)} style={styles.mediaCard}>
                    <MaterialCommunityIcons name="play-circle" size={20} color={theme.colors.primary} />
                    <Text style={styles.mediaText}>Lire video</Text>
                  </TouchableOpacity>
                ) : item.type === "file" ? (
                  <TouchableOpacity onPress={() => Linking.openURL(item.message)} style={styles.mediaCard}>
                    <MaterialCommunityIcons name="file" size={18} color={theme.colors.primary} />
                    <Text style={styles.mediaText}>Ouvrir fichier</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.messageText}>{item.message}</Text>
                )}
                <Text style={styles.messageTime}>{item.time}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.inputWrap}>
        <TouchableOpacity style={styles.inputIcon} onPress={() => setisEmojiVisible(true)}>
          <MaterialCommunityIcons name="emoticon-outline" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        <TextInput
          value={message}
          onChangeText={(txt) => setmessage(txt)}
          placeholder={t("groupMessagePlaceholder")}
          style={styles.input}
        />
        <TouchableOpacity style={styles.inputIcon} onPress={() => setisMediaModalVisible(true)}>
          <MaterialCommunityIcons name="paperclip" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
        {message.trim().length > 0 ? (
          <TouchableOpacity style={styles.inputMic} onPress={() => sendGroupMessage(message, "text")}>
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.inputMic}>
            <MaterialCommunityIcons name="microphone" size={18} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={isMediaModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setisMediaModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalButton} onPress={pickImage}>
              <Text style={styles.modalText}>🖼️ Galerie</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={takePhoto}>
              <Text style={styles.modalText}>📷 Caméra</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={recordVideo}>
              <Text style={styles.modalText}>🎥 Vidéo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={pickDocument}>
              <Text style={styles.modalText}>📄 Document</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: theme.colors.subtext }]}
              onPress={() => setisMediaModalVisible(false)}
            >
              <Text style={styles.modalText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isEmojiVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setisEmojiVisible(false)}
      >
        <View style={styles.emojiOverlay}>
          <View style={styles.emojiCard}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Emojis</Text>
              <TouchableOpacity onPress={() => setisEmojiVisible(false)}>
                <Text style={styles.emojiClose}>Fermer</Text>
              </TouchableOpacity>
            </View>
            <EmojiSelector
              onEmojiSelected={(emoji) => {
                setmessage((prev) => prev + emoji);
                setisEmojiVisible(false);
              }}
              showSearchBar={false}
              columns={8}
              category={"all"}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Add Member */}
      <Modal
        visible={addMemberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setaddMemberModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add members</Text>
                <Text style={styles.modalSubtitle}>to {group?.name || "Group"}</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setaddMemberModalVisible(false)}
                style={{ paddingLeft: 15 }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.selectedCount}>Selected: {Object.values(selectedMembers).filter(Boolean).length} | Total: {group?.members ? Object.keys(group.members).length : 0}</Text>

            <ScrollView style={{ maxHeight: 400 }}>
              {accounts.map((account) => {
                // Vérifier si l'utilisateur est déjà membre du groupe
                const isMember = group?.members && Object.keys(group.members).includes(String(account.Id));
                // Ne pas afficher les membres existants
                if (isMember) return null;

                const isSelected = selectedMembers[account.Id];
                return (
                  <TouchableOpacity
                    key={account.Id}
                    style={styles.userListItem}
                    onPress={() => toggleMemberSelection(account.Id)}
                  >
                    <View style={styles.userAvatar}>
                      <Text style={styles.userAvatarText}>{account.Pseudo ? account.Pseudo.charAt(0).toUpperCase() : "U"}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.userName}>{account.Pseudo || account.Nom || "User"}</Text>
                      <Text style={styles.userEmail}>{account.Email || account.Numero || "offline"}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                      {isSelected && <Text style={styles.checkboxMark}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={confirmAddMembers}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Search Messages */}
      <Modal
        visible={searchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setsearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rechercher des messages</Text>
              <TouchableOpacity 
                onPress={() => setsearchModalVisible(false)}
                style={{ paddingLeft: 15 }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              placeholder="Rechercher..."
              value={searchQuery}
              onChangeText={setsearchQuery}
              style={styles.searchInput}
              placeholderTextColor={theme.colors.subtext}
            />
            <ScrollView style={{ maxHeight: 400 }}>
              {filteredMessages.length > 0 ? (
                filteredMessages.map((msg) => (
                  <View key={msg.key} style={styles.searchResultItem}>
                    <Text style={styles.searchResultUser}>{getAccountName(msg.sender)}</Text>
                    <Text style={styles.searchResultMessage}>{msg.message}</Text>
                    <Text style={styles.searchResultTime}>{msg.time}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.colors.subtext, textAlign: "center", marginTop: 20 }}>
                  Aucun message trouvé
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Members Management */}
      <Modal
        visible={membersModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setmembersModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Members ({membersCount})</Text>
              <TouchableOpacity 
                onPress={() => setmembersModalVisible(false)}
                style={{ paddingLeft: 15 }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              {group?.members && Object.keys(group.members).length > 0 ? (
                Object.keys(group.members).map((memberId) => {
                  const member = accounts.find((acc) => String(acc.Id) === String(memberId));
                  if (!member) return null;
                  
                  const isCurrentUser = memberId === userid;
                  
                  return (
                    <View key={memberId} style={styles.memberItem}>
                      <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.userAvatarText}>
                            {member.Pseudo ? member.Pseudo.charAt(0).toUpperCase() : "U"}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.userName}>
                            {member.Pseudo || member.Nom || "User"}
                            {isCurrentUser && <Text style={{ color: theme.colors.primary }}> (Vous)</Text>}
                          </Text>
                          <Text style={styles.userEmail}>{member.Email || member.Numero}</Text>
                        </View>
                      </View>
                      
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {isCurrentUser && (
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => openEditProfile(member)}
                          >
                            <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                          </TouchableOpacity>
                        )}
                        {!isCurrentUser && (
                          <TouchableOpacity 
                            style={styles.deleteButton}
                            onPress={() => removeUserFromGroup(memberId)}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ff4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text style={{ color: theme.colors.subtext, textAlign: "center", marginTop: 20 }}>
                  Aucun membre
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Group Photo Display */}
      <Modal
        visible={groupPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setgroupPhotoModalVisible(false)}
      >
        <View style={styles.photoModalOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => setgroupPhotoModalVisible(false)}
          />
          <View style={styles.photoModalCard}>
            {group?.groupImage ? (
              <Image 
                source={{ uri: group.groupImage }} 
                style={styles.largeGroupPhoto}
              />
            ) : (
              <View style={[styles.largeGroupPhoto, { backgroundColor: theme.colors.primary, alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontSize: 60, color: "#fff" }}>{(group?.nom || "G").charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.photoModalTitle}>{group?.nom}</Text>
            <Text style={styles.photoModalSubtitle}>{membersCount} members</Text>
            
            <TouchableOpacity 
              style={styles.changePhotoBtn}
              onPress={() => {
                setgroupPhotoModalVisible(false);
                pickGroupPhoto();
              }}
            >
              <Text style={styles.changePhotoBtnText}>📷 Change Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.closePhotoBtn}
              onPress={() => setgroupPhotoModalVisible(false)}
            >
              <Text style={styles.closePhotoBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => setgroupPhotoModalVisible(false)}
          />
        </View>
      </Modal>

      {/* Modal Edit Profile */}
      <Modal
        visible={editProfileModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => seteditProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity 
                onPress={() => seteditProfileModalVisible(false)}
                style={{ paddingLeft: 15 }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }}>
              <View style={styles.editFormGroup}>
                <Text style={styles.editLabel}>Pseudo</Text>
                <TextInput
                  style={styles.editInput}
                  value={editFormData.Pseudo}
                  onChangeText={(text) => seteditFormData({ ...editFormData, Pseudo: text })}
                  placeholder="Entrez votre pseudo"
                  placeholderTextColor={theme.colors.subtext}
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editLabel}>Email</Text>
                <TextInput
                  style={styles.editInput}
                  value={editFormData.Email}
                  onChangeText={(text) => seteditFormData({ ...editFormData, Email: text })}
                  placeholder="Entrez votre email"
                  placeholderTextColor={theme.colors.subtext}
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.editFormGroup}>
                <Text style={styles.editLabel}>Numéro</Text>
                <TextInput
                  style={styles.editInput}
                  value={editFormData.Numero}
                  onChangeText={(text) => seteditFormData({ ...editFormData, Numero: text })}
                  placeholder="Entrez votre numéro"
                  placeholderTextColor={theme.colors.subtext}
                  keyboardType="phone-pad"
                />
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={saveProfileChanges}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.primaryDark,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: {
    color: "#fff",
    fontSize: 16,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  headerIconText: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  headerInfo: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: "#e7f6f1",
    fontSize: 11,
  },
  menuCard: {
    position: "absolute",
    right: 12,
    top: 60,
    backgroundColor: "#f1fbf7",
    borderRadius: 18,
    paddingVertical: 6,
    width: 210,
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 10,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuItemText: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  menuDanger: {
    color: "#cc4b4b",
  },
  menuDivider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  messagesWrap: {
    padding: 14,
    paddingBottom: 100,
    gap: 10,
  },
  datePill: {
    alignSelf: "center",
    backgroundColor: "#ffffff88",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dateText: {
    fontSize: 10,
    color: theme.colors.subtext,
    fontWeight: "700",
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  avatarBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleOther: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
  },
  messageAuthor: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.primary,
    marginBottom: 2,
  },
  messageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.subtext,
    marginTop: 4,
  },
  groupImage: {
    width: 190,
    height: 190,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  mediaCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#e8f1ec",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mediaText: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  inputWrap: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
  },
  inputMic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inputMicText: {
    color: "#fff",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    maxWidth: 500,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 24,
    gap: 8,
  },
  modalButton: {
    padding: 16,
    marginVertical: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  emojiOverlay: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "flex-end",
  },
  emojiCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    maxHeight: "70%",
  },
  emojiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  emojiTitle: {
    fontWeight: "800",
    color: theme.colors.text,
  },
  emojiClose: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalSubtitle: {
    color: theme.colors.subtext,
    fontSize: 14,
    marginTop: 2,
  },
  selectedCount: {
    color: theme.colors.subtext,
    fontSize: 13,
    marginBottom: 12,
    fontWeight: "600",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkboxMark: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  modalClose: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
    paddingLeft: 10,
  },
  userListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  userName: {
    fontWeight: "700",
    color: theme.colors.text,
    fontSize: 15,
  },
  userEmail: {
    color: theme.colors.subtext,
    fontSize: 12,
    marginTop: 3,
  },
  searchInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: theme.colors.text,
    fontSize: 14,
  },
  searchResultItem: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  searchResultUser: {
    fontWeight: "700",
    color: theme.colors.primary,
    fontSize: 12,
  },
  searchResultMessage: {
    color: theme.colors.text,
    marginTop: 4,
    fontSize: 14,
  },
  searchResultTime: {
    color: theme.colors.subtext,
    fontSize: 11,
    marginTop: 4,
  },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: "#f5f5f5",
    justifyContent: "space-between",
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  editFormGroup: {
    marginBottom: 16,
  },
  editLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  editInput: {
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: theme.colors.text,
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoModalCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "85%",
    maxWidth: 500,
    alignItems: "center",
  },
  largeGroupPhoto: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 20,
  },
  photoModalTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  photoModalSubtitle: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 20,
  },
  changePhotoBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 12,
    width: "100%",
    alignItems: "center",
  },
  changePhotoBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  closePhotoBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  closePhotoBtnText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
});
