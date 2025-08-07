/**
 * Chat Data Migration Script
 * Migrates chat conversations and messages from AsyncStorage to Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const { v4: uuidv4 } = require('uuid');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Migration Statistics
 */
class ChatMigrationStats {
  constructor() {
    this.totalConversations = 0;
    this.totalMessages = 0;
    this.migratedConversations = 0;
    this.migratedMessages = 0;
    this.failedConversations = 0;
    this.failedMessages = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  addSuccess(type, count = 1) {
    if (type === 'conversation') {
      this.migratedConversations += count;
    } else if (type === 'message') {
      this.migratedMessages += count;
    }
  }

  addError(type, id, error) {
    if (type === 'conversation') {
      this.failedConversations++;
    } else if (type === 'message') {
      this.failedMessages++;
    }
    
    this.errors.push({ 
      type, 
      id, 
      error: error.message, 
      timestamp: new Date().toISOString() 
    });
  }

  getReport() {
    const duration = Date.now() - this.startTime;
    return {
      duration: `${Math.round(duration / 1000)}s`,
      conversations: {
        total: this.totalConversations,
        migrated: this.migratedConversations,
        failed: this.failedConversations,
        successRate: this.totalConversations > 0 
          ? Math.round((this.migratedConversations / this.totalConversations) * 100) 
          : 0,
      },
      messages: {
        total: this.totalMessages,
        migrated: this.migratedMessages,
        failed: this.failedMessages,
        successRate: this.totalMessages > 0 
          ? Math.round((this.migratedMessages / this.totalMessages) * 100) 
          : 0,
      },
      errors: this.errors,
    };
  }
}

/**
 * Load chat data from AsyncStorage
 */
async function loadAsyncStorageChatData() {
  try {
    console.log('💬 Loading chat data from AsyncStorage...');
    
    const allKeys = await AsyncStorage.getAllKeys();
    const chatKeys = allKeys.filter(key => 
      key.startsWith('chat_') || 
      key.startsWith('conversation_') ||
      key.startsWith('message_') ||
      key === 'conversations' ||
      key === 'messages'
    );

    console.log(`Found ${chatKeys.length} potential chat keys:`, chatKeys);

    const conversations = [];
    const messages = [];

    for (const key of chatKeys) {
      try {
        const rawData = await AsyncStorage.getItem(key);
        if (rawData) {
          const data = JSON.parse(rawData);
          
          // Handle different data structures
          if (key === 'conversations' && Array.isArray(data)) {
            conversations.push(...data);
          } else if (key === 'messages' && Array.isArray(data)) {
            messages.push(...data);
          } else if (key.startsWith('conversation_')) {
            // Single conversation
            conversations.push(data);
          } else if (key.startsWith('message_')) {
            // Single message
            messages.push(data);
          } else if (data.participants && data.messages) {
            // Conversation with embedded messages
            conversations.push({
              ...data,
              messages: undefined, // Extract messages separately
            });
            if (Array.isArray(data.messages)) {
              messages.push(...data.messages.map(msg => ({
                ...msg,
                conversation_id: data.id,
              })));
            }
          }
        }
      } catch (error) {
        console.warn(`❌ Failed to parse data for key ${key}:`, error.message);
      }
    }

    console.log(`📊 Found ${conversations.length} conversations and ${messages.length} messages`);
    return { conversations, messages };
  } catch (error) {
    console.error('❌ Failed to load chat data from AsyncStorage:', error);
    throw error;
  }
}

/**
 * Transform AsyncStorage conversation data to Supabase format
 */
function transformConversationData(asyncData) {
  return {
    id: asyncData.id || uuidv4(),
    trainer_id: asyncData.trainer_id || asyncData.trainerId || asyncData.participants?.trainer,
    student_id: asyncData.student_id || asyncData.studentId || asyncData.participants?.student,
    title: asyncData.title || asyncData.name,
    last_message: asyncData.last_message || asyncData.lastMessage,
    last_message_at: asyncData.last_message_at || asyncData.lastMessageAt || asyncData.updatedAt,
    is_archived: asyncData.is_archived || asyncData.archived || false,
    created_at: asyncData.created_at || asyncData.createdAt || new Date().toISOString(),
    updated_at: asyncData.updated_at || asyncData.updatedAt || new Date().toISOString(),
  };
}

/**
 * Transform AsyncStorage message data to Supabase format
 */
function transformMessageData(asyncData, conversationId = null) {
  return {
    id: asyncData.id || uuidv4(),
    conversation_id: asyncData.conversation_id || conversationId || asyncData.conversationId,
    sender_id: asyncData.sender_id || asyncData.senderId || asyncData.from,
    content: asyncData.content || asyncData.text || asyncData.message,
    message_type: asyncData.message_type || asyncData.type || 'text',
    sent_at: asyncData.sent_at || asyncData.sentAt || asyncData.timestamp || new Date().toISOString(),
    read_at: asyncData.read_at || asyncData.readAt,
    edited_at: asyncData.edited_at || asyncData.editedAt,
    is_deleted: asyncData.is_deleted || asyncData.deleted || false,
    metadata: asyncData.metadata || {},
    
    // Handle attachments
    attachment_url: asyncData.attachment_url || asyncData.attachment?.url,
    attachment_type: asyncData.attachment_type || asyncData.attachment?.type,
    attachment_size: asyncData.attachment_size || asyncData.attachment?.size,
  };
}

/**
 * Get user mappings to validate foreign keys
 */
async function getUserMappings() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, user_type');

