import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as Audio from "expo-av/build/Audio";
import * as DocumentPicker from "expo-document-picker";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  Linking,
  Modal,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useEffect, useState } from "react";
import firebase from "../Config";
import { supabase } from "../Config";
import IconButton from "../components/ui/IconButton";
import EmojiSelector from "react-native-emoji-selector";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppSettings } from "../Config/appSettings";

const database = firebase.database();
const ref_all_messages = database.ref("allMessages");
const ref_all_accounts = database.ref("allaccounts");

export default function Chat(props) {
  const currentid = props.route?.params?.currentid;
  const secondid = props.route?.params?.secondid;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);

  const [data, setdata] = useState([]);
  const [secondistyping, setSecondIsTyping] = useState(false);
  const [isMediaModalVisible, setisMediaModalVisible] = useState(false);
  const [isReactionVisible, setisReactionVisible] = useState(false);
  const [isActionVisible, setisActionVisible] = useState(false);
  const [isEmojiVisible, setisEmojiVisible] = useState(false);

  const [message, setMessage] = useState("");
  const [recording, setRecording] = useState(null);
  const [recherche, setrecherche] = useState("");
  const [filtre, setfiltre] = useState("Tous");
  const [showFiltre, setshowFiltre] = useState(false);

  const [selectedMessage, setselectedMessage] = useState(null);
  const [replyTo, setreplyTo] = useState(null);
  const [editMessageKey, seteditMessageKey] = useState(null);
  const [secondAccount, setSecondAccount] = useState(null);
  const [contactPhotoModalVisible, setcontactPhotoModalVisible] = useState(false);

  if (!currentid || !secondid) {
    return (
      <ImageBackground style={styles.container} source={require("../assets/backgr.jpg")}>
        <Text>Parametres du chat manquants</Text>
      </ImageBackground>
    );
  }

  const iddiscussion =
    currentid > secondid ? currentid + secondid : secondid + currentid;
  const ref_discussion = ref_all_messages.child(iddiscussion);
  const ref_chat = ref_discussion.child("chat");
  const ref_typing = ref_discussion.child("isTyping");
  const ref_me_istyping = ref_typing.child(String(currentid));
  const ref_second_istyping = ref_typing.child(String(secondid));

  useEffect(() => {
    ref_chat.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((one_message) => {
        d.push({
          key: one_message.key,
          ...one_message.val(),
        });
      });
      setdata(d);
    });

    ref_second_istyping.on("value", (snapshot) => {
      setSecondIsTyping(snapshot.val());
    });

    return () => {
      ref_me_istyping.set(false);
      ref_chat.off();
      ref_second_istyping.off();
    };
  }, [currentid, secondid]);

  useEffect(() => {
    if (!secondid) return;
    const ref_second = ref_all_accounts.child(String(secondid));
    const onValue = (snapshot) => {
      setSecondAccount(snapshot.val() || null);
    };
    ref_second.on("value", onValue);
    return () => ref_second.off("value", onValue);
  }, [secondid]);

  const openPhoneCall = () => {
    const numero = secondAccount?.Numero || secondAccount?.numero;
    if (!numero) {
      Alert.alert("Numero introuvable", "Ce contact n'a pas de numero.");
      return;
    }
    Linking.openURL(`tel:${numero}`);
  };

  const sendMessage = (msg, type, extra = {}) => {
    const Key = ref_chat.push().key;
    const ref_message = ref_chat.child(Key);

    ref_message.set({
      idsender: currentid,
      idreceiver: secondid,
      message: msg,
      time: new Date().toLocaleTimeString(),
      type: type,
      edited: false,
      replyTo: extra.replyTo ? extra.replyTo : null,
    });
  };

  const clearDiscussion = () => {
    Alert.alert("Supprimer la discussion", "Voulez-vous vider toute la discussion ?", [
      {
        text: "Annuler",
        style: "cancel",
      },
      {
        text: "Vider",
        style: "destructive",
        onPress: () => {
          ref_chat.remove();
        },
      },
    ]);
  };

  const openReaction = (item) => {
    setselectedMessage(item);
    setisReactionVisible(true);
  };

  const openActions = (item) => {
    setselectedMessage(item);
    setisActionVisible(true);
  };

  const reactMessage = (reaction) => {
    if (!selectedMessage) {
      return;
    }

    ref_chat
      .child(selectedMessage.key)
      .child("reactions")
      .child(currentid)
      .set(reaction);

    setisReactionVisible(false);
    setselectedMessage(null);
  };

  const getReactions = (item) => {
    var reactions = [];
    if (item.reactions) {
      Object.values(item.reactions).forEach((reaction) => {
        if (!reactions.includes(reaction)) {
          reactions.push(reaction);
        }
      });
    }
    return reactions;
  };

  const getStarsCount = (item) => {
    if (!item.starredBy) {
      return 0;
    }

    var count = 0;
    Object.values(item.starredBy).forEach((value) => {
      if (value === true) {
        count = count + 1;
      }
    });
    return count;
  };

  const isMessageStarredByMe = (item) => {
    return item.starredBy && item.starredBy[currentid] === true;
  };

  const toggleStar = () => {
    if (!selectedMessage) {
      return;
    }

    const ref_star = ref_chat
      .child(selectedMessage.key)
      .child("starredBy")
      .child(String(currentid));

    if (selectedMessage.starredBy && selectedMessage.starredBy[currentid]) {
      ref_star.remove();
    } else {
      ref_star.set(true);
    }

    setisActionVisible(false);
  };

  const setReplyMessage = () => {
    if (!selectedMessage) {
      return;
    }

    var previewMessage = "";
    if (selectedMessage.type == "text") {
      previewMessage = selectedMessage.message || "";
    } else {
      previewMessage = "Message " + (selectedMessage.type || "media");
    }

    setreplyTo({
      key: selectedMessage.key,
      idsender: selectedMessage.idsender,
      type: selectedMessage.type,
      message: previewMessage,
    });

    setisActionVisible(false);
  };

  const startEditMessage = () => {
    if (
      !selectedMessage ||
      selectedMessage.idsender != currentid ||
      selectedMessage.type != "text"
    ) {
      setisActionVisible(false);
      return;
    }

    setMessage(selectedMessage.message || "");
    seteditMessageKey(selectedMessage.key);
    setreplyTo(null);
    setisActionVisible(false);
  };

  const deleteMessage = () => {
    if (!selectedMessage || selectedMessage.idsender != currentid) {
      setisActionVisible(false);
      return;
    }

    ref_chat.child(selectedMessage.key).remove();
    setisActionVisible(false);
    setselectedMessage(null);
  };

  const shareMessage = async () => {
    if (!selectedMessage) {
      setisActionVisible(false);
      return;
    }

    var textToShare = "Message";
    if (selectedMessage.type == "text") {
      textToShare = selectedMessage.message || "";
    } else if (selectedMessage.type == "image") {
      textToShare = "Image: " + (selectedMessage.message || "");
    } else if (selectedMessage.type == "audio") {
      textToShare = "Audio: " + (selectedMessage.message || "");
    } else if (selectedMessage.type == "map" || selectedMessage.type == "location") {
      textToShare = "Position: " + (selectedMessage.message || "");
    }

    try {
      await Share.share({
        message: textToShare,
      });
    } catch (err) {
      console.log(err);
    }

    setisActionVisible(false);
  };

  const uploadImageToSupabase = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    const filenameInSupabase = Date.now() + ".jpg";

    await supabase.storage
      .from("Images")
      .upload(filenameInSupabase, arraybuffer, {
        upsert: true,
      });

    const { data } = await supabase.storage
      .from("Images")
      .createSignedUrl(filenameInSupabase, 60 * 60 * 24 * 7);

    return data?.signedUrl || url;
  };

  const uploadAudioToSupabase = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();

    const filenameInSupabase = Date.now() + ".m4a";

    await supabase.storage
      .from("Images")
      .upload(filenameInSupabase, arraybuffer, {
        upsert: true,
        contentType: "audio/m4a",
      });

    const { data } = await supabase.storage
      .from("Images")
      .createSignedUrl(filenameInSupabase, 60 * 60 * 24 * 7);

    return data?.signedUrl || url;
  };

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
      const link = await uploadImageToSupabase(localUri);
      sendMessage(link, "image");
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
      const link = await uploadImageToSupabase(localUri);
      sendMessage(link, "image");
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
      sendMessage(link, "video");
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
    sendMessage(link, "file", { fileName: filename });
    setisMediaModalVisible(false);
  };

  const sendLocation = async () => {
    const permissionResult = await Location.requestForegroundPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert("Permission required", "Permission to access location is required.");
      return;
    }

    const position = await Location.getCurrentPositionAsync({});
    const currentLocation =
      "https://www.google.com/maps/search/?api=1&query=" +
      position.coords.latitude +
      "," +
      position.coords.longitude;

    sendMessage(currentLocation, "map");
    setisMediaModalVisible(false);
  };

  const openLocation = (location) => {
    if (!location) {
      return;
    }

    var url = location;
    if (!location.startsWith("http")) {
      url =
        "https://www.google.com/maps/search/?api=1&query=" +
        encodeURIComponent(location);
    }

    Linking.openURL(url);
  };

  const startRecording = async () => {
    try {
      const permissionResult = await Audio.requestPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert("Permission required", "Permission to access microphone is required.");
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (err) {
      console.log(err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        return;
      }

      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        const link = await uploadAudioToSupabase(uri);
        sendMessage(link, "audio");
      }
    } catch (err) {
      console.log(err);
      setRecording(null);
    }
  };

  const playAudio = async (url) => {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri: url });
      await sound.playAsync();
    } catch (err) {
      console.log(err);
    }
  };

  const sendTextMessage = () => {
    if (message.trim().length === 0) {
      return;
    }

    if (editMessageKey) {
      ref_chat.child(editMessageKey).update({
        message: message,
        edited: true,
        editedAt: new Date().toLocaleTimeString(),
      });
      seteditMessageKey(null);
      setMessage("");
      ref_me_istyping.set(false);
      return;
    }

    var replyData = null;
    if (replyTo) {
      replyData = {
        idsender: replyTo.idsender,
        type: replyTo.type,
        message: replyTo.message,
      };
    }

    sendMessage(message, "text", { replyTo: replyData });
    setMessage("");
    setreplyTo(null);
    ref_me_istyping.set(false);
  };

  const data_filtre = data.filter((item) => {
    var texte = recherche.toLowerCase();
    var type = item.type ? item.type : "text";
    var messageText = item.message ? item.message.toString().toLowerCase() : "";
    var hasTextMatch =
      messageText.includes(texte) || type.toLowerCase().includes(texte);

    if (filtre == "map" && type == "location") {
      return hasTextMatch;
    }

    if (filtre == "star") {
      return isMessageStarredByMe(item) && hasTextMatch;
    }

    if (filtre != "Tous" && type != filtre) {
      return false;
    }

    return hasTextMatch;
  });

  return (
    <ImageBackground style={styles.container} source={require("../assets/backgr.jpg")}>
      <View style={styles.headerWrap}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity
            onPress={() => {
              props.navigation.goBack();
            }}
            style={styles.iconCircle}
          >
            <Text style={styles.iconCircleText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <TouchableOpacity
              style={styles.avatarBadge}
              onPress={() => setcontactPhotoModalVisible(true)}
            >
              {secondAccount?.UrlImage ? (
                <Image 
                  source={{ uri: secondAccount.UrlImage }} 
                  style={{ width: 40, height: 40, borderRadius: 20 }}
                />
              ) : (
                <Text style={styles.avatarText}>{secondAccount?.Pseudo ? secondAccount.Pseudo.charAt(0).toUpperCase() : "U"}</Text>
              )}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Discussion</Text>
              <Text style={styles.headerSubTitle}>
                {secondistyping === true ? "en train d'ecrire..." : "Actif"}
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={openPhoneCall}
            >
              <Ionicons name="videocam" size={18} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={openPhoneCall}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.searchZone}>
          <TextInput
            placeholder={t("searchMedia")}
            value={recherche}
            onChangeText={(txt) => {
              setrecherche(txt);
            }}
            style={styles.searchInput}
          ></TextInput>
          <TouchableOpacity
            onPress={() => {
              setshowFiltre(!showFiltre);
            }}
            style={styles.filterButton}
          >
            <MaterialCommunityIcons name="tune" size={20} color={theme.colors.primary} />
          </TouchableOpacity>

          {showFiltre && (
            <View style={styles.filterList}>
              {["Tous", "text", "image", "audio", "map", "star"].map((item) => {
                const isActive = filtre === item;
                return (
                  <TouchableOpacity
                    key={item}
                    onPress={() => {
                      setfiltre(item);
                      setshowFiltre(false);
                    }}
                    style={[styles.filterListItem, isActive && styles.filterListItemActive]}
                  >
                    <Text style={[styles.filterListItemText, isActive && styles.filterListItemTextActive]}>
                      {item === "Tous" ? "📋 Tous" : item === "text" ? "💬 Texte" : item === "image" ? "🖼️ Images" : item === "audio" ? "🔊 Audio" : item === "map" ? "📍 Localisation" : item === "star" ? "⭐ Favoris" : item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={data_filtre}
        keyExtractor={(item) => item.key}
        style={{ width: "95%" }}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          var messageIsImage =
            item.type == "image" ||
            (typeof item.message == "string" &&
              (item.message.startsWith("http") ||
                item.message.startsWith("blob:") ||
                item.message.startsWith("data:")));
          var starsCount = getStarsCount(item);

          return (
            <TouchableOpacity
              onPress={() => {
                openReaction(item);
              }}
              onLongPress={() => {
                openActions(item);
              }}
              style={currentid == item.idsender ? styles.myMessage : styles.hisMessage}
            >
              {item.replyTo && (
                <View style={styles.replyPreviewBubble}>
                  <Text style={styles.replyPreviewLabel}>Reponse</Text>
                  <Text numberOfLines={1} style={styles.replyPreviewText}>
                    {item.replyTo.type == "text"
                      ? item.replyTo.message
                      : "Message " + (item.replyTo.type || "media")}
                  </Text>
                </View>
              )}

              {item.type == "location" || item.type == "map" ? (
                <TouchableOpacity
                  onPress={() => {
                    openLocation(item.message);
                  }}
                  style={styles.mapCard}
                >
                  <Text style={styles.mapText}>Ouvrir Google Maps</Text>
                </TouchableOpacity>
              ) : item.type == "audio" ? (
                <TouchableOpacity
                  onPress={() => {
                    playAudio(item.message);
                  }}
                  style={styles.audioCard}
                >
                  <Text style={styles.audioText}>Lire audio</Text>
                </TouchableOpacity>
              ) : item.type == "video" ? (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(item.message);
                  }}
                  style={styles.audioCard}
                >
                  <Text style={styles.audioText}>Lire video</Text>
                </TouchableOpacity>
              ) : item.type == "file" ? (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(item.message);
                  }}
                  style={styles.audioCard}
                >
                  <Text style={styles.audioText}>Ouvrir fichier</Text>
                </TouchableOpacity>
              ) : messageIsImage ? (
                <Image source={{ uri: item.message }} resizeMode="cover" style={styles.imageMessage} />
              ) : (
                <Text style={styles.messageText}>{item.message}</Text>
              )}

              <View style={styles.messageMetaRow}>
                <Text style={styles.messageTime}>
                  {item.time}
                  {item.edited ? " • modifie" : ""}
                </Text>
                {starsCount > 0 && <Text style={styles.starCount}>⭐ {starsCount}</Text>}
              </View>

              <View style={{ flexDirection: "row", marginTop: 3 }}>
                {getReactions(item).map((reaction) => {
                  return (
                    <Text key={reaction} style={{ marginHorizontal: 3, fontSize: 16 }}>
                      {reaction}
                    </Text>
                  );
                })}
              </View>
            </TouchableOpacity>
          );
        }}
      ></FlatList>

      {replyTo && (
        <View style={styles.replyComposer}>
          <Text numberOfLines={1} style={styles.replyComposerText}>
            Reponse a: {replyTo.type == "text" ? replyTo.message : "message " + replyTo.type}
          </Text>
          <TouchableOpacity
            onPress={() => {
              setreplyTo(null);
            }}
          >
            <Text style={styles.cancelReply}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      {editMessageKey && (
        <View style={styles.replyComposer}>
          <Text style={styles.replyComposerText}>Mode edition</Text>
          <TouchableOpacity
            onPress={() => {
              seteditMessageKey(null);
              setMessage("");
            }}
          >
            <Text style={styles.cancelReply}>Annuler</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.composerWrap}>
        <View style={styles.composerInner}>
          <TouchableOpacity
            onPress={() => {
              setisMediaModalVisible(true);
            }}
            style={styles.composerIcon}
          >
            <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setisEmojiVisible(true)}
            style={styles.composerIcon}
          >
            <MaterialCommunityIcons name="emoticon-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          <TextInput
            value={message ? message : ""}
            onChangeText={(txt) => {
              setMessage(txt);
              ref_me_istyping.set(txt.trim().length > 0);
            }}
            onFocus={() => {
              if (message.trim().length > 0) {
                ref_me_istyping.set(true);
              }
            }}
            onBlur={() => {
              ref_me_istyping.set(false);
            }}
            placeholder={t("messagePlaceholder")}
            placeholderTextColor={theme.colors.subtext}
            style={styles.composerInput}
          ></TextInput>

          <TouchableOpacity onPress={pickImage} style={styles.composerIcon}>
            <MaterialCommunityIcons name="paperclip" size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          {message.trim().length > 0 ? (
            <TouchableOpacity onPress={sendTextMessage} style={styles.sendBtn}>
              <MaterialCommunityIcons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                if (recording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              style={styles.sendBtn}
            >
              <MaterialCommunityIcons name={recording ? "stop" : "microphone"} size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
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
            <TouchableOpacity style={styles.modalButton} onPress={sendLocation}>
              <Text style={styles.modalText}>📍 Position GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: "transparent" }]} onPress={() => setisMediaModalVisible(false)}>
              <Text style={[styles.modalText, { color: theme.colors.primary }]}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isReactionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setisReactionVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View
            style={[
              styles.modalContent,
              { flexDirection: "row", justifyContent: "space-around" },
            ]}
          >
            {["\uD83D\uDC4D", "\u2764\uFE0F", "\uD83D\uDE02", "\uD83D\uDE2E", "\uD83D\uDE22"].map(
              (reaction) => {
                return (
                  <TouchableOpacity
                    key={reaction}
                    onPress={() => {
                      reactMessage(reaction);
                    }}
                  >
                    <Text style={{ fontSize: 30 }}>{reaction}</Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isActionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setisActionVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setisActionVisible(false);
                setisReactionVisible(true);
              }}
            >
              <Text style={styles.modalText}>React</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={setReplyMessage}>
              <Text style={styles.modalText}>Repondre</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={shareMessage}>
              <Text style={styles.modalText}>Partager</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalButton} onPress={toggleStar}>
              <Text style={styles.modalText}>Favori</Text>
            </TouchableOpacity>
            {selectedMessage &&
              selectedMessage.idsender == currentid &&
              selectedMessage.type == "text" && (
                <TouchableOpacity style={styles.modalButton} onPress={startEditMessage}>
                  <Text style={styles.modalText}>Modifier</Text>
                </TouchableOpacity>
              )}
            {selectedMessage && selectedMessage.idsender == currentid && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "transparent" }]}
                onPress={deleteMessage}
              >
                <Text style={styles.modalText}>Supprimer</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: "transparent" }]}
              onPress={() => setisActionVisible(false)}
            >
              <Text style={styles.modalText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Contact Photo */}
      <Modal
        visible={contactPhotoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setcontactPhotoModalVisible(false)}
      >
        <View style={styles.contactPhotoOverlay}>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => setcontactPhotoModalVisible(false)}
          />
          <View style={styles.contactPhotoCard}>
            {secondAccount?.UrlImage ? (
              <Image 
                source={{ uri: secondAccount.UrlImage }} 
                style={styles.largeContactPhoto}
              />
            ) : (
              <View style={[styles.largeContactPhoto, { backgroundColor: "#27a89f", alignItems: "center", justifyContent: "center" }]}>
                <Text style={{ fontSize: 80, color: "#fff" }}>
                  {secondAccount?.Pseudo ? secondAccount.Pseudo.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
            <Text style={styles.contactPhotoName}>{secondAccount?.Pseudo || secondAccount?.Nom || "User"}</Text>
            <Text style={styles.contactPhotoEmail}>{secondAccount?.Email || secondAccount?.Numero}</Text>
            
            <TouchableOpacity 
              style={styles.closeContactPhotoBtn}
              onPress={() => setcontactPhotoModalVisible(false)}
            >
              <Text style={styles.closeContactPhotoBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={() => setcontactPhotoModalVisible(false)}
          />
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
                setMessage(message + emoji);
                setisEmojiVisible(false);
              }}
              showSearchBar={false}
              columns={8}
              category={"all"}
            />
          </View>
        </View>
      </Modal>
    </ImageBackground>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  headerWrap: {
    width: "100%",
    paddingTop: 30,
    backgroundColor: theme.colors.primaryDark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
    marginBottom: 6,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  avatarBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff33",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#fff6",
  },
  avatarText: {
    color: "#fff",
    fontWeight: "700",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubTitle: {
    color: "#ecf6f1",
    fontSize: 11,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#ffffff22",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ffffff33",
  },
  iconCircleText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 14,
  },
  searchZone: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  searchInput: {
    backgroundColor: "#ffffff22",
    height: 44,
    borderRadius: 16,
    paddingHorizontal: 14,
    marginBottom: 8,
    color: "#fff",
  },
  filterButton: {
    backgroundColor: "#ffffff22",
    height: 36,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  filterButtonText: {
    fontWeight: "700",
    color: "#fff",
  },
  filterList: {
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 4,
  },
  filterListItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterListItemActive: {
    backgroundColor: theme.colors.primary + "20",
  },
  filterListItemText: {
    color: "#333",
    fontSize: 14,
  },
  filterListItemTextActive: {
    color: theme.colors.primary,
    fontWeight: "700",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#0006",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "70%",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
  },
  modalButton: {
    padding: 12,
    marginVertical: 5,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: "center",
  },
  modalText: {
    color: "#fff",
    fontWeight: "bold",
  },
  myMessage: {
    backgroundColor: theme.colors.primary,
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
    alignSelf: "flex-end",
    maxWidth: "82%",
  },
  hisMessage: {
    backgroundColor: "#ffffffef",
    marginVertical: 4,
    padding: 12,
    borderRadius: 18,
    alignSelf: "flex-start",
    maxWidth: "82%",
    borderWidth: 1,
    borderColor: "#fff7",
  },
  replyPreviewBubble: {
    backgroundColor: "#00000010",
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 6,
  },
  replyPreviewLabel: {
    color: theme.colors.primary,
    fontWeight: "bold",
    fontSize: 11,
  },
  replyPreviewText: {
    color: "#333",
    fontSize: 12,
  },
  messageText: {
    color: "#fff",
    fontSize: 15,
  },
  messageMetaRow: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  messageTime: {
    color: "#dff3f2",
    fontSize: 11,
  },
  starCount: {
    fontSize: 11,
    color: theme.colors.text,
    fontWeight: "bold",
  },
  mapCard: {
    backgroundColor: "#dce9e2",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  mapText: {
    color: theme.colors.primary,
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  audioCard: {
    backgroundColor: "#e5efe7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  audioText: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  imageMessage: {
    width: 210,
    height: 210,
    backgroundColor: "#fff",
    borderRadius: 14,
  },
  replyComposer: {
    width: "100%",
    backgroundColor: "#ffffff55",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  replyComposerText: {
    color: theme.colors.text,
    fontWeight: "700",
    maxWidth: "75%",
  },
  cancelReply: {
    color: theme.colors.primary,
    fontWeight: "bold",
  },
  composerWrap: {
    width: "100%",
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 8,
  },
  composerInner: {
    width: "100%",
    backgroundColor: "#ffffffee",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  composerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.muted,
  },
  composerIconText: {
    color: theme.colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  composerInput: {
    flex: 1,
    backgroundColor: "transparent",
    height: 40,
    paddingHorizontal: 6,
  },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  micText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
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
  contactPhotoOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactPhotoCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    width: "85%",
    maxWidth: 500,
    alignItems: "center",
  },
  largeContactPhoto: {
    width: 280,
    height: 280,
    borderRadius: 140,
    marginBottom: 20,
  },
  contactPhotoName: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  contactPhotoEmail: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginBottom: 20,
  },
  closeContactPhotoBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  closeContactPhotoBtnText: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: 16,
  },
});
