import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export function ProfileSidebar({ isOpen, onClose, menuItems = [], children }) {
  const sidebarTranslateX = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [userName, setUserName] = useState("My Profile");
  const navigation = useNavigation();

  // Fetch logged-in user name
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) return;
        const res = await fetch('http://192.168.8.102:8000/api/users/me/', {
          headers: { Authorization: `Token ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.full_name || data.username || "My Profile");
        }
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();
  }, []);

  // Animate sidebar open/close
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(sidebarTranslateX, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(sidebarTranslateX, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  // Logout handler
  const handleLogout = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (!token) return;
      await fetch('http://192.168.8.102:8000/auth/token/logout/', {
        method: 'POST',
        headers: { Authorization: `Token ${token}` },
      });
      await SecureStore.deleteItemAsync('auth_token');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <>
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarTranslateX }] },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{userName}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarContent}>
          {menuItems.map((item, index) => {
            // Override logout behavior
            if (item.label.toLowerCase() === 'logout') {
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={handleLogout}
                >
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              );
            }
            return (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
          {children}
        </View>
      </Animated.View>

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      >
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 10,
  },
  overlayTouchable: { flex: 1 },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: width * 0.75,
    backgroundColor: '#293A2E',
    zIndex: 20,
    paddingTop: 40,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: { padding: 5 },
  sidebarContent: { flex: 1, paddingTop: 20 },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: { fontSize: 18, color: '#fff', fontWeight: '500' },
});
