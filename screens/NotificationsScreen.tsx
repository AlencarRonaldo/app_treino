import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FigmaScreen from '../components/FigmaScreen';

export default function NotificationsScreen() {
  return (
    <FigmaScreen>
      <View style={styles.container}>
        <Text style={styles.title}>Notificações</Text>
        <Text style={styles.subtitle}>Tela de notificações</Text>
      </View>
    </FigmaScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#B3B3B3',
  },
}); 