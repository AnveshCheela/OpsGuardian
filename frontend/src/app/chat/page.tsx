"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useSocket } from '@/hooks/useSocket';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';

type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    role?: string;
  };
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

export default function ChatPage() {
  const { user, token, isLoading } = useAuth();
  const { socket } = useSocket();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const teamId = user?.teams?.[0]?.id;
  const teamName = user?.teams?.[0]?.name || 'Your Team';

  // Build team members list from user data
  const teamMembers: TeamMember[] = (() => {
    if (!user || !user.teams || user.teams.length === 0) return [];
    const members: TeamMember[] = [];
    const team = user.teams[0];

    // Add leader if exists
    if (team.leader) {
      members.push({
        id: team.leader.id,
        name: team.leader.name,
        email: team.leader.email,
        role: 'Leader'
      });
    }

    // Add all approved employees
    if (team.users) {
      team.users.forEach(u => {
        if (u.status === 'Approved' && u.id !== team.leader?.id) {
          members.push({
            id: u.id,
            name: u.name,
            email: u.email,
            role: 'Employee'
          });
        }
      });
    }

    // Remove duplicates just in case
    return Array.from(new Map(members.map(m => [m.id, m])).values());
  })();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Map backend message shape (user) to frontend shape (sender)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapMessage = (msg: any): ChatMessage => ({
    id: msg.id,
    content: msg.content,
    createdAt: msg.createdAt,
    sender: msg.sender || msg.user || { id: '', name: '?' },
  });

  // Fetch existing messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/chat/messages`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages((data.messages || []).map(mapMessage));
        }
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      }
    };
    if (user && token) fetchMessages();
  }, [user, token]);

  // Socket: join chat room + listen for messages
  useEffect(() => {
    if (!socket || !teamId) return;

    socket.emit('chat:join', teamId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleNewMessage = (raw: any) => {
      const message = mapMessage(raw);
      setMessages(prev => {
        const exists = prev.some(m => m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, teamId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/chat/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
      });

      if (res.ok) {
        const data = await res.json();
        const mapped = mapMessage(data.message);
        // Only add if not already received via socket
        setMessages(prev => {
          const exists = prev.some(m => m.id === mapped.id);
          if (exists) return prev;
          return [...prev, mapped];
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-black flex flex-col">
        <Navbar />
        <main className="flex-1 w-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-mocha/30 border-t-mocha rounded-full animate-spin"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Navbar />
      <main className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 73px)' }}>

        {/* Left Sidebar - Team Info */}
        <aside className="w-[280px] flex-shrink-0 bg-espresso-dark/90 border-r border-mocha/50 flex flex-col">
          <div className="p-5 border-b border-mocha/30">
            <h2 className="text-lg font-bold text-cream flex items-center gap-2">
              {teamName}
            </h2>
            <p className="text-cream/40 text-xs mt-1">Team Chat</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-semibold text-cream/50 uppercase tracking-wider mb-3">
              Members ({teamMembers.length})
            </h3>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-mocha/10 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-mocha/30 border border-mocha/50 flex items-center justify-center text-cream font-semibold text-sm uppercase flex-shrink-0">
                    {member.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-cream text-sm font-medium truncate flex items-center gap-1.5">
                      {member.name}
                      {member.id === user.id && <span className="text-cream/40 text-xs">(you)</span>}
                    </p>
                    <p className="text-cream/40 text-xs flex items-center gap-1 font-bold tracking-wider uppercase">
                      {member.role === 'Leader' ? 'Leader' : 'Employee'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right - Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-cream/50 text-lg font-medium">No messages yet</p>
                  <p className="text-cream/30 text-sm mt-1">Start the conversation with your team</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwn = msg.sender?.id === user.id;
                return (
                  <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start gap-2.5 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-cream font-semibold text-sm uppercase flex-shrink-0 ${
                        isOwn ? 'bg-mocha' : 'bg-mocha/30 border border-mocha/50'
                      }`}>
                        {msg.sender?.name?.charAt(0) || '?'}
                      </div>

                      {/* Message bubble */}
                      <div className={`rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? 'bg-mocha/80 rounded-br-sm'
                          : 'bg-espresso-dark border border-mocha/30 rounded-bl-sm'
                      }`}>
                        {!isOwn && (
                          <p className="text-mocha text-xs font-semibold mb-0.5">{msg.sender?.name}</p>
                        )}
                        <p className="text-cream text-sm leading-relaxed">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-cream/50' : 'text-cream/30'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-mocha/30 p-4 bg-espresso-dark/50">
            <div className="flex items-center gap-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 bg-black/40 border border-mocha/40 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:ring-2 focus:ring-mocha/50 focus:border-mocha transition-all"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSending}
                className="px-5 py-3 bg-mocha hover:bg-mocha/80 text-cream font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:hover:bg-mocha flex items-center gap-2"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
