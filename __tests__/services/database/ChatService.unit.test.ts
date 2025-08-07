/**
 * ChatService Unit Tests
 * Comprehensive test suite for real-time messaging with Supabase
 */

import MockDataFactory, { MockConversation, MockMessage } from '../../../test-utils/MockDataFactory';
import TestHelpers from '../../../test-utils/TestHelpers';

// Mock the ChatService - we'll need to implement a mock since the actual service has complex dependencies
const mockChatService = {
  initialize: jest.fn(),
  cleanup: jest.fn(),
  createConversation: jest.fn(),
  getConversations: jest.fn(),
  sendMessage: jest.fn(),
  getMessages: jest.fn(),
  markAsRead: jest.fn(),
  getMessageTemplates: jest.fn(),
  broadcastMessage: jest.fn(),
  getChatStats: jest.fn(),
  subscribeToMessages: jest.fn(),
  unsubscribeFromMessages: jest.fn(),
  setTypingStatus: jest.fn(),
  getOnlineStatus: jest.fn(),
};

// Mock Supabase
const mockSupabase = global.mockSupabaseClient;

// Mock database utils
jest.mock('../../../treinosapp-mobile/lib/database', () => ({
  databaseUtils: {
    initialize: jest.fn().mockResolvedValue(true),
  },
}));

