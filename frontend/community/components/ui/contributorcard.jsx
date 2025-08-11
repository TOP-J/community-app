// components/ui/ContributorCard.jsx
import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { getFullMediaUrl } from "../../utils/media";

export default function ContributorCard({ profile_picture, username, rep, badge, gender }) {
  const defaultAvatar =
    gender?.toLowerCase() === "female"
      ? require("../../assets/images/female-avatar.png")
      : require("../../assets/images/male-avatar.png");

  // Try to build full URL (handles string or object)
  const fullUrl = getFullMediaUrl(profile_picture);
  const avatarSource = fullUrl ? { uri: fullUrl } : defaultAvatar;

  // Format reputation safely
  let repNumber = 0;
  if (typeof rep === "number") repNumber = rep;
  else if (typeof rep === "string" && rep.trim() !== "" && !isNaN(Number(rep))) repNumber = Number(rep);
  const formattedRep = repNumber.toLocaleString();

  return (
    <View style={styles.card}>
      <Image source={avatarSource} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name}>{username}</Text>
        <Text style={styles.rep}>Rep: {formattedRep}</Text>
        {badge ? <Text style={styles.badge}>{badge}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    backgroundColor: "#f9f9f9",
    padding: 8,
    borderRadius: 10,
    elevation: 2,
  },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  info: { marginLeft: 10 },
  name: { fontSize: 14, fontWeight: "100" },
  rep: { fontSize: 12, color: "green", fontWeight: "200" },
  badge: {
    fontSize: 10,
    color: "white",
    backgroundColor: "green",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    overflow: "hidden",
  },
});
