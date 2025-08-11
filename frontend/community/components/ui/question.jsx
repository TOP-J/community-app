import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PostHeader } from "../ui/postheader";
import { MessageInteractionBar } from "./messageinteractionbar";
import { getFullMediaUrl } from "../../utils/media"; // helper

export function Question({ question }) {
  return (
    <View style={styles.card}>
      <PostHeader
        author={{
          ...question.author,
          profile: {
            ...question.author?.profile,
            profile_picture: getFullMediaUrl(question.author?.profile?.profile_picture)
          }
        }}
        space={question.space}
        created_at={question.created_at}
      />

      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
        {question.title}
      </Text>

      <Text style={styles.content}>{question.content}</Text>

      {/* Keep the message interaction bar */}
      <MessageInteractionBar
       questionId={question.id} 
       initialAnswerCount={question.answer_count}
      initialAnticipationCount={question.anticipation_count} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 6,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  content: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
