import {
  ImageBackground,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native"
import React, { useEffect, useState } from "react"
import firebase from "../../Config";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAppSettings } from "../../Config/appSettings";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const ref_groups = database.ref("groups");

export default function Groupe(props) {
  const userid = props.route?.params?.userid ?? props.route?.params?.userId;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);
  const [accounts, setaccounts] = useState([]);
  const [groups, setgroups] = useState([]);
  const [selectedUsers, setselectedUsers] = useState([]);
  const [searchQuery, setsearchQuery] = useState("");
  const [groupName, setgroupName] = useState("");
  const [selectedGroup, setselectedGroup] = useState(null);
  const [showCreate, setshowCreate] = useState(false);
  const [message, setmessage] = useState("");
  const [messages, setmessages] = useState([]);
  const [inviteText, setinviteText] = useState("");
  const [userToAdd, setuserToAdd] = useState("");
  const [userToDelete, setuserToDelete] = useState("");

  useEffect(() => {
    ref_all_accounts.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((one_account) => {
        d.push(one_account.val());
      });
      setaccounts(d);
    });

    ref_groups.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((one_group) => {
        var group = one_group.val();
        if(group.members && group.members[userid]){
          d.push({
            key: one_group.key,
            ...group,
          });
        }
      });
      setgroups(d);
    });

    return () => {
      ref_all_accounts.off();
      ref_groups.off();
    }
  }, [userid])

  useEffect(() => {
    if(!selectedGroup){
      return;
    }

    const ref_messages = ref_groups.child(selectedGroup.key).child("messages");
    ref_messages.on("value", (snapshot) => {
      var d = [];
      snapshot.forEach((one_message) => {
        d.push(one_message.val());
      });
      setmessages(d);
    });

    return () => {
      ref_messages.off();
    }
  }, [selectedGroup])

  useEffect(() => {
    if(selectedGroup){
      var group = groups.find((item) => item.key == selectedGroup.key);
      if(group){
        setselectedGroup(group);
      } else {
        setselectedGroup(null);
        setmessages([]);
      }
    }
  }, [groups])

  function getAccountName(id) {
    var account = accounts.find((item) => item.Id == id);
    if(account){
      return account.Pseudo || account.Nom || account.Email || account.Numero;
    }
    return id;
  }

  function selectUser(id) {
    if(selectedUsers.includes(id)){
      setselectedUsers(selectedUsers.filter((item) => item != id));
    } else {
      setselectedUsers([...selectedUsers, id]);
    }
  }

  function createGroup() {
    if(!userid){
      alert("User introuvable");
      return;
    }

    if(!groupName){
      alert("Nom groupe obligatoire");
      return;
    }

    if(selectedUsers.length < 2){
      alert("Choisir au moins 2 users");
      return;
    }

    const Key = ref_groups.push().key;
    const ref_group = ref_groups.child(Key);
    var members = {};
    members[userid] = true;
    selectedUsers.forEach((id) => {
      members[id] = true;
    });

    ref_group.set({
      id: Key,
      nom: groupName,
      admin: userid,
      members: members,
      date: new Date().toLocaleString(),
    });

    setgroupName("");
    setselectedUsers([]);
    setshowCreate(false);
  }

  function openGroup(group) {
    props.navigation.navigate("GroupChat", { groupId: group.key, userid: userid });
  }

  function sendGroupMessage() {
    if(!selectedGroup || message.trim().length == 0){
      return;
    }

    const Key = ref_groups.child(selectedGroup.key).child("messages").push().key;
    ref_groups.child(selectedGroup.key).child("messages").child(Key).set({
      sender: userid,
      message: message,
      time: new Date().toLocaleTimeString(),
      type: "text",
    });

    setmessage("");
  }

  function inviteUser() {
    if(!selectedGroup || !inviteText){
      return;
    }

    var user = accounts.find((item) => {
      return (
        item.Pseudo == inviteText ||
        item.Numero == inviteText ||
        item.Email == inviteText
      );
    });

    if(user){
      ref_groups.child(selectedGroup.key).child("members").child(user.Id).set(true);
      setinviteText("");
    } else {
      alert("User introuvable");
    }
  }

  function addUser() {
    if(selectedGroup && userToAdd){
      ref_groups.child(selectedGroup.key).child("members").child(userToAdd).set(true);
      setuserToAdd("");
    }
  }

  function deleteUser() {
    if(selectedGroup && userToDelete){
      ref_groups.child(selectedGroup.key).child("members").child(userToDelete).remove();
      setuserToDelete("");
    }
  }

  function quitGroup() {
    if(selectedGroup){
      ref_groups.child(selectedGroup.key).child("members").child(userid).remove();
      setselectedGroup(null);
      setmessages([]);
    }
  }

  function deleteGroup() {
    if(selectedGroup && selectedGroup.admin == userid){
      ref_groups.child(selectedGroup.key).remove();
      setselectedGroup(null);
      setmessages([]);
    }
  }

  function getGroupInitials(name) {
    if (!name) return "G";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  const otherAccounts = accounts.filter((item) => item.Id != userid);
  const filteredAccounts = otherAccounts.filter((a) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.Pseudo && a.Pseudo.toLowerCase().includes(q)) ||
      (a.Nom && a.Nom.toLowerCase().includes(q)) ||
      (a.Email && a.Email.toLowerCase().includes(q)) ||
      (a.Numero && a.Numero.toLowerCase().includes(q))
    );
  });
  const members = selectedGroup && selectedGroup.members ? Object.keys(selectedGroup.members) : [];
  const usersNotInGroup = otherAccounts.filter((item) => {
    return selectedGroup && selectedGroup.members && !selectedGroup.members[item.Id];
  });
  const usersInGroup = otherAccounts.filter((item) => {
    return selectedGroup && selectedGroup.members && selectedGroup.members[item.Id];
  });

  return (
    <ImageBackground
      style={styles.container}
      source={require("../../assets/backgr.jpg")}
    >
      <Modal visible={showCreate} transparent animationType="fade" onRequestClose={() => setshowCreate(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Group</Text>
              <TouchableOpacity style={styles.modalClose} onPress={() => setshowCreate(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalNameRow}>
              <View style={styles.modalIcon}>
                <Text style={styles.modalIconText}>👤+</Text>
              </View>
              <TextInput
                value={groupName}
                onChangeText={(txt) => setgroupName(txt)}
                placeholder="Group name"
                style={styles.modalNameInput}
              />
            </View>

            <Text style={styles.modalSectionTitle}>Add members ({selectedUsers.length})</Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {filteredAccounts.map((item, index) => {
                const selected = selectedUsers.includes(item.Id);
                const isOnline = item.Online || item.online || item.isOnline;
                return (
                  <TouchableOpacity
                    key={item.Id}
                    onPress={() => selectUser(item.Id)}
                    style={[styles.modalUserRow, selected && styles.modalUserRowSelected]}
                  >
                    <View style={styles.modalUserLeft}>
                      {item.UrlImage ? (
                        <Image source={{ uri: item.UrlImage }} style={styles.modalAvatar} />
                      ) : (
                        <View style={styles.modalAvatarPlaceholder}>
                          <Text style={styles.modalAvatarText}>{(item.Pseudo || item.Nom || "?").charAt(0)}</Text>
                        </View>
                      )}
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.modalUserName}>{item.Pseudo || item.Nom}</Text>
                        <Text style={styles.modalUserStatus}>{isOnline ? "online" : "offline"}</Text>
                      </View>
                    </View>
                    <View style={[styles.modalCheck, selected && styles.modalCheckSelected]} />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <PrimaryButton onPress={createGroup}>{t("createGroup")}</PrimaryButton>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={{ width: "95%" }} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.hero}>
          <Text style={styles.heroTag}>Together</Text>
          <View style={styles.heroRow}>
            <Text style={styles.heroTitle}>{t("groups")}</Text>
            <TouchableOpacity style={styles.newBtn} onPress={() => setshowCreate(!showCreate)}>
              <Text style={styles.newBtnText}>+ New</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={searchQuery}
              onChangeText={(txt) => setsearchQuery(txt)}
              placeholder={t("searchGroups")}
              placeholderTextColor="#e9f7f7"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.listWrap}>
          {groups.map((item, index) => {
            const membersCount = Object.keys(item.members || {}).length;
            const memberIds = Object.keys(item.members || {}).slice(0, 3);
            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => {
                  openGroup(item);
                }}
                style={styles.groupCardNew}
              >
                <View style={styles.groupIcon}>
                  {item.groupImage ? (
                    <Image 
                      source={{ uri: item.groupImage }}
                      style={{ width: "100%", height: "100%", borderRadius: 8 }}
                    />
                  ) : (
                    <Text style={styles.groupIconText}>{getGroupInitials(item.nom)}</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle}>{item.nom}</Text>
                  <Text style={styles.groupPreview}>Discussion active</Text>
                  <View style={styles.groupMetaRow}>
                    <Text style={styles.groupMetaText}>👥 {membersCount} membres</Text>
                  </View>
                </View>
                <View style={styles.groupMembers}>
                  {memberIds.map((id) => {
                    const acc = accounts.find((a) => a.Id == id) || {};
                    const label = (acc.Pseudo || acc.Nom || "").charAt(0).toUpperCase();
                    return (
                      <View key={id} style={styles.groupMemberDot}>
                        <Text style={styles.groupMemberText}>{label || "•"}</Text>
                      </View>
                    );
                  })}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedGroup && (
          <View style={styles.box}>
            <Text style={styles.title}>Discussion: {selectedGroup.nom}</Text>
            <Text style={{ color: theme.colors.subtext }}>Membres: {members.map((id) => getAccountName(id)).join(", ")}</Text>
            <View style={{ backgroundColor: "#00000012", minHeight: 150, marginVertical: 8, borderRadius: 16, padding: 8 }}>
              {messages.map((item, index) => {
                return (
                  <View
                    key={index}
                    style={item.sender == userid ? { backgroundColor: theme.colors.accent, margin: 3, padding: 8, borderRadius: 14 } : { backgroundColor: "#fff", margin: 3, padding: 8, borderRadius: 14 }}
                  >
                    <Text style={{ fontWeight: "bold" }}>{getAccountName(item.sender)}</Text>
                    <Text>{item.message}</Text>
                    <Text>{item.time}</Text>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TextInput
                value={message}
                onChangeText={(txt) => setmessage(txt)}
                placeholder="Message groupe"
                style={[styles.input, { flex: 1 }]}
              ></TextInput>
              <PrimaryButton onPress={sendGroupMessage} style={{ width: 90 }}>
                Envoyer
              </PrimaryButton>
            </View>
          </View>
        )}

        {selectedGroup && (
          <View style={styles.box}>
            <Text style={styles.title}>Invite user</Text>
            <TextInput
              value={inviteText}
              onChangeText={(txt) => setinviteText(txt)}
              placeholder="Pseudo / Numero / Email"
              style={styles.input}
            ></TextInput>
            <TouchableOpacity onPress={inviteUser} style={styles.button}>
              <Text style={styles.buttonText}>Inviter</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Ajouter user</Text>
            {usersNotInGroup.map((item) => {
              return (
                <TouchableOpacity
                  key={item.Id}
                  onPress={() => setuserToAdd(item.Id)}
                  style={{
                    padding: 8,
                    backgroundColor: userToAdd == item.Id ? theme.colors.accent : "#e9f8fb",
                    marginVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text>{item.Pseudo} {item.Nom}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={addUser} style={styles.button}>
              <Text style={styles.buttonText}>Ajouter</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Supprimer user</Text>
            {usersInGroup.map((item) => {
              return (
                <TouchableOpacity
                  key={item.Id}
                  onPress={() => setuserToDelete(item.Id)}
                  style={{
                    padding: 8,
                    backgroundColor: userToDelete == item.Id ? theme.colors.primary : "#e9f8fb",
                    marginVertical: 2,
                    borderRadius: 6,
                  }}
                >
                  <Text>{item.Pseudo} {item.Nom}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity onPress={deleteUser} style={[styles.button, { backgroundColor: "transparent" }]}>
              <Text style={styles.buttonText}>Supprimer user</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={quitGroup} style={[styles.button, { backgroundColor: "transparent" }]}>
              <Text style={styles.buttonText}>Quitter groupe</Text>
            </TouchableOpacity>

            {selectedGroup.admin == userid && (
              <TouchableOpacity onPress={deleteGroup} style={[styles.button, { backgroundColor: "transparent" }]}>
                <Text style={styles.buttonText}>Supprimer groupe</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </ImageBackground>
  )
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 30,
    backgroundColor: theme.colors.background,
  },
  hero: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: 26,
    padding: 18,
    marginBottom: 12,
    ...theme.elevation.mid,
  },
  heroTag: {
    color: "#e0f0ef",
    fontSize: 12,
    fontWeight: "600",
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  newBtn: {
    backgroundColor: "transparent",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  newBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  searchWrap: {
    marginTop: 12,
    backgroundColor: "#ffffff22",
    borderRadius: 18,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchIcon: {
    color: "#e9f7f7",
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 14,
  },
  box: {
    backgroundColor: "#fffffff2",
    padding: 14,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.primary,
    marginVertical: 5,
  },
  input: {
    backgroundColor: "#fff",
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "#00000066",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 18,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  modalNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  modalIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalIconText: {
    color: "#fff",
    fontWeight: "800",
  },
  modalNameInput: {
    flex: 1,
    backgroundColor: "#eff7f2",
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
  },
  modalSectionTitle: {
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 6,
  },
  modalUserRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderRadius: 14,
    paddingHorizontal: 6,
  },
  modalUserRowSelected: {
    backgroundColor: "#e9f7f2",
  },
  modalUserLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  modalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modalAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalAvatarText: {
    color: "#fff",
    fontWeight: "700",
  },
  modalUserName: {
    fontWeight: "700",
    color: theme.colors.text,
  },
  modalUserStatus: {
    color: theme.colors.subtext,
    marginTop: 2,
  },
  modalCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#c7d9d1",
    backgroundColor: "#fff",
  },
  modalCheckSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  listWrap: {
    gap: 10,
  },
  groupCardNew: {
    backgroundColor: "transparent",
    padding: 14,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  groupIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: theme.colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  groupIconText: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
  },
  groupPreview: {
    color: theme.colors.subtext,
    marginTop: 2,
  },
  groupMetaRow: {
    marginTop: 6,
  },
  groupMetaText: {
    color: theme.colors.subtext,
    fontSize: 12,
  },
  groupMembers: {
    flexDirection: "row",
    marginLeft: 8,
  },
  groupMemberDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -6,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  groupMemberText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  button: {
    backgroundColor: "transparent",
    padding: 12,
    borderRadius: 14,
    marginVertical: 5,
    alignItems: "center",
  },
  navButton: {
    backgroundColor: theme.colors.primary,
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  navButton2: {
    backgroundColor: theme.colors.accent,
    padding: 10,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  
})
