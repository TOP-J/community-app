import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SpaceCard from '../ui/spacecard'; 

export default function SpaceCategoryRow({ categoryName, spaces }) {
  if (!spaces || spaces.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.categoryTitle}>{categoryName}</Text>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={spaces}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <SpaceCard spaceId={item.id} />}
        contentContainerStyle={styles.listContent}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: 100,
    color: 'black', // matching your green accent
    marginLeft: 12,
    marginBottom: 8,
  },
  list: {
    paddingLeft: 12,
  },
  listContent: {
    paddingRight: 12,
  },
});
