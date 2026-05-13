import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  RtcSurfaceView,
  VideoSourceType,
} from "react-native-agora";
import { AGORA_APP_ID, AGORA_TOKEN, AGORA_TOKEN_SERVER_URL } from "../Config/agora";
import { useAppSettings } from "../Config/appSettings";
import ModernBackground from "../components/ui/ModernBackground";

export default function Call(props) {
  const channelName = props.route?.params?.channelName;
  const isVideo = props.route?.params?.isVideo ?? true;
  const { theme } = useAppSettings();
  const styles = getStyles(theme);
  const [joined, setJoined] = useState(false);
  const [remoteUid, setRemoteUid] = useState(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(isVideo);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [tokenError, setTokenError] = useState(null);
  const engineRef = useRef(null);

  useEffect(() => {
    if (!channelName) return undefined;
    let isActive = true;

    const init = async () => {
      const engine = createAgoraRtcEngine();
      engineRef.current = engine;

      engine.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileCommunication,
      });

      engine.registerEventHandler({
        onJoinChannelSuccess: () => setJoined(true),
        onUserJoined: (_connection, uid) => setRemoteUid(uid),
        onUserOffline: () => setRemoteUid(null),
      });

      engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      if (isVideo) {
        engine.enableVideo();
        engine.startPreview();
      } else {
        engine.enableAudio();
        engine.disableVideo();
      }

      let token = AGORA_TOKEN;
      if (!token && AGORA_TOKEN_SERVER_URL) {
        try {
          const response = await fetch(
            `${AGORA_TOKEN_SERVER_URL}?channel=${encodeURIComponent(channelName)}&uid=0`
          );
          const data = await response.json();
          token = data?.token || "";
        } catch (err) {
          token = "";
        }
      }

      engine.joinChannel(token || null, channelName, 0, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    };

    init();

    return () => {
      isActive = false;
      engineRef.current?.leaveChannel();
      engineRef.current?.release();
    };
  }, [channelName, isVideo]);

  const endCall = () => {
    if (engineRef.current) {
      engineRef.current.leaveChannel();
      engineRef.current.release();
    }
    props.navigation.goBack();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    engineRef.current?.muteLocalAudioStream(next);
  };

  const toggleSpeaker = () => {
    const next = !speakerOn;
    setSpeakerOn(next);
    engineRef.current?.setEnableSpeakerphone(next);
  };

  const toggleVideo = () => {
    const next = !videoEnabled;
    setVideoEnabled(next);
    if (next) {
      engineRef.current?.enableVideo();
      engineRef.current?.startPreview();
    } else {
      engineRef.current?.disableVideo();
    }
  };

  const switchCamera = () => {
    engineRef.current?.switchCamera();
  };

  if (!channelName) {
    return (
      <ModernBackground style={styles.container}>
        <Text style={{ color: theme.colors.text }}>Channel introuvable</Text>
      </ModernBackground>
    );
  }

  if (tokenError) {
    return (
      <ModernBackground style={styles.container}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Erreur Agora</Text>
          <Text style={styles.errorText}>Impossible d'obtenir un token.</Text>
          <Text style={styles.errorText}>Vérifie le serveur token et la configuration.</Text>
        </View>
      </ModernBackground>
    );
  }

  return (
    <View style={styles.container}>
      {videoEnabled ? (
        <View style={styles.videoWrap}>
          {remoteUid ? (
            <RtcSurfaceView
              canvas={{ uid: remoteUid }}
              style={styles.remoteVideo}
            />
          ) : (
            <View style={styles.remotePlaceholder}>
              <Text style={styles.remoteText}>En attente...</Text>
            </View>
          )}
          <RtcSurfaceView
            canvas={{ uid: 0, sourceType: VideoSourceType.VideoSourceCameraPrimary }}
            style={styles.localVideo}
          />
        </View>
      ) : (
        <View style={styles.audioOnly}>
          <Text style={styles.audioTitle}>{joined ? "En appel" : "Connexion..."}</Text>
          <Text style={styles.audioSubtitle}>{channelName}</Text>
        </View>
      )}

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleMute}>
          <MaterialCommunityIcons name={muted ? "microphone-off" : "microphone"} size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleSpeaker}>
          <MaterialCommunityIcons name={speakerOn ? "volume-high" : "volume-off"} size={22} color="#fff" />
        </TouchableOpacity>
        {isVideo && (
          <TouchableOpacity style={styles.controlBtn} onPress={toggleVideo}>
            <MaterialCommunityIcons name={videoEnabled ? "video" : "video-off"} size={22} color="#fff" />
          </TouchableOpacity>
        )}
        {isVideo && (
          <TouchableOpacity style={styles.controlBtn} onPress={switchCamera}>
            <MaterialCommunityIcons name="camera-switch" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.controlBtn, styles.endBtn]} onPress={endCall}>
          <MaterialCommunityIcons name="phone-hangup" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  videoWrap: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
  },
  remotePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  remoteText: {
    color: "#fff",
    fontWeight: "600",
  },
  localVideo: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 110,
    height: 150,
    borderRadius: 14,
    overflow: "hidden",
  },
  audioOnly: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  audioTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
  },
  audioSubtitle: {
    color: "#b9d7d1",
    marginTop: 6,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 18,
    paddingBottom: 30,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  endBtn: {
    backgroundColor: "transparent",
  },
  errorCard: {
    marginTop: 120,
    marginHorizontal: 20,
    backgroundColor: "#ffffffee",
    borderRadius: 16,
    padding: 16,
  },
  errorTitle: {
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 6,
  },
  errorText: {
    color: theme.colors.subtext,
  },
});
