import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";

import { ProfileSidebar } from "../../components/ui/profilesidebar";
import SearchBar from "../../components/ui/searchbar";
import { CircleUserRound } from "lucide-react-native"; 
import { SpaceHeader } from "../../components/ui/spaceheader";
import SpaceCategoryRow from "../../components/ui/spacecategoryrow";

export default function SpaceScreen({ navigation }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [spacesByCategory, setSpacesByCategory] = useState({});

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        if (!token) return;

        const res = await fetch("http://192.168.8.102:8000/api/spaces/", {
          headers: { Authorization: `Token ${token}` },
        });

        if (res.ok) {
          const allSpaces = await res.json();

          // Group spaces by category name
          const grouped = allSpaces.reduce((acc, space) => {
            const categoryName = space.category?.name || "Uncategorized";
            if (!acc[categoryName]) acc[categoryName] = [];
            acc[categoryName].push(space);
            return acc;
          }, {});

          setSpacesByCategory(grouped);
        } else {
          console.error("Failed to fetch spaces", res.status);
        }
      } catch (error) {
        console.error("Error fetching spaces:", error);
      }
    };

    fetchSpaces();
  }, []);

  const menuItems = [
    { label: "Account", onPress: () => { console.log("Account pressed"); closeSidebar(); } },
    { label: "Settings", onPress: () => { console.log("Settings pressed"); closeSidebar(); } },
    { label: "Logout", onPress: () => { console.log("Logout pressed"); closeSidebar(); } },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.profileButton} onPress={openSidebar}>
            <CircleUserRound size={28} color="green" />
          </TouchableOpacity>
          <Text style={styles.feedTitle}>Space</Text>
        </View>
        <SearchBar value={searchText} onChangeText={setSearchText} />
        <SpaceHeader />
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 5, paddingHorizontal: 10 }}>
          <Text style={styles.discoverSpaces}>Discover Spaces</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Spaces")}>
            <Text style={styles.viewAll}>view all</Text>
          </TouchableOpacity>
        </View>

        {/* Render a SpaceCategoryRow for each category */}
        {Object.entries(spacesByCategory).map(([categoryName, spaces]) => (
          <SpaceCategoryRow
            key={categoryName}
            categoryName={categoryName}
            spaces={spaces}
          />
        ))}
      </ScrollView>

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
  scrollContent: { padding: 2 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileButton: { padding: 5, marginLeft: 0 },
  feedTitle: { fontSize: 30, fontWeight: "500" },
  discoverSpaces: { fontSize: 20, fontWeight: "300", marginTop: 5 },
  viewAll: { fontSize: 20, color: "#2F2E41", fontWeight: "200" },
});
