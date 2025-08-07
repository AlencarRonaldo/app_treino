/**
 * OptimizedRealtimeChat - Chat otimizado para tempo real durante treinos
 * Inclui message batching, typing indicators e virtualization
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  InteractionManager,
  Keyboard
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { 
  useOptimizedChat,
  useOptimizedResponsive 
} from '../hooks/useOptimizedResponsive';
import { 
  performanceMonitor, 
  batchProcessor,
  runAfterInteractions,
  optimizeListRendering,
  PERFORMANCE_CONFIG
} from '../utils/PerformanceOptimizer';
import { FigmaTheme } from '../constants/figmaTheme';

interface ChatMessage {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: Date;
  isCurrentUser: boolean;
  type?: 'text' | 'system' | 'workout_update';
}

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: Date;
}

interface OptimizedRealtimeChatProps {
  messages: ChatMessage[];
  currentUserId: string;
  onSendMessage: (text: string) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  typingUsers?: TypingUser[];
  loading?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

// ===== COMPONENTE DE MENSAGEM MEMOIZADO =====
interface MessageBubbleProps {
  message: ChatMessage;
  isLast: boolean;
  isFirst: boolean;
}

const MessageBubble = React.memo<MessageBubbleProps>(({ message, isLast, isFirst }) => {
  const { getValue, createStyles } = useOptimizedResponsive();
  
  const styles = createStyles(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: getValue(16, 18, 20, 24),
      paddingVertical: getValue(2, 3, 4, 6),
      justifyContent: message.isCurrentUser ? 'flex-end' : 'flex-start',
    },
    bubble: {
      maxWidth: '75%',
      paddingHorizontal: getValue(12, 14, 16, 20),
      paddingVertical: getValue(8, 10, 12, 16),
      borderRadius: getValue(16, 18, 20, 24),
      backgroundColor: message.isCurrentUser ? '#FF6B35' : '#2C2C2E',
      marginBottom: isLast ? getValue(4, 6, 8, 10) : getValue(1, 2, 3, 4),
    },
    systemBubble: {
      backgroundColor: 'rgba(142, 142, 147, 0.2)',
      alignSelf: 'center',
      maxWidth: '90%',
    },
    text: {
      fontSize: getValue(15, 16, 17, 18),
      lineHeight: getValue(20, 22, 24, 26),
      color: message.isCurrentUser ? '#FFFFFF' : FigmaTheme.colors.textPrimary,
    },
    systemText: {
      color: FigmaTheme.colors.textSecondary,
      textAlign: 'center',
      fontSize: getValue(13, 14, 15, 16),
    },
    timestamp: {
      fontSize: getValue(11, 12, 13, 14),
      color: message.isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : FigmaTheme.colors.textSecondary,
      marginTop: getValue(2, 3, 4, 5),
      textAlign: message.isCurrentUser ? 'right' : 'left',
    },
    userName: {
      fontSize: getValue(12, 13, 14, 15),
      fontWeight: '600',
      color: FigmaTheme.colors.textSecondary,
      marginBottom: getValue(2, 3, 4, 5),
    }
  }));
  
  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }, []);
  
  if (message.type === 'system') {
    return (
      <View style={styles.container}>
        <View style={[styles.bubble, styles.systemBubble]}>
          <Text style={styles.systemText}>{message.text}</Text>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        {!message.isCurrentUser && isFirst && (
          <Text style={styles.userName}>{message.userName}</Text>
        )}
        <Text style={styles.text}>{message.text}</Text>
        <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
      </View>
    </View>
  );
});

MessageBubble.displayName = 'MessageBubble';

// ===== INDICADOR DE DIGITAÇÃO =====
const TypingIndicator = React.memo<{ users: TypingUser[] }>(({ users }) => {
  const { getValue, createStyles } = useOptimizedResponsive();
  const [dots, setDots] = useState('');
  
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '•');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  const styles = createStyles(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      paddingHorizontal: getValue(16, 18, 20, 24),
      paddingVertical: getValue(8, 10, 12, 16),
      alignItems: 'center',
    },
    bubble: {
      backgroundColor: '#2C2C2E',
      borderRadius: getValue(16, 18, 20, 24),
      paddingHorizontal: getValue(12, 14, 16, 20),
      paddingVertical: getValue(8, 10, 12, 16),
      minWidth: getValue(60, 70, 80, 90),
    },
    text: {
      color: FigmaTheme.colors.textSecondary,
      fontSize: getValue(14, 15, 16, 17),
    },
    dots: {
      color: '#FF6B35',
      fontSize: getValue(16, 18, 20, 22),
      fontWeight: 'bold',
      minWidth: getValue(20, 24, 28, 32),
    }
  }));
  
  if (users.length === 0) return null;
  
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <Text style={styles.text}>
          {users.length === 1 ? users[0].userName : `${users.length} pessoas`} digitando
          <Text style={styles.dots}>{dots}</Text>
        </Text>
      </View>
    </View>
  );
});

TypingIndicator.displayName = 'TypingIndicator';

// ===== COMPONENTE PRINCIPAL =====
export const OptimizedRealtimeChat: React.FC<OptimizedRealtimeChatProps> = React.memo(({
  messages,
  currentUserId,
  onSendMessage,
  onTypingStart,
  onTypingEnd,
  typingUsers = [],
  loading = false,
  disabled = false,
  placeholder = "Digite uma mensagem..."
}) => {
  const { createStyles } = useOptimizedResponsive();
  const chatConfig = useOptimizedChat(messages.length);
  
  // ===== STATE MANAGEMENT =====
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // ===== REFS PARA PERFORMANCE =====
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<TextInput>(null);
  const lastMessageCountRef = useRef(messages.length);
  
  // ===== PROCESSAMENTO DE MENSAGENS OTIMIZADO =====
  const processedMessages = useMemo(() => {
    return performanceMonitor.measure('chat_message_processing', () => {
      // Agrupar mensagens por usuário e timestamps próximos
      const grouped: (ChatMessage & { isFirst: boolean; isLast: boolean })[] = [];
      
      messages.forEach((message, index) => {
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];
        
        const isFirst = !prevMessage || 
          prevMessage.userId !== message.userId ||
          new Date(message.timestamp).getTime() - new Date(prevMessage.timestamp).getTime() > 300000; // 5 min
        
        const isLast = !nextMessage ||
          nextMessage.userId !== message.userId ||
          new Date(nextMessage.timestamp).getTime() - new Date(message.timestamp).getTime() > 300000;
        
        grouped.push({
          ...message,
          isFirst,
          isLast
        });
      });
      
      return grouped.reverse(); // Mais recentes primeiro para FlatList inverted
    });
  }, [messages]);
  
  // ===== KEYBOARD HANDLING =====
  useEffect(() => {
    const showListener = Keyboard.addListener('keyboardDidShow', (e) => {
      performanceMonitor.measure('keyboard_show', () => {
        setKeyboardHeight(e.endCoordinates.height);
      });
    });
    
    const hideListener = Keyboard.addListener('keyboardDidHide', () => {
      performanceMonitor.measure('keyboard_hide', () => {
        setKeyboardHeight(0);
      });
    });
    
    return () => {
      showListener.remove();
      hideListener.remove();
    };
  }, []);
  
  // ===== AUTO SCROLL PARA NOVAS MENSAGENS =====
  useEffect(() => {
    const newMessageCount = messages.length;
    const hasNewMessages = newMessageCount > lastMessageCountRef.current;
    
    if (hasNewMessages && flatListRef.current) {
      // Usar InteractionManager para não interferir com animações
      runAfterInteractions(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
    
    lastMessageCountRef.current = newMessageCount;
  }, [messages.length]);
  
  // ===== HANDLERS OTIMIZADOS =====
  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    
    // Batching para typing indicators
    batchProcessor.add('typing_indicator', () => {
      const wasTyping = isTyping;
      const nowTyping = text.length > 0;
      
      if (!wasTyping && nowTyping) {
        setIsTyping(true);
        onTypingStart?.();
      }
      
      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        onTypingEnd?.();
      }, chatConfig.typingDebounce);
    }, 100);
  }, [isTyping, onTypingStart, onTypingEnd, chatConfig.typingDebounce]);
  
  const handleSend = useCallback(() => {
    const trimmedText = inputText.trim();
    if (!trimmedText || disabled) return;
    
    performanceMonitor.measure('send_message', () => {
      onSendMessage(trimmedText);
      setInputText('');
      
      // Clear typing state
      setIsTyping(false);
      onTypingEnd?.();
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Focus back to input after send
      InteractionManager.runAfterInteractions(() => {
        inputRef.current?.focus();
      });
    });
  }, [inputText, disabled, onSendMessage, onTypingEnd]);
  
  const renderMessage = useCallback(({ item }: { item: typeof processedMessages[0] }) => {
    return (
      <MessageBubble
        message={item}
        isFirst={item.isFirst}
        isLast={item.isLast}
      />
    );
  }, []);
  
  // ===== ESTILOS MEMOIZADOS =====
  const styles = createStyles(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: FigmaTheme.colors.background,
    },
    messagesContainer: {
      flex: 1,
      paddingBottom: keyboardHeight > 0 ? 10 : 0,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: chatConfig.inputHeight / 4,
      paddingVertical: chatConfig.inputHeight / 4,
      backgroundColor: FigmaTheme.colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    textInput: {
      flex: 1,
      backgroundColor: '#2C2C2E',
      borderRadius: chatConfig.inputHeight / 2,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: chatConfig.inputMaxHeight,
      fontSize: 16,
      color: FigmaTheme.colors.textPrimary,
      textAlignVertical: 'center',
    },
    sendButton: {
      width: chatConfig.inputHeight,
      height: chatConfig.inputHeight,
      backgroundColor: '#FF6B35',
      borderRadius: chatConfig.inputHeight / 2,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      opacity: inputText.trim() ? 1 : 0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    }
  }));
  
  // ===== LOADING STATE =====
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={FigmaTheme.colors.primary} />
        <Text style={{ color: FigmaTheme.colors.textSecondary, marginTop: 16 }}>
          Carregando mensagens...
        </Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {/* Messages List */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={processedMessages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          showsVerticalScrollIndicator={false}
          
          // Otimizações de performance
          windowSize={chatConfig.windowSize}
          maxToRenderPerBatch={chatConfig.updateBatchSize}
          updateCellsBatchingPeriod={chatConfig.updateInterval}
          removeClippedSubviews={chatConfig.useVirtualization}
          initialNumToRender={Math.min(20, processedMessages.length)}
          
          // Layout otimizado
          getItemLayout={
            chatConfig.useVirtualization 
              ? (data, index) => ({
                  length: chatConfig.messageHeight,
                  offset: chatConfig.messageHeight * index,
                  index,
                })
              : undefined
          }
          
          ListHeaderComponent={
            typingUsers.length > 0 ? (
              <TypingIndicator users={typingUsers} />
            ) : null
          }
        />
      </View>
      
      {/* Input Container */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          value={inputText}
          onChangeText={handleInputChange}
          placeholder={placeholder}
          placeholderTextColor={FigmaTheme.colors.textSecondary}
          multiline
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!disabled}
        />
        
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!inputText.trim() || disabled}
          activeOpacity={0.7}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
});

OptimizedRealtimeChat.displayName = 'OptimizedRealtimeChat';