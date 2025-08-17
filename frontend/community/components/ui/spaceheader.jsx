import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { ArrowRight } from "lucide-react-native";
import * as SecureStore from "expo-secure-store";

export const SpaceHeader = () => {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchMySpace = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        const res = await fetch(
          "http://192.168.8.102:8000/api/spaces/my_space/",
          {
            headers: {
              Authorization: `Token ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          setSpace(data);
        } else {
          console.error("Failed to fetch space");
        }
      } catch (error) {
        console.error("Error fetching space:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMySpace();
  }, []);

  if (loading) {
    return (
      <View style={styles.wrapper}>
        <ActivityIndicator size="small" color="green" />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.wrapper}
      onPress={() => navigation.navigate("anyspace", { spaceId: space.id })}
    >
      <Image
        source={
          space?.space_profile
            ? { uri: space.space_profile }
            : require("../../assets/images/default_space.png")
        }
        style={styles.image}
      />
      <Text style={styles.spaceName}>{space?.name || "Unnamed Space"}</Text>
      <ArrowRight size={24} color="#222" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    padding: 12,
    backgroundColor: "#E6E6E6",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderBottomWidth: 1,
    borderColor: "#ddd",
    marginTop: 5,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eee",
  },
  spaceName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "300",
    color: "#222",
  },
});
