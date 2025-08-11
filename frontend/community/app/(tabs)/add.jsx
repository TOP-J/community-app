import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';

import InputField from '../../components/ui/inputfield';
import ImageUploader from '../../components/ui/imageuploader';
import SpaceModalSelector from '../../components/ui/spacemodalselector';

const { height: screenHeight } = Dimensions.get('window');

export default function AddScreen() {
  const [type, setType] = useState('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [spaceId, setSpaceId] = useState(null);
  const [mySpaceId, setMySpaceId] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!title || !content || !spaceId) {
      return;
    }

    const token = await SecureStore.getItemAsync('auth_token');
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);

    const finalSpaceId = spaceId || mySpaceId;
    if (finalSpaceId) {
      formData.append('space_id', finalSpaceId);
    }

    if (type === 'post' && image) {
      formData.append('media', {
        uri: image.uri,
        name: image.fileName || 'upload.jpg',
        type: image.mimeType || 'image/jpeg',
      });
    }

    const endpoint = type === 'post' ? '/api/posts/' : '/api/questions/';
    setLoading(true);

    try {
      const res = await fetch(`http://192.168.8.102:8000${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        playSuccessSound();
        Alert.alert('Success', `${type === 'post' ? 'Post' : 'Question'} submitted.`);

        setTitle('');
        setContent('');
        setImage(null);
        setSpaceId(null);

        if (type === 'question') {
          if (finalSpaceId && mySpaceId && String(finalSpaceId) === String(mySpaceId)) {
            navigation.navigate('stack');
          } else {
            navigation.navigate('space');
          }
        }

        setMySpaceId(null);
      } else {
        Alert.alert('Error', 'Submission failed. Check your inputs.');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const playSuccessSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/success.wav')
      );
      await sound.playAsync();
    } catch (err) {
      console.warn('Sound failed:', err);
    }
  };

  const isSubmitDisabled = !title.trim() || !content.trim() || !spaceId;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.container, { minHeight: screenHeight }]}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {type === 'post' ? 'Create Post' : 'Ask a Question'}
          </Text>
        </View>

        {/* Toggle between post and question */}
        <View style={styles.toggleWrapper}>
          <View style={styles.toggleTrack}>
            <TouchableOpacity
              onPress={() => setType('post')}
              style={[styles.toggleOption, type === 'post' && styles.activeToggle]}
            >
              <Text style={type === 'post' ? styles.activeText : styles.inactiveText}>Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setType('question')}
              style={[styles.toggleOption, type === 'question' && styles.activeToggle]}
            >
              <Text style={type === 'question' ? styles.activeText : styles.inactiveText}>Question</Text>
            </TouchableOpacity>
          </View>
        </View>

        <InputField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder={type === 'post' ? 'Enter post title' : 'Enter question title'}
        />

        <InputField
          label=""
          value={content}
          onChangeText={setContent}
          multiline
          placeholder="Share your thoughts..."
          plachoderColor="black"

        />

        <SpaceModalSelector
          label="Peers in this space can see your post/question"
          selected={spaceId}
          onChange={(id, isMySpace = false) => {
            if (isMySpace) setMySpaceId(id);
            setSpaceId(id);
          }}
        />

        {type === 'post' && <ImageUploader image={image} setImage={setImage} />}

        <TouchableOpacity
          style={[styles.submitBtn, isSubmitDisabled && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={loading || isSubmitDisabled}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 40,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 12,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#222',
  },
  toggleWrapper: {
    marginBottom: 20,
  },
  toggleTrack: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    overflow: 'hidden',
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeToggle: {
    backgroundColor: '#247b3b',
  },
  activeText: {
    color: '#fff',
    fontWeight: '600',
  },
  inactiveText: {
    color: '#333',
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: '#247b3b',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 24,
  },
  disabledBtn: {
    backgroundColor: '#ccc',
  },
  submitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
