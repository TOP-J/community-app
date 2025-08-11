import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function ImageUploader({ image, setImage }) {
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return alert('Permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ only images
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Upload Image</Text>
      {image ? (
        <Image source={{ uri: image.uri }} style={styles.preview} />
      ) : null}
      <TouchableOpacity style={styles.button} onPress={pickImage}>
        <Text style={styles.buttonText}>Choose Image</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontWeight: 'bold', marginBottom: 6, color: '#247b3b' },
  preview: { width: '100%', height: 200, borderRadius: 6, marginBottom: 8 },
  button: {
    backgroundColor: '#247b3b',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
