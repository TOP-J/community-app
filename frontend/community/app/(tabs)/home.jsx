import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CircleUserRound } from "lucide-react-native";
import { ProfileSidebar } from "../../components/ui/profilesidebar";
import SearchBar from "../../components/ui/searchbar";
import { Post } from "@/components/ui/post";
import * as SecureStore from "expo-secure-store";

export default function HomeScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) {
          console.warn("No auth token found");
          return;
        }

        const response = await fetch("http://192.168.8.102:8000/api/posts/", {
          headers: {
            Authorization: `Token ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch posts:", response.status);
          return;
        }

        const data = await response.json();
        const rawPosts = Array.isArray(data) ? data : data.results || [];
        const globalPosts = rawPosts.filter((p) => !p.space);
        const sorted = globalPosts.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setPosts(sorted);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const menuItems = [
    {
      label: "Account",
      onPress: () => {
        console.log("Account pressed");
        closeSidebar();
      },
    },
    {
      label: "Settings",
      onPress: () => {
        console.log("Settings pressed");
        closeSidebar();
      },
    },
    {
      label: "Logout",
      onPress: () => {
        console.log("Logout pressed");
        closeSidebar();
      },
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profileButton} onPress={openSidebar}>
          <CircleUserRound size={28} color="green" />
        </TouchableOpacity>
        <Text style={styles.feedTitle}>Feed</Text>
      </View>

      <SearchBar value={searchText} onChangeText={setSearchText} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="green"
          style={{ marginTop: 20 }}
        />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.scrollContent}
          renderItem={({ item }) => <Post post={item} />}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No posts found.
            </Text>
          }
        />
      )}

      <ProfileSidebar
        isOpen={isSidebarOpen}
        onClose={closeSidebar}
        title="My Profile"
        menuItems={menuItems}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    backgroundColor: "#fff",
  },
  scrollContent: {
    padding: 10,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  profileButton: {
    padding: 5,
  },
  feedTitle: {
    fontSize: 30,
    fontWeight: "500",
  },
});
