import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  FlatList,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { Comment } from "../ui/comment";
import { getFullMediaUrl } from "../../utils/media";

export function CommentsSection({ postId }) {
  const BASE_URL = "http://192.168.8.102:8000";

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const fetchCurrentUser = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    const res = await fetch(`${BASE_URL}/api/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data);
    }
  };

  const fetchComments = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    const res = await fetch(`${BASE_URL}/api/comments/?post_id=${postId}`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setComments(data);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchComments();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim()) {
      Alert.alert("Comment box is empty");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const res = await fetch(`${BASE_URL}/api/comments/`, {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment, post: postId }),
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      } else {
        Alert.alert("Error", "Could not submit comment");
      }
    } catch (err) {
      console.error("Post comment error:", err);
    }
  };

  const handleCommentUpvote = async (commentId) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(
        `${BASE_URL}/api/comments/${commentId}/toggle_upvote/`,
        {
          method: "POST",
          headers: { Authorization: `Token ${token}` },
        }
      );
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error("Comment upvote error:", err);
    }
  };

  const handleEditComment = async (commentId, updatedText) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: updatedText }),
      });
      if (res.ok) fetchComments();
    } catch (err) {
      console.error("Edit comment error:", err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(`${BASE_URL}/api/comments/${commentId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) fetchComments();
    } catch (err) {
      console.error("Delete comment error:", err);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <Comment
            user={item.author}
            content={item.content}
            timestamp={new Date(item.created_at).toLocaleString()}
            upvotes={item.upvote_count}
            isOwn={currentUser?.id === item.author.id}
            onUpvote={() => handleCommentUpvote(item.id)}
            onEdit={(text) => handleEditComment(item.id, text)}
            onDelete={() => handleDeleteComment(item.id)}
            getFullMediaUrl={getFullMediaUrl} // pass if your Comment needs it
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No comments yet.</Text>
        }
      />

      <TextInput
        placeholder="Write a comment..."
        value={newComment}
        onChangeText={setNewComment}
        style={styles.input}
        multiline
      />
      <Button title="Comment" onPress={handleCommentSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fafafa",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
    backgroundColor: "#fff",
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    marginVertical: 10,
  },
});
