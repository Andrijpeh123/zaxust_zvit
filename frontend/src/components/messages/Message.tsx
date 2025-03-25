import React, { useEffect, useRef, useState } from 'react';
import { Message as MessageType, MessageStatus } from '../../types';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { Check, CheckAll, Paperclip } from 'react-bootstrap-icons';
import './Message.css';

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('Message visibility changed:', entry.isIntersecting);
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.9, // Збільшуємо поріг - повідомлення має бути майже повністю видимим
        rootMargin: '0px' // Додаємо явний rootMargin
      }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const getMessageStatus = () => {
    console.log('Message status check:', { is_read: message.is_read, isVisible });
    
    if (message.is_read) {
      return MessageStatus.READ;
    }
    // Якщо повідомлення видиме на екрані - показуємо дві галочки
    if (isVisible) {
      return MessageStatus.DELIVERED;
    }
    // Якщо не видиме - одну галочку
    return MessageStatus.SENT;
  };

  const renderMessageStatus = () => {
    if (!isCurrentUser) return null;

    const status = getMessageStatus();
    
    switch (status) {
      case MessageStatus.SENT:
        return <Check className="message-status" size={14} />;
      case MessageStatus.DELIVERED:
        return <CheckAll className="message-status" size={14} />;
      case MessageStatus.READ:
        return <CheckAll className="message-status read" size={14} style={{ color: '#0d6efd' }} />;
      default:
        return <Check className="message-status" size={14} />;
    }
  };

  const renderFileContent = () => {
    if (!message.file) return null;
    
    const { url, type, name } = message.file;
    
    if (type.startsWith('image/')) {
      return (
        <div className="message-attachment">
          <img src={url} alt="Image" className="attachment-image" />
        </div>
      );
    } else if (type.startsWith('video/')) {
      return (
        <div className="message-attachment">
          <video src={url} controls className="attachment-video" />
        </div>
      );
    } else if (type.startsWith('audio/')) {
      return (
        <div className="message-attachment">
          <audio src={url} controls className="attachment-audio" />
        </div>
      );
    } else {
      return (
        <div className="message-attachment file">
          <Paperclip size={16} />
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            {name || 'Завантажити файл'}
          </a>
        </div>
      );
    }
  };

  return (
    <div 
      ref={messageRef}
      className={`message-container ${isCurrentUser ? 'current-user' : 'other-user'}`}
    >
      <div className="message-content">
        {!isCurrentUser && (
          <div 
            className="message-avatar"
            style={{ backgroundColor: getAvatarColor(message.sender.username) }}
          >
            {getInitials(message.sender.username)}
          </div>
        )}
        
        <div className="message-bubble">
          {!isCurrentUser && (
            <div className="sender-name">
              {message.sender.username}
            </div>
          )}
          {renderFileContent()}
          <div className="message-content-wrapper">
            <span className="message-text">
              {message.content}
            </span>
            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            {renderMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;