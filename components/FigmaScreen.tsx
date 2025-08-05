import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { FigmaTheme } from '../constants/figmaTheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FigmaScreenProps {
  children: React.ReactNode;
  style?: any;
  noShadow?: boolean;
}

// Container base convertido do Figma
export default function FigmaScreen({ children, style, noShadow = false }: FigmaScreenProps) {
  return (
    <View style={styles.container}>
      {!noShadow && <View style={styles.shadowContainer} />}
      <View style={[styles.content, style]}>
        <SafeAreaView style={styles.safeArea}>
          {children}
        </SafeAreaView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fundo preto para as bordas
  },
  shadowContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: FigmaTheme.colors.background,
    borderRadius: FigmaTheme.borderRadius.screen,
    ...FigmaTheme.shadows.large,
  },
  content: {
    flex: 1,
    backgroundColor: FigmaTheme.colors.background,
    borderRadius: FigmaTheme.borderRadius.screen,
    overflow: 'hidden',
    // Margem para mostrar as bordas arredondadas
    margin: Platform.select({
      ios: 0,
      android: 8,
    }),
  },
  safeArea: {
    flex: 1,
  },
});