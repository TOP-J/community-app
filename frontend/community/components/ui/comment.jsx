import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { ThumbsUp, Trash2, Pencil } from "lucide-react-native";

export function Comment({
  user,
  content,
  timestamp,
  upvotes = 0,
  onUpvote,
  isOwn = false,
  onEdit,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(content);

  const getAvatar = () => {
    if (user?.profile?.profile_picture)
      return { uri: user.profile.profile_picture };
    return user?.profile?.gender === "female"
      ? require("../../assets/images/female-avatar.png")
      : require("../../assets/images/male-avatar.png");
  };

  return (
    <View style={styles.commentBox}>
      {/* Top Row */}
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={styles.avatarWrap}>
            <Image source={getAvatar()} style={styles.avatarImg} />
          </View>
          <View>
            <Text style={styles.username}>{user?.username}</Text>
            <Text style={styles.timestamp}>{timestamp}</Text>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.upvoteCount}>{upvotes}</Text>
          <TouchableOpacity onPress={onUpvote}>
            <ThumbsUp size={18} color="#247b3b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comment Body */}
      <View style={styles.body}>
        {isEditing ? (
          <>
            <TextInput
              style={styles.input}
              value={editedText}
              onChangeText={setEditedText}
              multiline
            />
            <TouchableOpacity
              style={styles.saveButton}
              onPress={() => {
                onEdit(editedText);
                setIsEditing(false);
              }}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.content}>{content}</Text>
        )}
      </View>

      {/* Edit/Delete Options */}
      {isOwn && !isEditing && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.action}
            onPress={() => setIsEditing(true)}
          >
            <Pencil size={16} color="#555" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.action} onPress={onDelete}>
            <Trash2 size={16} color="#d00" />
            <Text style={[styles.actionText, { color: "#d00" }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  commentBox: {
    padding: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
    borderRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    marginRight: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarBorder: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    padding: 2,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  username: {
    fontWeight: "bold",
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: "#999",
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
  },
  upvoteCount: {
    marginRight: 4,
    fontSize: 13,
    color: "#444",
  },
  body: {
    marginTop: 6,
  },
  content: {
    fontSize: 15,
    color: "#333",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    padding: 6,
    backgroundColor: "#fff",
  },
  saveButton: {
    marginTop: 6,
    alignSelf: "flex-end",
    backgroundColor: "#247b3b",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  saveText: {
    color: "#fff",
    fontSize: 13,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#555",
  },
});
