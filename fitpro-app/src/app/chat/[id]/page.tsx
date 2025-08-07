'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

interface Message {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export default function ChatPage() {
  const { id } = useParams(); // id represents conversationId
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (id) {
      // Fetch initial messages
      fetch(`/api/chat/messages?conversationId=${id}`)
        .then(res => res.json())
        .then(data => setMessages(data));

      // TODO: Implement real-time message subscription (e.g., WebSockets with Supabase Realtime)
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = {
      conversationId: id,
      senderId: 'currentUser', // TODO: Replace with actual user ID
      text: newMessage,
    };

    const response = await fetch('/api/chat/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageToSend),
    });

    if (response.ok) {
      // Add message to UI immediately (optimistic update)
      setMessages(prevMessages => [...prevMessages, { 
        ...messageToSend, 
        id: Date.now().toString(), 
        timestamp: new Date().toISOString(),
        sender: 'currentUser' // Add the missing sender property
      }]);
      setNewMessage('');
      scrollToBottom();
    } else {
      // Handle error
      console.error('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Chat com {id}</h1>

      <div className="flex-1 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-2 ${msg.sender === 'currentUser' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block p-2 rounded-lg ${msg.sender === 'currentUser' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-black'}`}>
              {msg.text}
            </span>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 p-2 border rounded-lg text-black"
        />
        <button type="submit" className="bg-blue-600 text-white p-2 rounded-lg">
          Enviar
        </button>
      </form>
    </div>
  );
}
