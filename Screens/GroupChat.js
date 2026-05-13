import React, { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import firebase from "../Config";
import { supabase } from "../Config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppSettings } from "../Config/appSettings";
import EmojiPickerModal from "../components/ui/EmojiPickerModal";
import ModernBackground from "../components/ui/ModernBackground";

const database = firebase.database();
const ref_groups = database.ref("groups");
const ref_all_accounts = database.ref("allaccounts");

const DISCUSSION_BACKGROUND_PRESETS = {
  backgr: require("../assets/backgr.jpg"),
  back: require("../assets/back.jpg"),
  iphone: require("../assets/iphone.jpg"),
  picture: require("../assets/picture.png"),
};

export default function GroupChat(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const groupId = props.route?.params?.groupId;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);

  const [group, setgroup] = useState(null);
  const [accounts, setaccounts] = useState([]);
  const [messages, setmessages] = useState([]);
  const [message, setmessage] = useState("");
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
  const [groupInfoVisible, setgroupInfoVisible] = useState(false);
  const [editGroupModalVisible, seteditGroupModalVisible] = useState(false);
  const [themeModalVisible, setthemeModalVisible] = useState(false);
  const [backgroundModalVisible, setbackgroundModalVisible] = useState(false);
  const [reactionModalVisible, setreactionModalVisible] = useState(false);
  const [nicknameModalVisible, setnicknameModalVisible] = useState(false);
  const [wordEffectModalVisible, setwordEffectModalVisible] = useState(false);
  const [groupNameInput, setgroupNameInput] = useState("");
  const [nicknameInput, setnicknameInput] = useState("");
  const [wordTriggerInput, setwordTriggerInput] = useState("");
  const [wordEmojiInput, setwordEmojiInput] = useState("");
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
    setgroupInfoVisible(false);
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
    setgroupInfoVisible(false);
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
    setgroupInfoVisible(false);
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
    setgroupInfoVisible(false);
    Alert.alert("Succès", newPinState ? "Chat épinglé" : "Chat désépinglé");
  }

  function handleMuteNotifications() {
    if (!groupId || !userid) return;
    const newMuteState = !isGroupMuted;
    ref_groups.child(groupId).child("mutedUsers").child(userid).set(newMuteState ? true : null);
    setisGroupMuted(newMuteState);
    setgroupInfoVisible(false);
    Alert.alert("Succès", newMuteState ? "Notifications mises en sourdine" : "Notifications réactivées");
  }

  function handleSearchMessages() {
    setgroupInfoVisible(false);
    setsearchModalVisible(true);
  }

  function handleViewMembers() {
    setgroupInfoVisible(false);
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
      quality: 0.25,
      base64: true,
    });

    if (!result.canceled && groupId) {
      const asset = result.assets[0];
      try {
        if (!asset.base64) {
          Alert.alert("Erreur", "Impossible de preparer cette image.");
          return;
        }

        const image = `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`;
        if (image.length > 8000000) {
          Alert.alert("Erreur", "L'image est trop grande. Choisissez une image plus petite.");
          return;
        }

        await saveGroupPhoto(image);
      } catch (error) {
        console.error("Erreur lors de la sauvegarde:", error);
        Alert.alert("Erreur", "Impossible de mettre à jour la photo");
      }
    }
  }

  async function saveGroupPhoto(photoUrl) {
    if (!groupId) return;
    await ref_groups.child(groupId).update({
      groupImage: photoUrl,
      groupImageUpdatedAt: new Date().toISOString(),
    });
    Alert.alert("Succès", "Photo du groupe mise à jour");
    setgroupPhotoModalVisible(false);
  }

  function handleChangeGroupPhoto() {
    setgroupInfoVisible(false);
    setTimeout(() => {
      pickGroupPhoto();
    }, 250);
  }

  function openEditGroup() {
    setgroupNameInput(group?.nom || "");
    seteditGroupModalVisible(true);
  }

  async function saveGroupName() {
    if (!groupId || !groupNameInput.trim()) {
      Alert.alert("Erreur", "Entrez un nom de groupe.");
      return;
    }

    await ref_groups.child(groupId).update({
      nom: groupNameInput.trim(),
      updatedAt: new Date().toISOString(),
    });
    seteditGroupModalVisible(false);
  }

  async function saveGroupTheme(color) {
    if (!groupId) return;
    await ref_groups.child(groupId).update({
      themeColor: color,
      updatedAt: new Date().toISOString(),
    });
    setthemeModalVisible(false);
  }

  async function savePresetDiscussionBackground(presetKey) {
    if (!groupId) return;

    await ref_groups.child(groupId).update({
      backgroundPreset: presetKey,
      backgroundImage: null,
      updatedAt: new Date().toISOString(),
    });

    setbackgroundModalVisible(false);
    Alert.alert("Succes", "Background de la discussion mis a jour.");
  }

  async function handleChangeDiscussionBackground() {
    if (!groupId) return;

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access the media library is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled) {
      return;
    }

    const localUri = result.assets?.[0]?.uri;
    if (!localUri) {
      Alert.alert("Erreur", "Impossible de lire l'image choisie.");
      return;
    }

    const filename = `group-bg-${groupId}-${Date.now()}.jpg`;
    const backgroundLink = await uploadFileToSupabase(localUri, filename, "image/jpeg");

    await ref_groups.child(groupId).update({
      backgroundPreset: null,
      backgroundImage: backgroundLink,
      updatedAt: new Date().toISOString(),
    });

    setbackgroundModalVisible(false);
    Alert.alert("Succes", "Background de la discussion mis a jour.");
  }

  async function handleResetDiscussionBackground() {
    if (!groupId) return;

    await ref_groups.child(groupId).update({
      backgroundPreset: null,
      backgroundImage: null,
      updatedAt: new Date().toISOString(),
    });

    Alert.alert("Succes", "Background par defaut restaure.");
  }

  async function saveQuickReaction(reaction) {
    if (!groupId) return;
    await ref_groups.child(groupId).update({
      quickReaction: reaction,
      updatedAt: new Date().toISOString(),
    });
    setreactionModalVisible(false);
  }

  function openNicknameModal() {
    setnicknameInput(group?.nicknames?.[userid] || "");
    setnicknameModalVisible(true);
  }

  async function saveNickname() {
    if (!groupId || !userid) return;
    await ref_groups.child(groupId).child("nicknames").child(String(userid)).set(nicknameInput.trim() || null);
    setnicknameModalVisible(false);
  }

  function openWordEffectModal() {
    setwordTriggerInput("");
    setwordEmojiInput(group?.quickReaction || "✨");
    setwordEffectModalVisible(true);
  }

  async function saveWordEffect() {
    if (!groupId || !wordTriggerInput.trim()) {
      Alert.alert("Erreur", "Entrez un mot.");
      return;
    }

    await ref_groups
      .child(groupId)
      .child("wordEffects")
      .child(wordTriggerInput.trim().toLowerCase())
      .set(wordEmojiInput.trim() || "✨");
    setwordEffectModalVisible(false);
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
  const groupAccent = group?.themeColor || theme.colors.primary;
  const themeChoices = [theme.colors.primary, theme.colors.secondary, theme.colors.highlight, theme.colors.accent, "#2F68FF", "#FF8A00"];
  const reactionChoices = ["👍", "❤️", "😂", "🔥", "👏", "😍", "😮", "🎉"];
  const backgroundChoices = [
    { key: "backgr", label: "Classic", source: DISCUSSION_BACKGROUND_PRESETS.backgr },
    { key: "back", label: "Blue", source: DISCUSSION_BACKGROUND_PRESETS.back },
    { key: "iphone", label: "Light", source: DISCUSSION_BACKGROUND_PRESETS.iphone },
    { key: "picture", label: "Soft", source: DISCUSSION_BACKGROUND_PRESETS.picture },
  ];
  const discussionBackgroundSource = group?.backgroundPreset && DISCUSSION_BACKGROUND_PRESETS[group.backgroundPreset]
    ? DISCUSSION_BACKGROUND_PRESETS[group.backgroundPreset]
    : group?.backgroundImage
      ? { uri: group.backgroundImage }
      : DISCUSSION_BACKGROUND_PRESETS.backgr;

  if (!groupId || !group) {
    return (
      <ModernBackground style={styles.container} source={discussionBackgroundSource}>
        <Text style={{ color: theme.colors.text }}>Groupe introuvable</Text>
      </ModernBackground>
    );
  }

  return (
    <ModernBackground style={styles.container} source={discussionBackgroundSource}>
      <KeyboardAvoidingView
        style={styles.keyboardRoot}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
      >
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => props.navigation.goBack()}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={() => setgroupInfoVisible(true)}
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
        <TouchableOpacity style={styles.headerInfo} onPress={() => setgroupInfoVisible(true)}>
          <Text numberOfLines={1} style={styles.headerTitle}>{group.nom}</Text>
          <Text style={styles.headerSubtitle}>{membersCount} members</Text>
        </TouchableOpacity>
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

      </View>

      <Modal
        visible={groupInfoVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setgroupInfoVisible(false)}
      >
        <View style={styles.groupModalOverlay}>
          <View style={styles.groupModalContent}>
            <Text style={styles.groupModalTitle}>{group?.nom}</Text>
            
            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => setthemeModalVisible(true), 300);
              }}
            >
              <View style={[styles.groupModalIcon, { backgroundColor: groupAccent }]} />
              <Text style={styles.groupModalText}>THEME</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => setbackgroundModalVisible(true), 300);
              }}
            >
              <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.groupModalText}>CHANGE BACKGROUND</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => handleResetDiscussionBackground(), 300);
              }}
            >
              <Ionicons name="refresh-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.groupModalText}>RESET BACKGROUND</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => openNicknameModal(), 300);
              }}
            >
              <Text style={styles.groupModalIconText}>Aa</Text>
              <Text style={styles.groupModalText}>NICKNAME</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => handleAddMember(), 300);
              }}
            >
              <Ionicons name="person-add" size={24} color={theme.colors.primary} />
              <Text style={styles.groupModalText}>ADD MEMBER</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false);
                props.navigation.navigate('MediaGallery', { mode: 'group', id: groupId });
              }}
            >
              <Ionicons name="images" size={24} color={theme.colors.primary} />
              <Text style={styles.groupModalText}>VIEW MEDIA, FILES</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.groupModalOption}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => handleSearchMessages(), 300);
              }}
            >
              <Ionicons name="search" size={24} color={theme.colors.primary} />
              <Text style={styles.groupModalText}>SEARCH IN CONVERSATION</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.groupModalOption, styles.groupModalOptionDanger]}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => leaveGroup(), 300);
              }}
            >
              <Ionicons name="exit-outline" size={24} color={theme.colors.danger} />
              <Text style={[styles.groupModalText, styles.groupModalDangerText]}>LEAVE GROUP</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.groupModalOption, styles.groupModalOptionDanger]}
              onPress={() => {
                setgroupInfoVisible(false); setTimeout(() => deleteGroup(), 300);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.danger} />
              <Text style={[styles.groupModalText, styles.groupModalDangerText]}>DELETE GROUP</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.groupModalClose}
              onPress={() => setgroupInfoVisible(false)}
            >
              <Text style={styles.groupModalCloseText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.messagesList}
        contentContainerStyle={styles.messagesWrap}
        keyboardShouldPersistTaps="handled"
      >
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
              <View style={[styles.messageBubble, mine ? [styles.bubbleMine, { backgroundColor: groupAccent }] : styles.bubbleOther]}>
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
                  <Text style={[styles.messageText, mine && styles.messageTextMine]}>{item.message}</Text>
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
          <TouchableOpacity style={[styles.inputMic, { backgroundColor: groupAccent }]} onPress={() => sendGroupMessage(message, "text")}>
            <MaterialCommunityIcons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.inputMic, { backgroundColor: groupAccent }]}>
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

      <Modal visible={editGroupModalVisible} transparent animationType="fade" onRequestClose={() => seteditGroupModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change group</Text>
              <TouchableOpacity onPress={() => seteditGroupModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.editLabel}>Group name</Text>
            <TextInput
              style={styles.editInput}
              value={groupNameInput}
              onChangeText={setgroupNameInput}
              placeholder="Group name"
              placeholderTextColor={theme.colors.subtext}
            />
            <TouchableOpacity style={styles.changePhotoBtn} onPress={handleChangeGroupPhoto}>
              <Text style={styles.changePhotoBtnText}>Change image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={saveGroupName}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={themeModalVisible} transparent animationType="fade" onRequestClose={() => setthemeModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Theme</Text>
              <TouchableOpacity onPress={() => setthemeModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.swatchGrid}>
              {themeChoices.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[styles.swatch, { backgroundColor: color }, groupAccent === color && styles.swatchActive]}
                  onPress={() => saveGroupTheme(color)}
                />
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={backgroundModalVisible} transparent animationType="fade" onRequestClose={() => setbackgroundModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose background</Text>
              <TouchableOpacity onPress={() => setbackgroundModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.backgroundGrid}>
              {backgroundChoices.map((item) => {
                const isActive = group?.backgroundPreset === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[styles.backgroundChoice, isActive && styles.backgroundChoiceActive]}
                    onPress={() => savePresetDiscussionBackground(item.key)}
                  >
                    <Image source={item.source} style={styles.backgroundThumb} />
                    <Text style={styles.backgroundChoiceLabel}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleChangeDiscussionBackground}>
              <Text style={styles.saveButtonText}>Pick from gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={reactionModalVisible} transparent animationType="fade" onRequestClose={() => setreactionModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick reaction</Text>
              <TouchableOpacity onPress={() => setreactionModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.reactionGrid}>
              {reactionChoices.map((reaction) => (
                <TouchableOpacity key={reaction} style={styles.reactionOption} onPress={() => saveQuickReaction(reaction)}>
                  <Text style={styles.reactionOptionText}>{reaction}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={nicknameModalVisible} transparent animationType="fade" onRequestClose={() => setnicknameModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nickname</Text>
              <TouchableOpacity onPress={() => setnicknameModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.editInput}
              value={nicknameInput}
              onChangeText={setnicknameInput}
              placeholder="Votre surnom dans ce groupe"
              placeholderTextColor={theme.colors.subtext}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveNickname}>
              <Text style={styles.saveButtonText}>Save nickname</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={wordEffectModalVisible} transparent animationType="fade" onRequestClose={() => setwordEffectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Word effect</Text>
              <TouchableOpacity onPress={() => setwordEffectModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.editInput}
              value={wordTriggerInput}
              onChangeText={setwordTriggerInput}
              placeholder="Mot declencheur"
              placeholderTextColor={theme.colors.subtext}
            />
            <TextInput
              style={styles.editInput}
              value={wordEmojiInput}
              onChangeText={setwordEmojiInput}
              placeholder="Emoji / effet"
              placeholderTextColor={theme.colors.subtext}
            />
            <TouchableOpacity style={styles.saveButton} onPress={saveWordEffect}>
              <Text style={styles.saveButtonText}>Save effect</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <EmojiPickerModal
        visible={isEmojiVisible}
        theme={theme}
        onClose={() => setisEmojiVisible(false)}
        onSelect={(emoji) => {
          setmessage((prev) => prev + emoji);
          setisEmojiVisible(false);
        }}
      />
      </KeyboardAvoidingView>

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
    </ModernBackground>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    backgroundColor: theme.colors.background,
  },
  keyboardRoot: {
    flex: 1,
    width: "100%",
  },
  header: {
    marginHorizontal: 12,
    backgroundColor: theme.colors.glass,
    borderRadius: 28,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.52)",
    ...theme.elevation.mid,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: theme.colors.subtext,
    fontSize: 11,
  },
  infoScreen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  infoScroll: {
    flex: 1,
  },
  infoContent: {
    paddingTop: 54,
    paddingHorizontal: 18,
    paddingBottom: 38,
    alignItems: "stretch",
  },
  infoBack: {
    width: 46,
    height: 46,
    justifyContent: "center",
    marginBottom: 12,
  },
  infoAvatarWrap: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 20,
    zIndex: 0,
  },
  infoAvatar: {
    width: 128,
    height: 128,
    borderRadius: 64,
  },
  infoAvatarPlaceholder: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  infoTitle: {
    color: theme.colors.text,
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 20,
  },
  infoLink: {
    color: theme.colors.secondary,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 14,
  },
  infoSectionLabel: {
    color: theme.colors.subtext,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 12,
    marginLeft: 6,
  },
  infoCard: {
    width: "100%",
    backgroundColor: theme.colors.glass,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 28,
  },
  infoRow: {
    width: "100%",
    alignSelf: "stretch",
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 18,
    zIndex: 5,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoRowIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  infoRowIconPlain: {
    width: 38,
    textAlign: "center",
  },
  infoAa: {
    width: 38,
    color: theme.colors.primary,
    fontSize: 28,
    fontWeight: "800",
  },
  infoRowText: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "600",
  },
  infoRowSub: {
    color: theme.colors.subtext,
    fontSize: 15,
    marginTop: 3,
  },
  infoRowValue: {
    color: theme.colors.subtext,
    fontSize: 16,
    maxWidth: 110,
  },
  infoDangerText: {
    color: theme.colors.danger,
  },
  messagesWrap: {
    padding: 14,
    paddingBottom: 20,
    gap: 10,
  },
  messagesList: {
    flex: 1,
  },
  datePill: {
    alignSelf: "center",
    backgroundColor: theme.colors.surface,
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
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleMine: {
    backgroundColor: theme.colors.primary,
    borderTopRightRadius: 8,
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
  messageTextMine: {
    color: "#fff",
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
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.elevation.mid,
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
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    paddingVertical: 8,
  },
  swatch: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 3,
    borderColor: "transparent",
  },
  swatchActive: {
    borderColor: theme.colors.text,
  },
  reactionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  reactionOption: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: theme.colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  reactionOptionText: {
    fontSize: 28,
  },
  backgroundGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  backgroundChoice: {
    width: "47%",
    borderRadius: 14,
    padding: 6,
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: theme.colors.muted,
  },
  backgroundChoiceActive: {
    borderColor: theme.colors.primary,
  },
  backgroundThumb: {
    width: "100%",
    height: 82,
    borderRadius: 10,
  },
  backgroundChoiceLabel: {
    marginTop: 8,
    color: theme.colors.text,
    fontWeight: "700",
    fontSize: 13,
    textAlign: "center",
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
  groupModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  groupModalContent: {
    backgroundColor: theme.colors.glass,
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "80%",
    maxWidth: 350,
  },
  groupModalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 24,
    textAlign: "center",
  },
  groupModalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    gap: 12,
  },
  groupModalOptionDanger: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  groupModalIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  groupModalIconText: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.primary,
    width: 32,
    height: 32,
    textAlign: "center",
    textAlignVertical: "center",
  },
  groupModalText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
  },
  groupModalDangerText: {
    color: theme.colors.danger,
  },
  groupModalClose: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
  },
  groupModalCloseText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.subtext,
  },
});





