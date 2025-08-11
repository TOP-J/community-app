import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';

export default function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
}) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888" // ✅ visible on white
        multiline={multiline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '600',
    marginBottom: 6,
    color: '#333', // ✅ readable
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fff',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
