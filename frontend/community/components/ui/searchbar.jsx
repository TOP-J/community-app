import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Search } from 'lucide-react-native';  // or use your preferred icon

export default function SearchBar({ value, onChangeText }) {
  return (
    <View style={styles.container}>
      <Search size={20} color="#666" />
      <TextInput
        style={styles.input}
        placeholder="Search here..."
        placeholderTextColor="#666"
        value={value}
        onChangeText={onChangeText}
        returnKeyType="search"
        // Add other props as needed
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
     width: '95%',                // ✅ 80% width
    alignSelf: 'center',         // ✅ center horizontally
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 25,
    backgroundColor: 'rgba(208, 212, 215, 1)',
    position: 'relative',
  },
  input: {
    flex: 1, // take remaining width
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
});
