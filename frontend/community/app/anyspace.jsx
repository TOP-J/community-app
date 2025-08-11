import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileSidebar } from "../components/ui/profilesidebar";
import SearchBar from "../components/ui/searchbar";
import { CircleUserRound } from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import * as SecureStore from "expo-secure-store";
import ContributorCard from "../components/ui/contributorcard";
import SpaceNavigationBar from "../components/ui/spacenavigationbar";
import { Question } from "../components/ui/question";
import { Post } from "../components/ui/post";
import { Ionicons } from "@expo/vector-icons";
import { getFullMediaUrl } from "../utils/media";

export default function AnySpace() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [space, setSpace] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Questions");
  const [questions, setQuestions] = useState([]);
  const [posts, setPosts] = useState([]);

  const route = useRoute();
  const navigation = useNavigation();
  const { spaceId } = route.params || {};

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  const menuItems = [
    { label: "Account", onPress: () => closeSidebar() },
    { label: "Settings", onPress: () => closeSidebar() },
    { label: "Logout", onPress: () => closeSidebar() },
  ];

  const fetchContent = async (tab) => {
    try {
      setLoading(true);
      const token = await SecureStore.getItemAsync("auth_token");
      if (!token) {
        setLoading(false);
        return;
      }

      if (tab === "Questions") {
        const questionsRes = await fetch(
          `http://192.168.8.102:8000/api/spaces/${spaceId}/questions/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions || []);
      } else if (tab === "Posts") {
        const postsRes = await fetch(
          `http://192.168.8.102:8000/api/spaces/${spaceId}/posts/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);
      }
    } catch (err) {
      console.error(`Error fetching ${tab}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) {
          setLoading(false);
          return;
        }

        const [spaceRes, contribRes] = await Promise.all([
          fetch(`http://192.168.8.102:8000/api/spaces/${spaceId}/`, {
            headers: { Authorization: `Token ${token}` },
          }),
          fetch(
            `http://192.168.8.102:8000/api/spaces/${spaceId}/top_contributors/`,
            {
              headers: { Authorization: `Token ${token}` },
            }
          ),
        ]);

        if (spaceRes.ok) {
          const spaceData = await spaceRes.json();
          setSpace(spaceData);
        }

        if (contribRes.ok) {
          const contribData = await contribRes.json();
          setContributors(contribData.contributors || []);
        }
      } catch (err) {
        console.error("Error fetching space or contributors:", err);
      }
    };

    if (spaceId) {
      fetchData();
      fetchContent(activeTab);
    }
  }, [spaceId, activeTab]);

  // Prepare data and render item for FlatList
  const data = activeTab === "Questions" ? questions : posts;

  const renderItem = ({ item }) => {
    if (activeTab === "Questions") {
      return <Question key={item.id} question={item} />;
    }
    if (activeTab === "Posts") {
      return <Post key={item.id} post={item} />;
    }
    return null;
  };

  // Header content for FlatList: all the content above the list items
  const ListHeaderComponent = () => (
    <>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.profileButton} onPress={openSidebar}>
          <CircleUserRound size={28} color="green" />
        </TouchableOpacity>
        <Text style={styles.feedTitle}>Space</Text>
      </View>

      <SearchBar value={searchText} onChangeText={setSearchText} />

      {/* Loading or Space Details */}
      {loading && activeTab === "Questions" ? (
        <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
      ) : space ? (
        <View style={styles.spaceDetails}>
          {/* Background image with back button */}
          <ImageBackground
            source={
              space.space_profile_url
                ? { uri: getFullMediaUrl(space.space_profile_url) }
                : require("../assets/images/default_space.png")
            }
            style={styles.spaceImage}
            imageStyle={{ borderRadius: 10 }}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            <View style={styles.overlay} />
          </ImageBackground>

          <Text style={styles.spaceName}>{space.name}</Text>
          <Text style={styles.spaceDescription}>{space.description}</Text>

          {/* Contributors */}
          <View style={{ marginTop: 15 }}>
            <Text style={styles.topcontributors}>Top contributors</Text>
            {contributors.map((c, index) => (
              <ContributorCard
                key={index}
                profile_picture={getFullMediaUrl(c.profile?.profile_picture)}
                username={c.username}
                rep={
                  c.profile?.rep !== undefined
                    ? c.profile.rep
                    : c.rep !== undefined
                    ? c.rep
                    : 0
                }
                badge={c.profile?.community_badge || null}
                gender={c.profile?.gender || "Male"}
              />
            ))}
            {space.member_count > 3 && (
              <Text style={{ fontSize: 12, marginTop: 5, color: "#555" }}>
                ... and more are contributors to this space
              </Text>
            )}
          </View>
        </View>
      ) : (
        <Text style={styles.errorText}>Failed to load space details.</Text>
      )}

      {/* Navigation Tabs */}
      <SpaceNavigationBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Loading indicator for non-Questions tabs */}
      {loading && activeTab !== "Questions" && (
        <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <FlatList
        contentContainerStyle={styles.scrollContent}
        data={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={ListHeaderComponent}
        stickyHeaderIndices={[6]} // Adjust index to the tab bar in the header components
        // You may adjust this index if you add/remove components above the tab bar
      />

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
  container: { flex: 1, width: "100%", minHeight: "100%" },
  scrollContent: { padding: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileButton: { padding: 5 },
  feedTitle: { fontSize: 30, fontWeight: "500" },
  spaceDetails: { marginTop: 20 },
  spaceImage: { width: "100%", height: 200, justifyContent: "flex-start" },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    zIndex: 2,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 6,
    borderRadius: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
  },
  spaceName: { fontSize: 24, fontWeight: "400", marginTop: 10, color: "#000" },
  spaceDescription: { fontSize: 16, marginTop: 5, color: "#333" },
  errorText: { marginTop: 20, color: "red", textAlign: "center" },
  topcontributors: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: "200",
    color: "#333",
  },
});
