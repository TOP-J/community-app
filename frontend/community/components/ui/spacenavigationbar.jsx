import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  useWindowDimensions,
  PanResponder,
} from "react-native";

const TAB_LABELS = ["Questions", "Posts", "KnowledgeHub"];

export default function SpaceNavigationBar({ activeTab, onTabChange }) {
  const { width } = useWindowDimensions();
  const TAB_COUNT = TAB_LABELS.length;
  const TAB_WIDTH = width / TAB_COUNT;

  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const activeIndex = TAB_LABELS.indexOf(activeTab);
    Animated.spring(translateX, {
      toValue: activeIndex * TAB_WIDTH,
      useNativeDriver: true,
      stiffness: 150,
      damping: 20,
      mass: 1,
    }).start();
  }, [activeTab, TAB_WIDTH]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > 10,
      onPanResponderMove: (_, gestureState) => {
        const activeIndex = TAB_LABELS.indexOf(activeTab);
        let dx = gestureState.dx + activeIndex * TAB_WIDTH;
        dx = Math.min(Math.max(dx, 0), TAB_WIDTH * (TAB_COUNT - 1));
        translateX.setValue(dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        const activeIndex = TAB_LABELS.indexOf(activeTab);
        let dx = gestureState.dx + activeIndex * TAB_WIDTH;
        dx = Math.min(Math.max(dx, 0), TAB_WIDTH * (TAB_COUNT - 1));
        let newIndex = Math.round(dx / TAB_WIDTH);
        onTabChange(TAB_LABELS[newIndex]);
      },
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container} {...panResponder.panHandlers}>
        {TAB_LABELS.map((label, i) => (
          <Pressable
            key={i}
            style={styles.tab}
            onPress={() => onTabChange(label)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === label && styles.activeTabText,
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {label}
            </Text>
          </Pressable>
        ))}

        <Animated.View
          style={[
            styles.underline,
            { width: TAB_WIDTH, transform: [{ translateX }] },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
    backgroundColor: "black",
    
  },
  container: {
    flexDirection: "row",
    position: "relative",
    width: "100%",
    height: 50,
    alignItems: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "bold",
  },
  underline: {
    position: "absolute",
    height: 3,
    bottom: 0,
    backgroundColor: "white",
  },
});