    if (error) throw error;

    const userMap = new Map();
    profiles.forEach(profile => {
      userMap.set(profile.email, profile.id);
      userMap.set(profile.id, profile);
    });

    return userMap;
  } catch (error) {
    console.warn('⚠️ Could not load user mappings:', error.message);
    return new Map();
  }
}

/**
 * Check if conversation already exists
 */
async function conversationExists(conversationId) {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.warn('⚠️ Error checking conversation existence:', error.message);
    return false;
  }
}

/**
 * Migrate single conversation
 */
async function migrateConversation(conversationData, userMap, stats) {
  try {
    const transformedData = transformConversationData(conversationData);
    
    // Validate participant IDs
    if (!transformedData.trainer_id || !transformedData.student_id) {
      throw new Error('Missing trainer_id or student_id');
    }

    // Check if participants exist
    if (userMap.size > 0) {
      const trainerExists = userMap.has(transformedData.trainer_id);
      const studentExists = userMap.has(transformedData.student_id);
      
      if (!trainerExists || !studentExists) {
        throw new Error(`Participants not found in profiles table`);
      }
    }

    // Check if conversation already exists
    const exists = await conversationExists(transformedData.id);
    if (exists) {
      console.log(`⚠️ Conversation already exists: ${transformedData.id}`);
      stats.addSuccess('conversation');
      return transformedData;
    }

    // Insert conversation
    const { data, error } = await supabase
      .from('conversations')
      .insert(transformedData)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Migrated conversation: ${transformedData.id}`);
    stats.addSuccess('conversation');
    return data;

  } catch (error) {
    console.error(`❌ Failed to migrate conversation ${conversationData.id || 'unknown'}:`, error.message);
    stats.addError('conversation', conversationData.id, error);
    throw error;
  }
}

/**
 * Migrate messages for a conversation
 */
async function migrateMessagesForConversation(conversationId, messages, stats) {
  try {
    const conversationMessages = messages.filter(msg => 
      msg.conversation_id === conversationId || msg.conversationId === conversationId
    );

    if (conversationMessages.length === 0) {
      return [];
    }

    const transformedMessages = conversationMessages.map(msg => 
      transformMessageData(msg, conversationId)
    );

    // Batch insert messages
    const batchSize = 50;
    const insertedMessages = [];

    for (let i = 0; i < transformedMessages.length; i += batchSize) {
      const batch = transformedMessages.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('messages')
        .insert(batch)
        .select();

      if (error) {
        throw new Error(`Batch insert failed: ${error.message}`);
      }

      if (data) {
        insertedMessages.push(...data);
        stats.addSuccess('message', data.length);
        console.log(`✅ Migrated ${data.length} messages for conversation ${conversationId}`);
      }
    }

    return insertedMessages;

  } catch (error) {
    console.error(`❌ Failed to migrate messages for conversation ${conversationId}:`, error.message);
    const messageCount = messages.filter(msg => 
      msg.conversation_id === conversationId || msg.conversationId === conversationId
    ).length;
    stats.addError('message', conversationId, error);
    stats.failedMessages += messageCount;
    throw error;
  }
}

/**
 * Generate sample chat data for testing
 */
function generateSampleChatData() {
  const sampleData = {
    conversations: [
      {
        id: uuidv4(),
        trainer_id: 'sample-trainer-1',
        student_id: 'sample-student-1',
        title: 'Workout Discussion',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: uuidv4(),
        trainer_id: 'sample-trainer-2',
        student_id: 'sample-student-2', 
        title: 'Progress Check',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    messages: [],
  };

  // Generate messages for each conversation
  sampleData.conversations.forEach((conv, convIndex) => {
    for (let i = 0; i < 5; i++) {
      sampleData.messages.push({
        id: uuidv4(),
        conversation_id: conv.id,
        sender_id: i % 2 === 0 ? conv.trainer_id : conv.student_id,
        content: `Sample message ${i + 1} for conversation ${convIndex + 1}`,
        message_type: 'text',
        sent_at: new Date(Date.now() - (4 - i) * 60 * 60 * 1000).toISOString(),
      });
    }
  });

  return sampleData;
}

/**
 * Main chat migration function
 */
async function migrateChat() {
  const stats = new ChatMigrationStats();
  
  try {
    console.log('🚀 Starting chat data migration...');

    // Test Supabase connection
    const { error: connectionError } = await supabase
      .from('conversations')
      .select('count')
      .limit(1);

    if (connectionError && connectionError.code !== 'PGRST116') {
      throw new Error(`Supabase connection failed: ${connectionError.message}`);
    }

    console.log('✅ Supabase connection verified');

    // Load user mappings for validation
    const userMap = await getUserMappings();
    console.log(`📋 Loaded ${userMap.size} user mappings`);

    // Load chat data from AsyncStorage
    let { conversations, messages } = await loadAsyncStorageChatData();
    
    // If no data found, generate sample data for testing
    if (conversations.length === 0 && messages.length === 0) {
      console.log('ℹ️ No chat data found in AsyncStorage, generating sample data...');
      const sampleData = generateSampleChatData();
      conversations = sampleData.conversations;
      messages = sampleData.messages;
    }

    stats.totalConversations = conversations.length;
    stats.totalMessages = messages.length;

    if (conversations.length === 0) {
      console.log('ℹ️ No conversations found to migrate');
      return stats.getReport();
    }

    // Migrate conversations
    console.log(`📦 Migrating ${conversations.length} conversations...`);
    const migratedConversations = [];

    for (const conversation of conversations) {
      try {
        const migrated = await migrateConversation(conversation, userMap, stats);
        migratedConversations.push(migrated);
      } catch (error) {
        // Error already logged in migrateConversation
        continue;
      }
    }

    // Migrate messages for each conversation
    console.log(`💬 Migrating ${messages.length} messages...`);
    
    for (const conversation of migratedConversations) {
      try {
        await migrateMessagesForConversation(conversation.id, messages, stats);
      } catch (error) {
        // Error already logged in migrateMessagesForConversation
        continue;
      }
    }

    console.log('✅ Chat migration completed successfully!');
    return stats.getReport();

  } catch (error) {
    console.error('❌ Chat migration failed:', error);
    throw error;
  }
}

/**
 * Validate chat migration
 */
async function validateChatMigration() {
  console.log('🔍 Validating chat migration results...');
  
  try {
    // Count conversations
    const { data: conversationCount, error: convError } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true });

    // Count messages
    const { data: messageCount, error: msgError } = await supabase
      .from('messages') 
      .select('id', { count: 'exact', head: true });

    if (convError || msgError) {
      throw new Error('Failed to count migrated chat data');
    }

    // Sample data validation
    const { data: sampleConversations, error: sampleError } = await supabase
      .from('conversations')
      .select(`
        *,
        messages(count)
      `)
      .limit(3);

    if (sampleError) {
      throw sampleError;
    }

    const validation = {
      totalConversations: conversationCount?.length || 0,
      totalMessages: messageCount?.length || 0,
      sampleData: sampleConversations?.map(conv => ({
        id: conv.id,
        participants: {
          trainer: conv.trainer_id,
          student: conv.student_id,
        },
        messageCount: conv.messages?.[0]?.count || 0,
        hasRequiredFields: !!(conv.trainer_id && conv.student_id),
      })) || [],
    };

    console.log('📊 Chat migration validation:', validation);
    return validation;
  } catch (error) {
    console.error('❌ Chat migration validation failed:', error);
    throw error;
  }
}

// Export functions
module.exports = {
  migrateChat,
  validateChatMigration,
  transformConversationData,
  transformMessageData,
  ChatMigrationStats,
  generateSampleChatData,
};

// Run migration if called directly
if (require.main === module) {
  migrateChat()
    .then(results => {
      console.log('\n📊 Chat Migration Report:');
      console.log(JSON.stringify(results, null, 2));
      return validateChatMigration();
    })
    .then(validation => {
      console.log('\n🔍 Validation Results:');
      console.log(JSON.stringify(validation, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Chat migration failed:', error);
      process.exit(1);
    });
}