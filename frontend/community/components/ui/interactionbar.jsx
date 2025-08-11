import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Share as NativeShare,
  ActionSheetIOS,
  StyleSheet,
} from "react-native";
import {
  ThumbsUp,
  MessageSquareText,
  SendHorizontal,
  Ellipsis,
} from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { CommentsSection } from "../ui/commentsection"; // ✅ New import

export function InteractionBar({
  postId,
  initialLikes = 0,
  initialShares = 0,
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [shares, setShares] = useState(initialShares);
  const [shared, setShared] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const BASE_URL = "http://192.168.8.102:8000/api";

  async function getToken() {
    const token = await SecureStore.getItemAsync("auth_token");
    if (!token) Alert.alert("Login required");
    return token;
  }

  const toggleLike = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/posts/${postId}/toggle_like/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setLiked(data.liked);
      setLikes((prev) => (data.liked ? prev + 1 : prev - 1));
    } catch (err) {
      console.error("Like error:", err);
      Alert.alert("Error", "Could not toggle like");
    }
  };

  const handleShare = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const shareResult = await NativeShare.share({
        title: "Check out this post!",
        message:
          "Join the CircleUp community and discover meaningful posts! Login at https://circleup.app/login",
      });

      if (shareResult.action === NativeShare.sharedAction) {
        const res = await fetch(`${BASE_URL}/posts/${postId}/toggle_share/`, {
          method: "POST",
          headers: { Authorization: `Token ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (data.shared && !shared) {
          setShared(true);
          setShares((prev) => prev + 1);
        }
      }
    } catch (err) {
      console.error("Share error:", err);
      Alert.alert("Share failed", "Unable to share this post");
    }
  };

  const handleRaiseConcern = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${BASE_URL}/posts/${postId}/raise_concern/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });

      if (res.ok) {
        Alert.alert("Concern raised", "Your concern has been sent to moderators.");
      } else {
        Alert.alert("Failed", await res.text() || "Unable to raise concern.");
      }
    } catch (err) {
      console.error("Raise concern error:", err);
      Alert.alert("Error", "Unable to contact the server.");
    }
  };

  const showOptions = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ["Cancel", "Raise Concern"],
        cancelButtonIndex: 0,
        destructiveButtonIndex: 1,
      },
      (index) => {
        if (index === 1) handleRaiseConcern();
      }
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Likes & Shares count */}
      <View style={styles.top}>
        <Text>{likes} interaction{likes !== 1 ? "s" : ""}</Text>
        <Text>{shares} share{shares !== 1 ? "s" : ""}</Text>
      </View>

      {/* Action buttons */}
      <View style={styles.container}>
        <TouchableOpacity style={styles.icon} onPress={toggleLike}>
          <ThumbsUp size={20} color={liked ? "#247b3b" : "#d00"} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.icon}
          onPress={() => setShowComments((prev) => !prev)}
        >
          <MessageSquareText size={20} color={showComments ? "#247b3b" : "#555"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon} onPress={handleShare}>
          <SendHorizontal size={20} color={shared ? "#247b3b" : "#555"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon} onPress={showOptions}>
          <Ellipsis size={20} color="#555" />
        </TouchableOpacity>
      </View>

      {/* Comment Section */}
      {showComments && (
        <View style={styles.commentsSection}>
          <CommentsSection postId={postId} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    paddingTop: 20,
    color: "#555",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  container: {
    flexDirection: "row",
    marginTop: 16,
    justifyContent: "space-between",
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  icon: {
    padding: 6,
  },
  commentsSection: {
    flex: 1,
    paddingTop: 10,
  },
});
