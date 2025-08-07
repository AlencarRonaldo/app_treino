/**
 * useTypingIndicator - Hook para gerenciar typing indicators em tempo real
 * Usa broadcast messages para sincronizar status de digitação
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useBroadcast } from './useRealtimeSubscription';
import { useAuth } from '../contexts/AuthContext';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface TypingIndicatorData {
  userId: string;
  userName: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: number;
}

export function useTypingIndicator(conversationId: string) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const lastTypingTimeRef = useRef<number>(0);

  // Setup broadcast subscription para typing indicators
  const { broadcast } = useBroadcast<TypingIndicatorData>(
    `typing_${conversationId}`,
    {
      channel: `typing_${conversationId}`,
      event: 'typing_status',
      onMessage: (payload) => {
        if (!user || payload.userId === user.id) return; // Ignora próprias mensagens
        
        handleTypingUpdate(payload);
      }
    }
  );

  /**
   * Processa updates de typing status de outros usuários
   */
  const handleTypingUpdate = useCallback((payload: TypingIndicatorData) => {
    setTypingUsers(current => {
      const filtered = current.filter(u => u.userId !== payload.userId);
      
      if (payload.isTyping) {
        // Adiciona usuário que está digitando
        return [
          ...filtered,
          {
            userId: payload.userId,
            userName: payload.userName,
            timestamp: payload.timestamp
          }
        ];
      } else {
        // Remove usuário que parou de digitar
        return filtered;
      }
    });
  }, []);

  /**
   * Inicia indicação de que está digitando
   */
  const startTyping = useCallback(async () => {
    if (!user || isTyping) return;

    const now = Date.now();
    
    // Throttle: só envia se passou pelo menos 2 segundos da última vez
    if (now - lastTypingTimeRef.current < 2000) return;

    try {
      await broadcast({
        userId: user.id,
        userName: user.name || 'Usuário',
        conversationId,
        isTyping: true,
        timestamp: now
      });

      setIsTyping(true);
      lastTypingTimeRef.current = now;

      // Auto-stop depois de 5 segundos
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 5000);
    } catch (error) {
      console.warn('Erro ao enviar typing indicator:', error);
    }
  }, [user, conversationId, isTyping, broadcast]);

  /**
   * Para indicação de que está digitando
   */
  const stopTyping = useCallback(async () => {
    if (!user || !isTyping) return;

    try {
      await broadcast({
        userId: user.id,
        userName: user.name || 'Usuário',
        conversationId,
        isTyping: false,
        timestamp: Date.now()
      });

      setIsTyping(false);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = undefined;
      }
    } catch (error) {
      console.warn('Erro ao parar typing indicator:', error);
    }
  }, [user, conversationId, isTyping, broadcast]);

  /**
   * Debounced start typing - chama startTyping mas reseta o timer
   */
  const onTyping = useCallback(() => {
    startTyping();
    
    // Reset auto-stop timer
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 5000);
  }, [startTyping, stopTyping]);

  // Cleanup typing users que estão parados há muito tempo (30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(current => 
        current.filter(user => now - user.timestamp < 30000)
      );
    }, 10000); // Check a cada 10 segundos

    return () => clearInterval(interval);
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Para de indicar typing ao desmontar
      if (isTyping && user) {
        broadcast({
          userId: user.id,
          userName: user.name || 'Usuário',
          conversationId,
          isTyping: false,
          timestamp: Date.now()
        }).catch(() => {});
      }
    };
  }, []);

  return {
    typingUsers,
    isTyping,
    startTyping: onTyping,
    stopTyping,
    hasTypingUsers: typingUsers.length > 0,
    typingUserNames: typingUsers.map(u => u.userName)
  };
}

/**
 * Hook simplificado para mostrar typing indicator de forma mais user-friendly
 */
export function useTypingDisplay(conversationId: string) {
  const { typingUsers, hasTypingUsers, typingUserNames } = useTypingIndicator(conversationId);

  const getTypingText = useCallback(() => {
    if (!hasTypingUsers) return '';

    const count = typingUsers.length;
    if (count === 1) {
      return `${typingUserNames[0]} está digitando...`;
    } else if (count === 2) {
      return `${typingUserNames[0]} e ${typingUserNames[1]} estão digitando...`;
    } else {
      return `${typingUserNames[0]} e mais ${count - 1} pessoas estão digitando...`;
    }
  }, [hasTypingUsers, typingUsers.length, typingUserNames]);

  return {
    hasTypingUsers,
    typingText: getTypingText(),
    typingCount: typingUsers.length
  };
}