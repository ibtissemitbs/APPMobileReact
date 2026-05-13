import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firebase from "../../Config";
import { useAppSettings } from "../../Config/appSettings";
import ModernBackground from "../../components/ui/ModernBackground";

const database = firebase.database();
const ref_all_accounts = database.ref("allaccounts");
const ref_all_calls = database.ref("allCalls");

export default function Calls(props) {
  const routeUserid = props.route?.params?.userid ?? props.route?.params?.userId;
  const { theme, t } = useAppSettings();
  const styles = getStyles(theme);
  const [calls, setcalls] = useState([]);
  const [accounts, setaccounts] = useState([]);
  const [callsFilter, setcallsFilter] = useState("all"); // all, missed, outgoing, incoming
  const [resolvedUserId, setResolvedUserId] = useState(routeUserid || null);
  const [isLoadingUser, setIsLoadingUser] = useState(!routeUserid);

  useEffect(() => {
    if (routeUserid) {
      setResolvedUserId(routeUserid);
      setIsLoadingUser(false);
      return;
    }

    AsyncStorage.getItem("userid")
      .then((storedUserId) => {
        if (storedUserId) {
          setResolvedUserId(storedUserId);
          props.navigation.setParams({ userid: storedUserId });
        }
        setIsLoadingUser(false);
      })
      .catch((err) => console.log("Error loading stored userid:", err));
  }, [routeUserid, props.navigation]);

  useEffect(() => {
    ref_all_accounts.on("value", (snapshot) => {
      const acc = [];
      snapshot.forEach((one_account) => {
        acc.push(one_account.val());
      });
      setaccounts(acc);
    });

    return () => {
      ref_all_accounts.off();
    };
  }, []);

  useEffect(() => {
    if (!resolvedUserId) return;

    const userCallsRef = ref_all_calls.child(resolvedUserId);
    userCallsRef.on("value", (snapshot) => {
      const callList = [];
      snapshot.forEach((call_snap) => {
        callList.push({
          key: call_snap.key,
          ...call_snap.val(),
        });
      });
      // Sort by timestamp, most recent first
      callList.sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setcalls(callList);
    });

    return () => {
      userCallsRef.off();
    };
  }, [resolvedUserId]);

  const getAccountName = (id) => {
    const account = accounts.find((item) => item.Id == id);
    return account?.Pseudo || account?.Nom || account?.Email || id;
  };

  const getAccountInitial = (id) => {
    const account = accounts.find((item) => item.Id == id);
    const name = account?.Pseudo || account?.Nom || "?";
    return name.charAt(0).toUpperCase();
  };

  const filteredCalls = calls.filter((call) => {
    if (callsFilter === "missed") return call.status === "missed";
    if (callsFilter === "outgoing") return call.direction === "outgoing";
    if (callsFilter === "incoming") return call.direction === "incoming";
    return true;
  });

  const startCall = (contactId, isVideo) => {
    const channelName = `call-${Math.min(resolvedUserId, contactId)}-${Math.max(resolvedUserId, contactId)}`;
    props.navigation.navigate("Call", {
      channelName,
      isVideo,
      contactId,
      currentid: resolvedUserId,
    });
  };

  const callTypeIcon = (call) => {
    if (call.status === "missed") {
      return <Ionicons name="call-outline" size={16} color="#ff6b6b" />;
    }
    if (call.direction === "outgoing") {
      return <Ionicons name="arrow-up-circle" size={16} color="#4CAF50" />;
    }
    return <Ionicons name="arrow-down-circle" size={16} color="#2196F3" />;
  };

  return (
    <ModernBackground
      style={styles.container}
      source={require("../../assets/backgr.jpg")}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Recent calls</Text>
          <View style={styles.headerRow}>
            <Text style={styles.logo}>Calls</Text>
            <View style={styles.headerPill}>
              <Text style={styles.headerPillText}>{calls.length}</Text>
            </View>
          </View>
        </View>

        {isLoadingUser ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Chargement des appels...</Text>
          </View>
        ) : !resolvedUserId ? (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={42} color={theme.colors.subtext} />
            <Text style={styles.emptyStateText}>Utilisateur introuvable</Text>
          </View>
        ) : null}

        <View style={styles.filterRow}>
          {["all", "missed", "outgoing", "incoming"].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setcallsFilter(filter)}
              style={[styles.filterBtn, callsFilter === filter && styles.filterBtnActive]}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  callsFilter === filter && styles.filterBtnTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredCalls.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={filteredCalls}
            renderItem={({ item }) => {
              const contactName = getAccountName(item.contactId || item.otherId);
              const initial = getAccountInitial(item.contactId || item.otherId);
              const callTime = new Date(item.timestamp);
              const timeString = callTime.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dateString = callTime.toLocaleDateString();

              return (
                <TouchableOpacity
                  style={styles.callItem}
                  onPress={() => {
                    // Navigate to chat or initiate call
                  }}
                >
                  <View style={styles.callAvatar}>
                    <Text style={styles.callAvatarText}>{initial}</Text>
                  </View>

                  <View style={styles.callInfo}>
                    <Text style={styles.callName}>{contactName}</Text>
                    <View style={styles.callMeta}>
                      {callTypeIcon(item)}
                      <Text style={styles.callStatus}>
                        {item.status === "missed"
                          ? "Missed call"
                          : item.direction === "outgoing"
                          ? "Outgoing"
                          : "Incoming"}
                      </Text>
                      <Text style={styles.callTime}>
                        {dateString === new Date().toLocaleDateString()
                          ? timeString
                          : dateString}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.callActions}>
                    <TouchableOpacity
                      onPress={() => startCall(item.contactId || item.otherId, false)}
                      style={styles.callActionBtn}
                    >
                      <Ionicons
                        name="call"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => startCall(item.contactId || item.otherId, true)}
                      style={styles.callActionBtn}
                    >
                      <Ionicons
                        name="videocam"
                        size={18}
                        color={theme.colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item.key}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="call-outline"
              size={48}
              color={theme.colors.subtext}
            />
            <Text style={styles.emptyStateText}>No calls yet</Text>
          </View>
        )}
      </ScrollView>
    </ModernBackground>
  );
}

const getStyles = (theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 30,
      paddingBottom: 120,
    },
    header: {
      marginBottom: 20,
    },
    welcome: {
      color: theme.colors.subtext,
      fontSize: 12,
      fontWeight: "600",
      marginBottom: 8,
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    logo: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.colors.text,
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
    filterRow: {
      flexDirection: "row",
      gap: 8,
      marginBottom: 16,
    },
    filterBtn: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.1)",
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterBtnActive: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    filterBtnText: {
      color: theme.colors.text,
      fontWeight: "600",
      fontSize: 12,
    },
    filterBtnTextActive: {
      color: "#fff",
    },
    callItem: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginBottom: 8,
      borderRadius: 14,
      backgroundColor: theme.colors.glass,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.15)",
    },
    callAvatar: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    callAvatarText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 16,
    },
    callInfo: {
      flex: 1,
    },
    callName: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.colors.text,
      marginBottom: 4,
    },
    callMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    callStatus: {
      fontSize: 12,
      color: theme.colors.subtext,
    },
    callTime: {
      fontSize: 12,
      color: theme.colors.subtext,
      marginLeft: "auto",
    },
    callActions: {
      flexDirection: "row",
      gap: 8,
      marginLeft: 12,
    },
    callActionBtn: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.1)",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 80,
    },
    emptyStateText: {
      marginTop: 12,
      color: theme.colors.subtext,
      fontSize: 14,
      fontWeight: "600",
    },
  });
