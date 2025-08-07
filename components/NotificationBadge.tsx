/**
 * NotificationBadge - Componente para badges de notificação com real-time updates
 * Mostra contadores de mensagens não lidas, treinos pendentes, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Badge } from 'react-native-paper';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence,
  runOnJS
} from 'react-native-reanimated';

export interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  textColor?: string;
  showZero?: boolean;
  animate?: boolean;
  style?: any;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  offset?: { x: number; y: number };
}

const AnimatedBadge = Animated.createAnimatedComponent(Badge);

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  maxCount = 99,
  size = 'medium',
  color = '#FF4444',
  textColor = '#FFFFFF',
  showZero = false,
  animate = true,
  style,
  position = 'top-right',
  offset = { x: 0, y: 0 }
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(count > 0 ? 1 : 0);

  // Animação quando count muda
  React.useEffect(() => {
    if (!animate) return;

    if (count > 0) {
      // Aparecer com bounce
      opacity.value = withSpring(1, { damping: 10 });
      scale.value = withSequence(
        withSpring(1.3, { damping: 8 }),
        withSpring(1, { damping: 10 })
      );
    } else if (!showZero) {
      // Desaparecer suavemente
      opacity.value = withSpring(0, { damping: 15 });
      scale.value = withSpring(0.8, { damping: 15 });
    }
  }, [count, animate, showZero]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Não renderiza se count é 0 e showZero é false
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();
  
  const badgeSize = {
    small: 16,
    medium: 20,
    large: 24
  }[size];

  const fontSize = {
    small: 10,
    medium: 12,
    large: 14
  }[size];

  const positionStyle = getPositionStyle(position, offset, badgeSize);

  return (
    <AnimatedBadge
      size={badgeSize}
      style={[
        {
          backgroundColor: color,
          color: textColor,
          fontSize,
          fontWeight: 'bold',
          position: 'absolute',
          ...positionStyle
        },
        animatedStyle,
        style
      ]}
    >
      {displayCount}
    </AnimatedBadge>
  );
};

/**
 * Calcula estilo de posicionamento baseado na prop position
 */
function getPositionStyle(
  position: NotificationBadgeProps['position'], 
  offset: { x: number; y: number },
  size: number
) {
  const halfSize = size / 2;
  
  switch (position) {
    case 'top-right':
      return {
        top: offset.y - halfSize,
        right: offset.x - halfSize,
      };
    case 'top-left':
      return {
        top: offset.y - halfSize,
        left: offset.x - halfSize,
      };
    case 'bottom-right':
      return {
        bottom: offset.y - halfSize,
        right: offset.x - halfSize,
      };
    case 'bottom-left':
      return {
        bottom: offset.y - halfSize,
        left: offset.x - halfSize,
      };
    case 'center':
      return {
        top: '50%',
        left: '50%',
        marginTop: -halfSize + offset.y,
        marginLeft: -halfSize + offset.x,
      };
    default:
      return {
        top: offset.y - halfSize,
        right: offset.x - halfSize,
      };
  }
}

/**
 * Badge para ícones de tab navigation
 */
export const TabBadge: React.FC<{
  count: number;
  color?: string;
}> = ({ count, color = '#FF4444' }) => {
  if (count === 0) return null;

  return (
    <NotificationBadge
      count={count}
      size="small"
      color={color}
      position="top-right"
      offset={{ x: 12, y: -8 }}
      maxCount={99}
    />
  );
};

/**
 * Badge para avatares de usuário
 */
export const AvatarBadge: React.FC<{
  isOnline: boolean;
  size?: 'small' | 'medium' | 'large';
}> = ({ isOnline, size = 'medium' }) => {
  const badgeSize = {
    small: 12,
    medium: 16,
    large: 20
  }[size];

  if (!isOnline) return null;

  return (
    <View
      style={[
        styles.onlineBadge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: badgeSize / 2,
          borderWidth: size === 'small' ? 1 : 2
        }
      ]}
    />
  );
};

/**
 * Badge para status de mensagens
 */
export const MessageStatusBadge: React.FC<{
  status: 'sent' | 'delivered' | 'read';
  size?: number;
}> = ({ status, size = 16 }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return '#999999';
      case 'delivered':
        return '#4CAF50';
      case 'read':
        return '#2196F3';
      default:
        return '#999999';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '';
    }
  };

  return (
    <Text style={[
      styles.messageStatus,
      {
        color: getStatusColor(),
        fontSize: size * 0.7
      }
    ]}>
      {getStatusIcon()}
    </Text>
  );
};

const styles = StyleSheet.create({
  onlineBadge: {
    backgroundColor: '#4CAF50',
    borderColor: '#FFFFFF',
    position: 'absolute',
    bottom: 2,
    right: 2,
  },
  messageStatus: {
    fontWeight: 'bold',
    marginLeft: 4,
  }
});

export default NotificationBadge;