import React, { useState } from "react";
import {
  Alert,
  Text,
  SafeAreaView,
  Image,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
} from "react-native";
import { Button } from "../components/ui/button";
import * as SecureStore from "expo-secure-store"; // Import SecureStore for secure token storage
import { useRouter } from "expo-router";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Placeholder for a custom message display function (replaces Alert.alert)

  const showMessage = (title, message, type = "info") => {
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    // If you later integrate a UI library for toasts/modals, you'd put that logic here.
  };
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    let response = null;

    try {
      // Correct URL for Djoser's token login endpoint
      const url = "http://192.168.8.102:8000/api/auth/token/login/";

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      // Check if the response was successful (status code 2xx)
      if (response.ok) {
        const data = await response.json();
        const authToken = data.auth_token;

        // Securely store the authentication token
        await SecureStore.setItemAsync("auth_token", authToken);
        showMessage(
          "Login successful",
          `Welcome, ${username}! Token saved.`,
          "success"
        );
        console.log("Auth Token:", authToken); // For debugging, remove in production

        // navigating to the Home tab in tabs
        router.replace("/home");
      } else {
        // Handle non-200 responses (e.g., 400 Bad Request, 401 Unauthorized)
        const errorData = await response.json(); // Attempt to parse error details
        const errorMessage =
          errorData.detail ||
          errorData.non_field_errors ||
          "Invalid credentials. Please try again.";
        showMessage("Login failed", errorMessage, "error");
        console.error("Login API Error:", response.status, errorData);
      }
    } catch (error) {
      // This catch block handles network errors (e.g., server not running, no internet)
      // where no 'response' object might be available, or other unexpected errors.
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        showMessage(
          "Network Error",
          "Could not connect to the server. Please check your connection.",
          "error"
        );
      } else if (response && response.json) {
        // If response object exists and has a .json() method, try to parse it
        // This handles cases where the server responded, but parsing failed for other reasons
        try {
          const errorData = await response.json();
          const errorMessage =
            errorData.detail ||
            errorData.non_field_errors ||
            "An unexpected error occurred.";
          showMessage("Error", errorMessage, "error");
          console.error("API Error (JSON parse attempt):", errorData);
        } catch (jsonError) {
          // Fallback if response was not valid JSON
          showMessage(
            "Error",
            "An unexpected error occurred. Server response was not valid JSON.",
            "error"
          );
          console.error("Error parsing JSON response:", jsonError);
          console.error(
            "Raw response text:",
            response.text ? await response.text() : "No response text"
          );
        }
      } else {
        // General unexpected error
        showMessage(
          "Error",
          "An unexpected error occurred. Please try again.",
          "error"
        );
        console.error("General error during login:", error);
      }
    } finally {
      setLoading(false); // Always stop loading, regardless of success or failure
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4F1" }}>
      <View style={[styles.container, { justifyContent: "flex-start" }]}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            marginBottom: 30,
            marginTop: 2,
            color: "#0C6216",
          }}
        >
          Login!
        </Text>
        <Image
          source={require("../assets/images/app-logo.png")}
          style={{ width: 293, height: 293, marginTop: 0, marginBottom: 24 }}
        />
        <Text style={{ fontSize: 16, marginBottom: 11, color: "#0C6216" }}>
          Enter credentials to login
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="gray"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="gray"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Button
          onPress={handleLogin}
          style={styles.button}
          textStyle={{ fontWeight: "bold", fontSize: 20 }}
          disabled={!username.trim() || !password.trim() || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : "Login"}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
    backgroundColor: "#F0F4F1",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: 283,
    height: 43,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 12,
    marginBottom: 16,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  button: {
    bottom: "20%",
    
  },
});
