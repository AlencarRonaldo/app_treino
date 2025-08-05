// Utilitário para importar e converter valores do Figma
import { DesignTokens } from '../constants/designTokens';

// Conversão de valores do Figma para React Native
export const figmaToRN = {
  // Converter px para number (React Native não usa 'px')
  size: (figmaPx: string): number => {
    return parseInt(figmaPx.replace('px', ''));
  },

  // Converter cores do Figma
  color: (figmaColor: string): string => {
    // Figma usa hex, RGB ou RGBA
    if (figmaColor.startsWith('rgba')) {
      return figmaColor;
    }
    return figmaColor.toUpperCase();
  },

  // Converter sombras do Figma para React Native
  shadow: (figmaShadow: {
    x: number;
    y: number;
    blur: number;
    spread: number;
    color: string;
    opacity: number;
  }) => ({
    shadowColor: figmaShadow.color,
    shadowOffset: {
      width: figmaShadow.x,
      height: figmaShadow.y,
    },
    shadowOpacity: figmaShadow.opacity,
    shadowRadius: figmaShadow.blur,
    elevation: Math.round(figmaShadow.y * 2), // Aproximação para Android
  }),

  // Converter tipografia do Figma
  typography: (figmaText: {
    fontFamily: string;
    fontSize: number;
    fontWeight: string;
    lineHeight: number;
    letterSpacing: number;
  }) => ({
    fontFamily: figmaText.fontFamily,
    fontSize: figmaText.fontSize,
    fontWeight: figmaText.fontWeight as any,
    lineHeight: figmaText.lineHeight,
    letterSpacing: figmaText.letterSpacing,
  }),

  // Converter border radius
  borderRadius: (figmaRadius: number | number[]): number => {
    if (Array.isArray(figmaRadius)) {
      // React Native não suporta border radius individual
      // Usar o menor valor para manter consistência
      return Math.min(...figmaRadius);
    }
    return figmaRadius;
  },

  // Converter espaçamento/padding
  spacing: (figmaSpacing: number | { top: number; right: number; bottom: number; left: number }) => {
    if (typeof figmaSpacing === 'number') {
      return figmaSpacing;
    }
    return {
      paddingTop: figmaSpacing.top,
      paddingRight: figmaSpacing.right,
      paddingBottom: figmaSpacing.bottom,
      paddingLeft: figmaSpacing.left,
    };
  },
};

// Exemplo de como usar com componentes do Figma
export const createComponentFromFigma = (figmaComponent: any) => {
  return {
    container: {
      backgroundColor: figmaToRN.color(figmaComponent.backgroundColor),
      borderRadius: figmaToRN.borderRadius(figmaComponent.borderRadius),
      ...figmaToRN.spacing(figmaComponent.padding),
      ...figmaToRN.shadow(figmaComponent.shadow),
    },
    text: {
      ...figmaToRN.typography(figmaComponent.typography),
      color: figmaToRN.color(figmaComponent.textColor),
    },
  };
};

// Validar se os valores do Figma correspondem aos Design Tokens
export const validateFigmaTokens = (figmaTokens: any) => {
  const warnings: string[] = [];

  // Verificar cores
  Object.entries(figmaTokens.colors || {}).forEach(([key, value]) => {
    if (!DesignTokens.colors[key as keyof typeof DesignTokens.colors]) {
      warnings.push(`Cor '${key}' do Figma não existe nos Design Tokens`);
    }
  });

  // Verificar espaçamentos
  Object.entries(figmaTokens.spacing || {}).forEach(([key, value]) => {
    if (!DesignTokens.spacing[key as keyof typeof DesignTokens.spacing]) {
      warnings.push(`Espaçamento '${key}' do Figma não existe nos Design Tokens`);
    }
  });

  return warnings;
};