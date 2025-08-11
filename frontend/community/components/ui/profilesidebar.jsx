import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { X } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export function ProfileSidebar({ isOpen, onClose, title, menuItems, children }) {
  const sidebarTranslateX = useRef(new Animated.Value(-width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

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

  return (
    <>
      {/* Sidebar Component */}
      <Animated.View
        style={[
          styles.sidebar,
          { transform: [{ translateX: sidebarTranslateX }] },
        ]}
      >
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.sidebarContent}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <Text style={styles.menuItemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
          {children}
        </View>
      </Animated.View>

      {/* Overlay Component */}
      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.overlay,
          { opacity: overlayOpacity },
        ]}
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
  overlayTouchable: {
    flex: 1,
  },
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
  closeButton: {
    padding: 5,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 20,
  },
  menuItem: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  menuItemText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
});
