import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileSidebar } from "../../components/ui/profilesidebar";
import SearchBar from "../../components/ui/searchbar";
import { CircleUserRound } from "lucide-react-native"; // ✅ Use circle-user-round icon

export default function MessageScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);

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
      <StatusBar
        barStyle="dark-content" // 'light-content' for dark backgrounds
        backgroundColor="#ffffff" // Android only; iOS ignores this
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header row with Profile Icon and "Feed" text */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.profileButton} onPress={openSidebar}>
            <CircleUserRound size={28} color="green" />
          </TouchableOpacity>
          <Text style={styles.feedTitle}>Message</Text>
        </View>
        <SearchBar value={searchText} onChangeText={setSearchText} />
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
  container: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
  },
  scrollContent: {
    padding: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Space between icon and text
  },
  profileButton: {
    padding: 5,
    marginLeft: 0,
  },
  feedTitle: {
    fontSize: 30,
    fontWeight: "500",
  },
});
