import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Dimensions,
} from "react-native";
import maleAvatar from "../../assets/images/male-avatar.png";
import femaleAvatar from "../../assets/images/female-avatar.png";
import { getFullMediaUrl } from "../../utils/media";

export function PostHeader({ author, space, created_at }) {
  const [visibleText, setVisibleText] = useState(null);
  const screenWidth = Dimensions.get("window").width;

  const gender = author?.profile?.gender;
  const school = author?.profile?.school_name || "Unknown School";
  const rep = author?.profile?.rep || 0;

  const profilePicUrl = getFullMediaUrl(author?.profile?.profile_picture);
  const hasCustomAvatar = !!profilePicUrl;

  const avatarSource = hasCustomAvatar
    ? { uri: profilePicUrl }
    : gender?.toLowerCase() === "female"
    ? femaleAvatar
    : maleAvatar;

  const closeModal = () => setVisibleText(null);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftSection}>
          <Image source={avatarSource} style={styles.avatar} />
          <View style={styles.info}>
            <TouchableOpacity onPress={() => setVisibleText("username")}>
              <Text style={styles.username} numberOfLines={1}>
                {author.username}
              </Text>
            </TouchableOpacity>

            {space && (
              <TouchableOpacity onPress={() => setVisibleText("space")}>
                <Text style={styles.space} numberOfLines={1}>
                  {space.name}
                </Text>
              </TouchableOpacity>
            )}

            <Text style={styles.timestamp}>
              {new Date(created_at).toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity onPress={() => setVisibleText("school")}>
            <Text style={styles.school} numberOfLines={1}>
              {school}
            </Text>
          </TouchableOpacity>
          <Text style={styles.rep}>Rep: {rep}</Text>
        </View>
      </View>

      <Modal visible={!!visibleText} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={closeModal}>
          <View style={[styles.modalBox, { maxWidth: screenWidth - 60 }]}>
            <Text style={styles.modalText}>
              {visibleText === "username" && author.username}
              {visibleText === "space" && space?.name}
              {visibleText === "school" && school}
            </Text>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  info: {
    marginLeft: 10,
    justifyContent: "center",
    maxWidth: 180,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  username: { fontWeight: "500", fontSize: 16, color: "#222" },
  space: { fontSize: 14, color: "#666" },
  timestamp: { fontSize: 12, color: "#999" },
  rightSection: { alignItems: "flex-end", marginLeft: 10, maxWidth: 120 },
  school: { fontSize: 14, fontWeight: "400", color: "#333" },
  rep: { fontSize: 12, color: "#247b3b" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    elevation: 5,
  },
  modalText: { fontSize: 16, color: "#222" },
});
