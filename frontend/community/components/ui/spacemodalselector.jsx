// components/ui/spaceModalSelector.jsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  StyleSheet,
  Pressable,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';

export default function SpaceModalSelector({ selected, onChange }) {
  const [spaces, setSpaces] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [mySpaceId, setMySpaceId] = useState(null);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return;

        const res = await fetch('http://192.168.8.102:8000/api/spaces/', {
          headers: { Authorization: `Token ${token}` },
        });

        const allSpaces = await res.json();
        setSpaces(allSpaces);

        const myRes = await fetch('http://192.168.8.102:8000/api/spaces/my_space/', {
          headers: { Authorization: `Token ${token}` },
        });

        if (myRes.ok) {
          const mySpace = await myRes.json();
          setMySpaceId(mySpace.id);
          onChange(mySpace.id, true); // fallback only
        }
      } catch (error) {
        console.error('Error fetching spaces:', error);
      }
    };

    fetchSpaces();
  }, []);

  const current = spaces.find(space => space.id === selected);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Space</Text>

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectedText}>
          {current ? current.name : 'Tap to select a space'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          onPress={() => setModalVisible(false)}
          style={styles.overlay}
        >
          <View style={styles.modal}>
            <Text style={styles.modalHeader}>Choose a space</Text>
            <FlatList
              data={spaces}
              keyExtractor={item => item.id.toString()}
              renderItem={({ item }) => {
                const isMySpace = item.id === mySpaceId;
                return (
                  <TouchableOpacity
                    style={styles.item}
                    onPress={() => {
                      onChange(item.id, false);
                      setModalVisible(false);
                    }}
                  >
                    
                    <Image
                      source={
                        item.space_profile_url
                          ? { uri: item.space_profile_url }
                          : require('../../assets/images/default_space.png')
                      }
                      style={styles.icon}
                    />
                    <Text style={styles.itemText}>
                      {item.name} {isMySpace ? '⭐' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#222',
  },
  selector: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 14,
    backgroundColor: '#fff',
  },
  selectedText: {
    fontSize: 16,
    color: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
    maxHeight: '60%',
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#000',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
});
