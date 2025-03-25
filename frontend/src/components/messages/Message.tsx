import React, { useEffect, useRef, useState } from 'react';
import { Message as MessageType, MessageStatus } from '../../types';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { Check, CheckAll, Paperclip, Trash } from 'react-bootstrap-icons';
import './Message.css';

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
  onDelete?: (messageId: number) => void;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser, onDelete }) => {
  const messageRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
  }>({
    show: false,
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log('Message visibility changed:', entry.isIntersecting);
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.9, 
        rootMargin: '0px' 
      }
    );

    if (messageRef.current) {
      observer.observe(messageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu.show && messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setContextMenu({ ...contextMenu, show: false });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.show]);

  const getMessageStatus = () => {
    console.log('Message status check:', { is_read: message.is_read, isVisible });
    
    if (message.is_read) {
      return MessageStatus.READ;
    }
    
    if (isVisible) {
      return MessageStatus.DELIVERED;
    }
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

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message.id);
    }
    setContextMenu({ ...contextMenu, show: false });
  };

  return (
    <>
      <div 
        ref={messageRef}
        className={`message-container ${isCurrentUser ? 'current-user' : 'other-user'}`}
        onContextMenu={handleContextMenu}
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

      {contextMenu.show && (
        <div 
          className="message-context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <div 
            className="message-context-menu-item delete"
            onClick={handleDelete}
          >
            <Trash size={16} />
            Видалити повідомлення
          </div>
        </div>
      )}
    </>
  );
};

export default Message;