import React from "react";
import { TextInput } from "react-native";

export function Input({ value, onChangeText, placeholder, style }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      style={[styles.input, style]}
      placeholderTextColor="#888"
    />
  );
}

const styles = {
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#F2F2F2",
  },
};