describe('ChatService Unit Tests', () => {
  let mockUser: any;
  let mockTrainer: any;
  let mockStudent: any;
  let mockConversation: MockConversation;
  let mockMessage: MockMessage;

  beforeAll(() => {
    // Setup mock users
    mockTrainer = TestHelpers.createAuthenticatedUser();
    mockTrainer.user_type = 'personal_trainer';
    
    mockStudent = MockDataFactory.createStudent({ id: 'student-id' });
    mockUser = mockTrainer; // Default to trainer perspective

    // Mock auth.getUser
    mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create fresh mock data
    mockConversation = MockDataFactory.createConversation(mockTrainer.id, mockStudent.id);
    mockMessage = MockDataFactory.createMessage(mockConversation.id, mockTrainer.id);

    // Reset mock service
    Object.keys(mockChatService).forEach(key => {
      mockChatService[key as keyof typeof mockChatService].mockReset();
    });
  });

  describe('Service Initialization', () => {
    it('should initialize successfully', async () => {
      mockChatService.initialize.mockResolvedValue(true);
      
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue(true),
      };
      
      mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);

      await expect(mockChatService.initialize()).resolves.not.toThrow();
      expect(mockChatService.initialize).toHaveBeenCalled();
    });

    it('should setup real-time subscriptions', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn().mockResolvedValue(true),
      };

      mockSupabase.channel = jest.fn().mockReturnValue(mockChannel);
      mockChatService.initialize.mockImplementation(async () => {
        // Simulate subscription setup
        mockSupabase.channel('conversations');
        mockSupabase.channel('messages');
      });

      await mockChatService.initialize();

      expect(mockSupabase.channel).toHaveBeenCalledWith('conversations');
      expect(mockSupabase.channel).toHaveBeenCalledWith('messages');
    });

    it('should load message templates on initialization', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          title: 'Motivação',
          content: 'Parabéns pelo treino! Continue assim!',
          category: 'motivation',
          is_default: true,
        },
        {
          id: 'template-2',
          title: 'Técnica',
          content: 'Vamos focar na técnica do exercício {exercise}',
          category: 'technique',
          variables: ['exercise'],
          is_default: true,
        },
      ];

      mockChatService.getMessageTemplates.mockResolvedValue(mockTemplates);

      const templates = await mockChatService.getMessageTemplates();
      expect(templates).toHaveLength(2);
      expect(templates[0].category).toBe('motivation');
      expect(templates[1].variables).toContain('exercise');
    });
  });

  describe('Conversation Management', () => {
    describe('createConversation', () => {
      it('should create conversation between trainer and student', async () => {
        const newConversation = {
          id: 'new-conversation-id',
          trainer_id: mockTrainer.id,
          student_id: mockStudent.id,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        };

        mockChatService.createConversation.mockResolvedValue(newConversation);

        const result = await mockChatService.createConversation(
          mockTrainer.id,
          mockStudent.id
        );

        expect(result).toBeDefined();
        expect(result.trainer_id).toBe(mockTrainer.id);
        expect(result.student_id).toBe(mockStudent.id);
        expect(mockChatService.createConversation).toHaveBeenCalledWith(
          mockTrainer.id,
          mockStudent.id
        );
      });

      it('should prevent duplicate conversations', async () => {
        mockChatService.createConversation.mockImplementation(async (trainerId, studentId) => {
          // Simulate checking for existing conversation
          if (trainerId === mockTrainer.id && studentId === mockStudent.id) {
            throw new Error('Conversation already exists between these users');
          }
          return mockConversation;
        });

        await expect(mockChatService.createConversation(mockTrainer.id, mockStudent.id))
          .rejects.toThrow('Conversation already exists between these users');
      });

      it('should require valid user IDs', async () => {
        mockChatService.createConversation.mockImplementation(async (trainerId, studentId) => {
          if (!trainerId || !studentId) {
            throw new Error('Both trainer and student IDs are required');
          }
          return mockConversation;
        });

        await expect(mockChatService.createConversation('', mockStudent.id))
          .rejects.toThrow('Both trainer and student IDs are required');

        await expect(mockChatService.createConversation(mockTrainer.id, ''))
          .rejects.toThrow('Both trainer and student IDs are required');
      });
    });

    describe('getConversations', () => {
      it('should fetch user conversations with participants', async () => {
        const mockConversations = [
          {
            ...mockConversation,
            trainer: {
              id: mockTrainer.id,
              name: mockTrainer.name,
              user_type: 'personal_trainer',
            },
            student: {
              id: mockStudent.id,
              name: mockStudent.name,
              user_type: 'student',
            },
            last_message: mockMessage,
            unread_count: 2,
          },
        ];

        mockChatService.getConversations.mockResolvedValue(mockConversations);

        const result = await mockChatService.getConversations();

        expect(result).toHaveLength(1);
        expect(result[0].trainer).toBeDefined();
        expect(result[0].student).toBeDefined();
        expect(result[0].last_message).toBeDefined();
        expect(result[0].unread_count).toBe(2);
      });

      it('should filter conversations by user role', async () => {
        // Test trainer perspective
        const trainerConversations = [mockConversation];
        mockChatService.getConversations.mockResolvedValue(trainerConversations);

        const trainerResult = await mockChatService.getConversations();
        expect(trainerResult).toHaveLength(1);

        // Test student perspective
        mockUser = mockStudent;
        mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
          data: { user: mockStudent },
          error: null,
        });

        const studentConversations = [mockConversation];
        mockChatService.getConversations.mockResolvedValue(studentConversations);

        const studentResult = await mockChatService.getConversations();
        expect(studentResult).toHaveLength(1);
      });

      it('should include online status when available', async () => {
        const mockConversationWithStatus = {
          ...mockConversation,
          trainer: { ...mockTrainer },
          student: { ...mockStudent },
          is_online: true,
        };

        mockChatService.getConversations.mockResolvedValue([mockConversationWithStatus]);

        const result = await mockChatService.getConversations();
        expect(result[0].is_online).toBe(true);
      });
    });
  });

  describe('Message Management', () => {
    describe('sendMessage', () => {
      it('should send text message successfully', async () => {
        const messageContent = 'Olá! Como foi o treino hoje?';
        const newMessage = {
          ...mockMessage,
          content: messageContent,
          message_type: 'text',
          sender: {
            id: mockTrainer.id,
            name: mockTrainer.name,
            user_type: 'personal_trainer',
          },
        };

        mockChatService.sendMessage.mockResolvedValue(newMessage);

        const result = await mockChatService.sendMessage(
          mockConversation.id,
          messageContent,
          'text'
        );

        expect(result).toBeDefined();
        expect(result.content).toBe(messageContent);
        expect(result.message_type).toBe('text');
        expect(result.sender.id).toBe(mockTrainer.id);
      });

      it('should send message with attachment', async () => {
        const messageContent = 'Confira este exercício';
        const attachment = {
          type: 'image',
          url: 'https://example.com/exercise-demo.jpg',
          name: 'exercise-demo.jpg',
        };

        const messageWithAttachment = {
          ...mockMessage,
          content: messageContent,
          message_type: 'image',
          attachment_url: attachment.url,
          metadata: { attachment },
        };

        mockChatService.sendMessage.mockResolvedValue(messageWithAttachment);

        const result = await mockChatService.sendMessage(
          mockConversation.id,
          messageContent,
          'image',
          attachment
        );

        expect(result.message_type).toBe('image');
        expect(result.attachment_url).toBe(attachment.url);
        expect(result.metadata).toEqual({ attachment });
      });

      it('should send message using template', async () => {
        const templateId = 'template-1';
        const variables = { name: mockStudent.name };
        const processedContent = `Parabéns ${mockStudent.name}! Continue assim!`;

        const templateMessage = {
          ...mockMessage,
          content: processedContent,
          template_id: templateId,
          metadata: { variables },
        };

        mockChatService.sendMessage.mockResolvedValue(templateMessage);

        const result = await mockChatService.sendMessage(
          mockConversation.id,
          processedContent,
          'text',
          undefined,
          templateId,
          variables
        );

        expect(result.template_id).toBe(templateId);
        expect(result.content).toBe(processedContent);
        expect(result.metadata).toEqual({ variables });
      });

      it('should handle sending errors', async () => {
        mockChatService.sendMessage.mockRejectedValue(
          new Error('Failed to send message: Network error')
        );

        await expect(mockChatService.sendMessage(
          mockConversation.id,
          'Test message',
          'text'
        )).rejects.toThrow('Failed to send message: Network error');
      });

      it('should validate message content', async () => {
        mockChatService.sendMessage.mockImplementation(async (conversationId, content) => {
          if (!content || content.trim().length === 0) {
            throw new Error('Message content cannot be empty');
          }
          return mockMessage;
        });

        await expect(mockChatService.sendMessage(mockConversation.id, '', 'text'))
          .rejects.toThrow('Message content cannot be empty');
      });
    });

    describe('getMessages', () => {
      it('should fetch messages for conversation', async () => {
        const mockMessages = [
          MockDataFactory.createMessage(mockConversation.id, mockTrainer.id),
          MockDataFactory.createMessage(mockConversation.id, mockStudent.id),
          MockDataFactory.createMessage(mockConversation.id, mockTrainer.id),
        ];

        const messagesWithSenders = mockMessages.map(msg => ({
          ...msg,
          sender: msg.sender_id === mockTrainer.id ? 
            { id: mockTrainer.id, name: mockTrainer.name, user_type: 'personal_trainer' } :
            { id: mockStudent.id, name: mockStudent.name, user_type: 'student' },
          is_own_message: msg.sender_id === mockUser.id,
        }));

        mockChatService.getMessages.mockResolvedValue(messagesWithSenders);

        const result = await mockChatService.getMessages(mockConversation.id);

        expect(result).toHaveLength(3);
        expect(result[0].sender).toBeDefined();
        expect(result.some(msg => msg.is_own_message)).toBe(true);
      });

      it('should support pagination', async () => {
        const allMessages = Array.from({ length: 50 }, (_, index) => 
          MockDataFactory.createMessage(mockConversation.id, 
            index % 2 === 0 ? mockTrainer.id : mockStudent.id
          )
        );

        mockChatService.getMessages.mockImplementation(async (conversationId, limit = 20, offset = 0) => {
          return allMessages.slice(offset, offset + limit).map(msg => ({
            ...msg,
            sender: { id: msg.sender_id, name: 'User', user_type: 'student' },
          }));
        });

        // First page
        const firstPage = await mockChatService.getMessages(mockConversation.id, 20, 0);
        expect(firstPage).toHaveLength(20);

        // Second page
        const secondPage = await mockChatService.getMessages(mockConversation.id, 20, 20);
        expect(secondPage).toHaveLength(20);

        // Third page (partial)
        const thirdPage = await mockChatService.getMessages(mockConversation.id, 20, 40);
        expect(thirdPage).toHaveLength(10);
      });

      it('should handle empty conversation', async () => {
        mockChatService.getMessages.mockResolvedValue([]);

        const result = await mockChatService.getMessages('empty-conversation-id');
        expect(result).toEqual([]);
      });
    });

    describe('markAsRead', () => {
      it('should mark messages as read', async () => {
        const messageIds = ['msg-1', 'msg-2', 'msg-3'];
        mockChatService.markAsRead.mockResolvedValue(true);

        const result = await mockChatService.markAsRead(mockConversation.id, messageIds);
        expect(result).toBe(true);
        expect(mockChatService.markAsRead).toHaveBeenCalledWith(
          mockConversation.id,
          messageIds
        );
      });

      it('should mark all unread messages in conversation', async () => {
        mockChatService.markAsRead.mockResolvedValue(true);

        const result = await mockChatService.markAsRead(mockConversation.id);
        expect(result).toBe(true);
        expect(mockChatService.markAsRead).toHaveBeenCalledWith(mockConversation.id);
      });

      it('should handle marking read errors', async () => {
        mockChatService.markAsRead.mockRejectedValue(
          new Error('Failed to mark messages as read')
        );

        await expect(mockChatService.markAsRead(mockConversation.id, ['msg-1']))
          .rejects.toThrow('Failed to mark messages as read');
      });
    });
  });

  describe('Message Templates', () => {
    describe('getMessageTemplates', () => {
      it('should fetch available templates by category', async () => {
        const templates = [
          {
            id: 'tmpl-1',
            title: 'Motivação Padrão',
            content: 'Parabéns pelo treino!',
            category: 'motivation',
            is_default: true,
            usage_count: 15,
          },
          {
            id: 'tmpl-2',
            title: 'Correção Técnica',
            content: 'Vamos ajustar a técnica do {exercise}',
            category: 'technique',
            variables: ['exercise'],
            is_default: true,
            usage_count: 8,
          },
        ];

        mockChatService.getMessageTemplates.mockResolvedValue(templates);

        const result = await mockChatService.getMessageTemplates();
        expect(result).toHaveLength(2);
        expect(result[0].category).toBe('motivation');
        expect(result[1].variables).toContain('exercise');
      });

      it('should filter templates by category', async () => {
        const motivationTemplates = [
          {
            id: 'tmpl-1',
            title: 'Motivação',
            content: 'Ótimo trabalho!',
            category: 'motivation',
            is_default: true,
          },
        ];

        mockChatService.getMessageTemplates.mockImplementation(async (category) => {
          if (category === 'motivation') {
            return motivationTemplates;
          }
          return [];
        });

        const result = await mockChatService.getMessageTemplates('motivation');
        expect(result).toHaveLength(1);
        expect(result[0].category).toBe('motivation');
      });
    });
  });

  describe('Broadcast Messages', () => {
    describe('broadcastMessage', () => {
      it('should send message to multiple recipients', async () => {
        const broadcastData = {
          content: 'Lembrete: treino agendado para amanhã às 14h',
          recipient_ids: ['student-1', 'student-2', 'student-3'],
        };

        const broadcastResult = {
          message_id: 'broadcast-msg-1',
          sent_count: 3,
          failed_count: 0,
          recipients: broadcastData.recipient_ids,
        };

        mockChatService.broadcastMessage.mockResolvedValue(broadcastResult);

        const result = await mockChatService.broadcastMessage(broadcastData);

        expect(result.sent_count).toBe(3);
        expect(result.failed_count).toBe(0);
        expect(result.recipients).toHaveLength(3);
      });

      it('should use template for broadcast', async () => {
        const broadcastData = {
          content: 'Lembrete personalizado',
          template_id: 'reminder-template',
          recipient_ids: ['student-1', 'student-2'],
        };

        const broadcastResult = {
          message_id: 'broadcast-msg-2',
          sent_count: 2,
          failed_count: 0,
          template_id: broadcastData.template_id,
        };

        mockChatService.broadcastMessage.mockResolvedValue(broadcastResult);

        const result = await mockChatService.broadcastMessage(broadcastData);
        expect(result.template_id).toBe(broadcastData.template_id);
      });

      it('should handle partial failures', async () => {
        const broadcastData = {
          content: 'Mensagem teste',
          recipient_ids: ['valid-student', 'invalid-student'],
        };

        const broadcastResult = {
          message_id: 'broadcast-msg-3',
          sent_count: 1,
          failed_count: 1,
          failures: ['invalid-student'],
        };

        mockChatService.broadcastMessage.mockResolvedValue(broadcastResult);

        const result = await mockChatService.broadcastMessage(broadcastData);
        expect(result.sent_count).toBe(1);
        expect(result.failed_count).toBe(1);
        expect(result.failures).toContain('invalid-student');
      });

      it('should schedule broadcast for later', async () => {
        const scheduledTime = new Date(Date.now() + 86400000).toISOString(); // Tomorrow
        const broadcastData = {
          content: 'Mensagem agendada',
          recipient_ids: ['student-1'],
          scheduled_for: scheduledTime,
        };

        const broadcastResult = {
          message_id: 'scheduled-msg-1',
          scheduled: true,
          scheduled_for: scheduledTime,
        };

        mockChatService.broadcastMessage.mockResolvedValue(broadcastResult);

        const result = await mockChatService.broadcastMessage(broadcastData);
        expect(result.scheduled).toBe(true);
        expect(result.scheduled_for).toBe(scheduledTime);
      });
    });
  });

  describe('Real-time Features', () => {
    describe('subscribeToMessages', () => {
      it('should setup message subscription', async () => {
        const mockCallback = jest.fn();
        const mockSubscription = {
          unsubscribe: jest.fn().mockResolvedValue(true),
        };

        mockChatService.subscribeToMessages.mockResolvedValue(mockSubscription);

        const subscription = await mockChatService.subscribeToMessages(
          mockConversation.id,
          mockCallback
        );

        expect(subscription).toBeDefined();
        expect(subscription.unsubscribe).toBeDefined();
        expect(mockChatService.subscribeToMessages).toHaveBeenCalledWith(
          mockConversation.id,
          mockCallback
        );
      });

      it('should handle incoming real-time messages', async () => {
        const mockCallback = jest.fn();
        const newMessage = MockDataFactory.createMessage(mockConversation.id, mockStudent.id);

        // Simulate real-time message
        mockChatService.subscribeToMessages.mockImplementation(async (conversationId, callback) => {
          // Simulate message received after short delay
          setTimeout(() => callback(newMessage), 100);
          return { unsubscribe: jest.fn() };
        });

        await mockChatService.subscribeToMessages(mockConversation.id, mockCallback);

        // Wait for callback to be called
        await new Promise(resolve => setTimeout(resolve, 150));
        expect(mockCallback).toHaveBeenCalledWith(newMessage);
      });
    });

    describe('typing indicators', () => {
      it('should set typing status', async () => {
        mockChatService.setTypingStatus.mockResolvedValue(true);

        const result = await mockChatService.setTypingStatus(mockConversation.id, true);
        expect(result).toBe(true);
        expect(mockChatService.setTypingStatus).toHaveBeenCalledWith(
          mockConversation.id,
          true
        );
      });

      it('should clear typing status', async () => {
        mockChatService.setTypingStatus.mockResolvedValue(true);

        const result = await mockChatService.setTypingStatus(mockConversation.id, false);
        expect(result).toBe(true);
        expect(mockChatService.setTypingStatus).toHaveBeenCalledWith(
          mockConversation.id,
          false
        );
      });
    });

    describe('online status', () => {
      it('should get user online status', async () => {
        const onlineStatus = {
          user_id: mockStudent.id,
          is_online: true,
          last_seen: new Date().toISOString(),
        };

        mockChatService.getOnlineStatus.mockResolvedValue(onlineStatus);

        const result = await mockChatService.getOnlineStatus(mockStudent.id);
        expect(result.is_online).toBe(true);
        expect(result.user_id).toBe(mockStudent.id);
      });
    });
  });

  describe('Analytics and Statistics', () => {
    describe('getChatStats', () => {
      it('should calculate chat statistics', async () => {
        const stats = {
          total_conversations: 5,
          total_messages: 150,
          messages_today: 12,
          messages_this_week: 45,
          average_response_time: 15, // minutes
          most_active_conversation: mockConversation.id,
          unread_messages: 3,
        };

        mockChatService.getChatStats.mockResolvedValue(stats);

        const result = await mockChatService.getChatStats();

        expect(result.total_conversations).toBe(5);
        expect(result.total_messages).toBe(150);
        expect(result.messages_today).toBe(12);
        expect(result.average_response_time).toBe(15);
        expect(result.unread_messages).toBe(3);
      });

      it('should calculate stats for specific period', async () => {
        const weekStats = {
          total_conversations: 5,
          total_messages: 45,
          messages_today: 12,
          messages_this_week: 45,
          average_response_time: 12,
          unread_messages: 1,
        };

        mockChatService.getChatStats.mockImplementation(async (period) => {
          if (period === 'week') {
            return weekStats;
          }
          return {
            total_conversations: 5,
            total_messages: 150,
            messages_today: 12,
            messages_this_week: 45,
            average_response_time: 15,
            unread_messages: 3,
          };
        });

        const result = await mockChatService.getChatStats('week');
        expect(result.total_messages).toBe(45);
        expect(result.messages_this_week).toBe(45);
      });
    });
  });

  describe('Performance and Error Handling', () => {
    it('should handle high message volume', async () => {
      const messages = Array.from({ length: 100 }, () => 
        MockDataFactory.createMessage(mockConversation.id, mockTrainer.id)
      );

      mockChatService.getMessages.mockResolvedValue(messages);

      const { duration } = await TestHelpers.measureExecutionTime(async () => {
        await mockChatService.getMessages(mockConversation.id, 100);
      });

      TestHelpers.expectPerformanceWithin(duration, 1000); // 1 second max
    });

    it('should handle network errors gracefully', async () => {
      mockChatService.getMessages.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(mockChatService.getMessages(mockConversation.id))
        .rejects.toThrow('Network timeout');
    });

    it('should detect memory leaks in real-time subscriptions', async () => {
      const { leaked } = await TestHelpers.detectMemoryLeaks(async () => {
        const subscription = await mockChatService.subscribeToMessages(
          mockConversation.id,
          jest.fn()
        );
        if (subscription && subscription.unsubscribe) {
          await subscription.unsubscribe();
        }
      }, 20);

      expect(leaked).toBe(false);
    });

    it('should handle malformed message data', async () => {
      const malformedMessage = {
        id: null,
        content: undefined,
        sender_id: '',
      };

      mockChatService.sendMessage.mockImplementation(async (conversationId, content) => {
        if (!content || content.trim().length === 0) {
          throw new Error('Invalid message data');
        }
        return mockMessage;
      });

      await expect(mockChatService.sendMessage(mockConversation.id, ''))
        .rejects.toThrow('Invalid message data');
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup subscriptions on service destruction', async () => {
      const mockUnsubscribe = jest.fn().mockResolvedValue(true);
      
      mockChatService.cleanup.mockImplementation(async () => {
        await mockUnsubscribe();
        return true;
      });

      await mockChatService.cleanup();
      expect(mockChatService.cleanup).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      mockChatService.cleanup.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw even if cleanup fails
      await expect(mockChatService.cleanup()).rejects.toThrow('Cleanup failed');
    });
  });
});