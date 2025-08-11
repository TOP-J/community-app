import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

export default function SpaceCard({ spaceId }) {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchSpace = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch(
          `http://192.168.8.102:8000/api/spaces/${spaceId}/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );

        if (!res.ok) {
          setLoading(false);
          return;
        }

        const data = await res.json();
        setSpace(data);
      } catch (error) {
        console.error('Error fetching space:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpace();
  }, [spaceId]);

  const handlePress = () => {
    if (space) {
      navigation.navigate('anyspace', { spaceId: space.id });
    }
  };

  if (loading) {
    return (
      <View style={[styles.card, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#008000" />
      </View>
    );
  }

  if (!space) {
    return (
      <View style={[styles.card, styles.errorContainer]}>
        <Text style={styles.errorText}>Failed to load space info.</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.card}
    >
      <ImageBackground
        source={
          space.space_profile_url
            ? { uri: space.space_profile_url }
            : require('../../assets/images/default_space.png')
        }
        style={styles.top}
        imageStyle={{ borderTopLeftRadius: 10, borderTopRightRadius: 10 }}
        resizeMode="cover"
      >
        <View style={styles.adminPicWrapper}>
          <Image
            source={
              space.admin?.profile_picture
                ? { uri: space.admin.profile_picture }
                : require('../../assets/images/male-avatar.png')
            }
            style={styles.adminPic}
          />
        </View>
      </ImageBackground>

      <View style={styles.bottom}>
        <Text style={styles.spaceName}>{space.name}</Text>
        <Text style={styles.spaceDescription} numberOfLines={3}>
          {space.description || 'Explore this space to learn more.'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 300,
    borderRadius: 10,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    marginVertical: 10,
    overflow: 'hidden',
    marginRight: 10,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
  },
  top: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  adminPicWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adminPic: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  bottom: {
    padding: 15,
  },
  spaceName: {
    fontSize: 20,
    fontWeight: '400',
    color: 'black', 
    marginBottom: 6,
  },
  spaceDescription: {
    fontSize: 14,
    color: '#222', 
  },
});
