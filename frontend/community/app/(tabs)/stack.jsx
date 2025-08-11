import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileSidebar } from "../../components/ui/profilesidebar";
import SearchBar from "../../components/ui/searchbar";
import { CircleUserRound } from "lucide-react-native";
import { Question } from "../../components/ui/question";
import * as SecureStore from "expo-secure-store";

export default function StackScreen() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const token = await SecureStore.getItemAsync("auth_token");
        const response = await fetch(
          "http://192.168.8.102:8000/api/questions/",
          {
            headers: {
              Authorization: `Token ${token}`,
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Non-JSON response:", errorText);
          throw new Error("Failed to fetch questions");
        }

        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Fetch questions error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchQuestions();
  }, []);

  const filteredQuestions = questions.filter(
    (q) =>
      q.title.toLowerCase().includes(searchText.toLowerCase()) ||
      q.content.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.profileButton} onPress={openSidebar}>
            <CircleUserRound size={28} color="green" />
          </TouchableOpacity>
        
          <Text style={styles.feedTitle}>Stack</Text>
        </View>

        {/* Search Bar */}
        <SearchBar value={searchText} onChangeText={setSearchText} />

        {/* Loading state */}
        {loading && (
          <ActivityIndicator
            size="large"
            color="green"
            style={{ marginTop: 20 }}
          />
        )}

        {/* Questions */}
        {!loading &&
          filteredQuestions.map((question) => (
            <Question key={question.id} question={question} />
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
    gap: 10,
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
