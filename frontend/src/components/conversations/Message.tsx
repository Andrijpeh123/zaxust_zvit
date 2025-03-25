import React from 'react';
import { Card, Image } from 'react-bootstrap';
import { Message as MessageType } from '../../types';

interface MessageProps {
  message: MessageType;
  isCurrentUser: boolean;
}

const Message: React.FC<MessageProps> = ({ message, isCurrentUser }) => {
  const renderFileContent = () => {
    if (!message.file) return null;
    
    const { url, type } = message.file;
    
    if (type.startsWith('image/')) {
      return (
        <Image 
          src={url} 
          alt="Image" 
          fluid 
          className="mb-2 rounded" 
          style={{ maxHeight: '300px' }} 
        />
      );
    } else if (type.startsWith('video/')) {
      return (
        <video 
          src={url} 
          controls 
          className="mb-2 rounded w-100" 
          style={{ maxHeight: '300px' }} 
        />
      );
    } else if (type.startsWith('audio/')) {
      return (
        <audio 
          src={url} 
          controls 
          className="mb-2 w-100" 
        />
      );
    } else {
      return (
        <div className="file-attachment mb-2 p-2 border rounded">
          <a href={url} target="_blank" rel="noopener noreferrer" download>
            <i className="bi bi-file-earmark me-2"></i>
            {message.file.name || 'Download file'} 
            {message.file.size && `(${Math.round(message.file.size / 1024)} KB)`}
          </a>
        </div>
      );
    }
  };

  return (
    <div className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}>
      <Card 
        style={{ 
          maxWidth: '75%',
          backgroundColor: isCurrentUser ? '#dcf8c6' : '#f0f0f0'
        }}
      >
        <Card.Body className="p-2">
          {!isCurrentUser && (
            <div className="fw-bold mb-1">{message.sender.username}</div>
          )}
          
          {renderFileContent()}
          
          {message.content && (
            <div>{message.content}</div>
          )}
          
          <div className="text-muted small text-end mt-1">
            {new Date(message.timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Message;