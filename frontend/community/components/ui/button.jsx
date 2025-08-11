import React from "react";
import { StyleSheet, Pressable, Text } from "react-native";

export function Button({ children, onPress, style, textStyle }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, textStyle]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#293A2E",
    width: 283,
    height: 43,
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    alignSelf: "center",
  },
  buttonPressed: {
    backgroundColor: "#247b3bff",
    opacity: 0.5,
  },
  text: {
    color: "#fff",
    fontSize: 16,
  },
});
