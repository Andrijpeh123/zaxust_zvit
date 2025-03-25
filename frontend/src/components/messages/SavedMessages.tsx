import React, { useState, useEffect, useRef } from 'react';
import { Container, Form, Button, Card, Dropdown } from 'react-bootstrap';
import { Bookmark, Send, ThreeDots, EmojiSmile } from 'react-bootstrap-icons';
import { Message, MessageStatus, Reaction } from '../../types';
import '../conversations/ConversationDetail.css';
import './SavedMessages.css';

const EMOJI_LIST = ['👍', '❤️', '😊', '😂', '😮', '😢', '👎', '🎉'];

const SavedMessages: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('savedMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    localStorage.setItem('savedMessages', JSON.stringify(messages));
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now(),
      content: newMessage,
      timestamp: new Date().toISOString(),
      sender: {
        id: currentUser.id || 0,
        username: currentUser.username || 'Я'
      },
      is_read: true,
      status: MessageStatus.DELIVERED,
      reactions: []
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const handleAddReaction = (messageId: number, emoji: string, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation(); // Зупиняємо спливання події
    }
    
    setMessages(messages.map(message => {
      if (message.id === messageId) {
        const existingReaction = message.reactions.find(
          r => r.emoji === emoji && r.user_id === currentUser.id
        );

        if (existingReaction) {
          return {
            ...message,
            reactions: message.reactions.filter(r => r !== existingReaction)
          };
        } else {
          const newReaction: Reaction = {
            id: Date.now(),
            message_id: messageId,
            emoji,
            user_id: currentUser.id,
            username: currentUser.username
          };
          return {
            ...message,
            reactions: [...message.reactions, newReaction]
          };
        }
      }
      return message;
    }));
  };

  const renderReactions = (message: Message) => {
    const groupedReactions = message.reactions.reduce((acc, reaction) => {
      acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="message-reactions">
        {Object.entries(groupedReactions).map(([emoji, count]) => (
          <span 
            key={emoji} 
            className={`reaction-badge ${
              message.reactions.some(r => r.emoji === emoji && r.user_id === currentUser.id)
                ? 'active'
                : ''
            }`}
            onClick={(e) => handleAddReaction(message.id, emoji, e)}
          >
            {emoji} {count}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Container fluid className="chat-container h-100 d-flex flex-column p-0">
      {/* Хедер чату */}
      <div className="chat-header p-3 border-bottom d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div className="saved-messages-avatar me-3">
            <Bookmark size={24} />
          </div>
          <div>
            <h5 className="mb-0">Збережені повідомлення</h5>
            <small className="text-muted">
              {messages.length} {messages.length === 1 ? 'повідомлення' : 'повідомлень'}
            </small>
          </div>
        </div>
        <div className="chat-options">
          <ThreeDots size={24} />
        </div>
      </div>

      {/* Контейнер повідомлень */}
      <div className="messages-container flex-grow-1 overflow-auto p-3">
        {messages.length === 0 ? (
          <div className="h-100 d-flex flex-column justify-content-center align-items-center text-center">
            <div className="saved-messages-avatar mb-4">
              <Bookmark size={32} />
            </div>
            <h4>Вітаємо у збережених повідомленнях</h4>
            <p className="text-muted px-4">
              Пересилайте сюди повідомлення з інших чатів або створюйте нотатки для себе
            </p>
          </div>
        ) : (
          <div className="messages">
            {messages.map((message) => (
              <div key={message.id} className="message-wrapper">
                <div className="message own">
                  <div className="message-content">
                    {message.content}
                    <Dropdown className="message-options">
                      <Dropdown.Toggle 
                        variant="link" 
                        className="message-options-toggle"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <EmojiSmile size={16} />
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <div className="emoji-picker">
                          {EMOJI_LIST.map(emoji => (
                            <span
                              key={emoji}
                              className="emoji-option"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddReaction(message.id, emoji, e);
                                // Закриваємо dropdown після вибору
                                const dropdownToggle = e.currentTarget.closest('.dropdown')?.querySelector('.dropdown-toggle');
                                if (dropdownToggle) {
                                  (dropdownToggle as HTMLElement).click();
                                }
                              }}
                            >
                              {emoji}
                            </span>
                          ))}
                        </div>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                  {renderReactions(message)}
                  <div className="message-info">
                    <span className="message-time">
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.status === MessageStatus.DELIVERED && (
                      <span className="message-status">✓</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Футер з полем вводу */}
      <div className="chat-footer p-3 border-top">
        <Form onSubmit={handleSubmit} className="d-flex gap-2">
          <Form.Control
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Напишіть повідомлення..."
            className="message-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="send-button"
            disabled={!newMessage.trim()}
          >
            <Send />
          </Button>
        </Form>
      </div>
    </Container>
  );
};

export default SavedMessages;