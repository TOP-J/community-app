import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { InteractionBar } from "./interactionbar";
import { PostHeader } from "../ui/postheader";
import { getFullMediaUrl } from "../../utils/media"; // helper

export function Post({ post }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => setExpanded((prev) => !prev);

  const isLong = post.content?.length > 150;
  const displayText =
    expanded || !isLong ? post.content : post.content?.slice(0, 150) + "...";

  // Use helper for full media URL
  const mediaSource =
    post.media && post.media.trim() !== ""
      ? { uri: getFullMediaUrl(post.media) }
      : null;

  return (
    <View style={styles.card}>
      <PostHeader
        author={post.author}
        space={post.space}
        created_at={post.created_at}
      />

      <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
        {post.title}
      </Text>

      {mediaSource && (
        <Image source={mediaSource} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.contentContainer}>
        <Text style={styles.content}>{displayText}</Text>
        {isLong && (
          <TouchableOpacity onPress={toggleExpanded}>
            <Text style={styles.readMore}>
              {expanded ? "Show less" : "Read more"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <InteractionBar
        postId={post.id}
        initialLikes={post.like_count}
        initialShares={post.share_count}
        initialLiked={post.is_liked} 
        initialShared={post.is_shared}
        space={post.space} 
      />
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
  media: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    marginTop: 10,
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  content: {
    fontSize: 14,
    color: "#444",
    lineHeight: 20,
  },
  readMore: {
    color: "gray",
    marginTop: 4,
    fontWeight: "600",
  },
});
