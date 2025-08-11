import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  TextInput,
  Button,
  Alert,
} from "react-native";
import { PencilLine, Star } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";
import { Comment } from "../ui/comment";

export function MessageInteractionBar({
  questionId,
  initialAnswerCount = 0,
  initialAnticipationCount = 0,
}) {
  const BASE_URL = "http://192.168.8.102:8000";

  const [showAnswers, setShowAnswers] = useState(false);
  const [answers, setAnswers] = useState([]);
  const [answerCount, setAnswerCount] = useState(initialAnswerCount);
  const [anticipations, setAnticipations] = useState(initialAnticipationCount);
  const [anticipators, setAnticipators] = useState([]);
  const [showAnticipations, setShowAnticipations] = useState(false);
  const [newAnswer, setNewAnswer] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const fetchCurrentUser = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    const res = await fetch(`${BASE_URL}/api/users/me/`, {
      headers: { Authorization: `Token ${token}` },
    });
    const data = await res.json();
    if (res.ok) setCurrentUser(data);
  };

  const fetchAnswers = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    const res = await fetch(
      `${BASE_URL}/api/questions/${questionId}/answers/`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    );
    const data = await res.json();
    if (res.ok) {
      const sorted = data.sort((a, b) => b.upvotes - a.upvotes);
      setAnswers(sorted);
    }
  };

  const fetchAnticipators = async () => {
    const token = await SecureStore.getItemAsync("auth_token");
    const res = await fetch(
      `${BASE_URL}/api/questions/${questionId}/anticipators/`,
      {
        headers: { Authorization: `Token ${token}` },
      }
    );
    const data = await res.json();
    if (res.ok) setAnticipators(data);
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleAnswerSubmit = async () => {
    if (!newAnswer.trim()) {
      Alert.alert("Answer box is empty");
      return;
    }

    try {
      const token = await SecureStore.getItemAsync("auth_token");
      const res = await fetch(
        `${BASE_URL}/api/questions/${questionId}/answers/`,
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: newAnswer }),
        }
      );

      if (res.ok) {
        setNewAnswer("");
        setAnswerCount((prev) => prev + 1);
        fetchAnswers();
      } else {
        Alert.alert("Error", "Could not submit answer");
      }
    } catch (err) {
      console.error("Post answer error:", err);
    }
  };

  const handleUpvote = async (answerId) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(
        `${BASE_URL}/api/answers/${answerId}/toggle_upvote/`,
        {
          method: "POST",
          headers: { Authorization: `Token ${token}` },
        }
      );
      if (res.ok) fetchAnswers();
    } catch (err) {
      console.error("Upvote error:", err);
    }
  };

  const handleEdit = async (answerId, updatedText) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(`${BASE_URL}/api/answers/${answerId}/`, {
        method: "PATCH",
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: updatedText }),
      });
      if (res.ok) fetchAnswers();
    } catch (err) {
      console.error("Edit answer error:", err);
    }
  };

  const handleDelete = async (answerId) => {
    const token = await SecureStore.getItemAsync("auth_token");
    try {
      const res = await fetch(`${BASE_URL}/api/answers/${answerId}/`, {
        method: "DELETE",
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) fetchAnswers();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleAnswers = () => {
    setShowAnswers((prev) => !prev);
    if (!showAnswers) fetchAnswers();
  };

  const toggleAnticipations = () => {
    setShowAnticipations((prev) => !prev);
    if (!showAnticipations) fetchAnticipators();
  };

  return (
    <View>
      <View style={styles.top}>
        <Text style={styles.countText}>
          {showAnswers ? answers.length : answerCount} answers
        </Text>
        <Text style={styles.countText}>
          {showAnticipations ? anticipators.length : anticipations}{" "}
          anticipations
        </Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.icon} onPress={toggleAnswers}>
          <PencilLine size={20} color={showAnswers ? "#247b3b" : "#555"} />
          <Text style={styles.label}>Answer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.icon}
          onPress={async () => {
            try {
              const token = await SecureStore.getItemAsync("auth_token");
              const res = await fetch(
                `${BASE_URL}/api/questions/${questionId}/toggle_anticipation/`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Token ${token}`,
                  },
                }
              );

              if (res.ok) {
                const data = await res.json();
                setAnticipations(data.anticipator_count); // update count
                fetchAnticipators(); // refresh list if shown
              }
            } catch (err) {
              console.error("Anticipate toggle error:", err);
            }
          }}
        >
          <Star size={20} color={showAnticipations ? "#247b3b" : "#555"} />
          <Text style={styles.label}>Anticipate</Text>
        </TouchableOpacity>
      </View>

      {showAnswers && (
        <View style={styles.answersSection}>
          {answers.map((answer) => (
            <Comment
              key={answer.id}
              user={answer.author}
              content={answer.content}
              timestamp={new Date(answer.created_at).toLocaleString()}
              upvotes={answer.upvotes}
              isOwn={
                currentUser?.id != null && answer?.author?.id === currentUser.id
              }
              onUpvote={() => handleUpvote(answer.id)}
              onEdit={(text) => handleEdit(answer.id, text)}
              onDelete={() => handleDelete(answer.id)}
            />
          ))}

          <TextInput
            placeholder="Write an answer..."
            value={newAnswer}
            onChangeText={setNewAnswer}
            style={styles.input}
          />
          <Button title="Answer" onPress={handleAnswerSubmit} />
        </View>
      )}

      {showAnticipations && (
        <View style={styles.answersSection}>
          {anticipators.map((user) => (
            <Comment
              key={user.id}
              user={user}
              content="Anticipated this question"
              timestamp=""
              isOwn={false}
              onUpvote={null}
              onEdit={null}
              onDelete={null}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  top: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 2,
  },
  countText: {
    fontSize: 12,
    color: "#333",
    opacity: 0.6,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  icon: {
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    color: "#444",
    marginTop: 2,
  },
  answersSection: {
    paddingHorizontal: 10,
    paddingBottom: 10,
    backgroundColor: "#fafafa",
  },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 10,
    backgroundColor: "#fff",
  },
});
