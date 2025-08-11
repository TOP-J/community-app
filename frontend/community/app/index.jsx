import React from "react";
import { Text, View, Pressable, StyleSheet, Image, SafeAreaView} from "react-native";
import { Link } from 'expo-router'
import {Button} from "../components/ui/button";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F0F4F1" }}>
      <View style={[styles.container, { justifyContent: "flex-start" }]}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 30, color: "#0C6216" }}>
          Welcome to the Community App!
        </Text>
        <Image
          source={require('../assets/images/app-logo.png')}
          style={{ width: 293, height: 293, marginBottom: 24 }}
        />
        <Text style={{ fontSize: 16, marginBottom: 11, color: "#0C6216" }}>
          Start connecting with your peers today!
        </Text>
        <Link href='./login' asChild>
          <Button style={styles.button}>
            <Text style={{ color: "#fff", fontSize: 20 }}>Get Started</Text>
          </Button>
        </Link>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    minHeight: '100%',
    backgroundColor: "#F0F4F1",
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    bottom: "20%",
  }
});