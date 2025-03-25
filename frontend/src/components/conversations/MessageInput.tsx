import React, { useState, useRef, useEffect } from 'react';
import { Form, Button, InputGroup, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { sendMessage, uploadFile } from '../../services/api';
import './MessageInput.css';

interface MessageInputProps {
  conversationId: number;
  onMessageSent: (message: any) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    
    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault();
    };
    
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('drop', handleWindowDrop);
    
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, []);
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelection(file);
      setTimeout(() => {
        if (messageInputRef.current) {
          messageInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    
    const fileType = file.type.split('/')[0]; 
    setFileType(fileType);
    
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setFileType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && !selectedFile) || sending) return;
    
    setSending(true);
    
    try {
      let fileUrl = null;
      let fileMetadata = null;
      
      if (selectedFile) {
        const fileData = await uploadFile(selectedFile);
        fileUrl = fileData.url;
        fileMetadata = {
          name: selectedFile.name,
          type: selectedFile.type || 'application/octet-stream', 
          size: selectedFile.size
        };
      }
      const newMessage = await sendMessage(
        conversationId, 
        message, 
        fileUrl ? { 
          url: fileUrl, 
          name: fileMetadata?.name,
          type: fileMetadata?.type || 'application/octet-stream', 
          size: fileMetadata?.size 
        } : undefined
      );
      
      onMessageSent(newMessage);
      setMessage('');
      setSelectedFile(null);
      setFilePreview(null);
      setFileType(null);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className={`message-input-wrapper ${isDragging ? 'is-dragging' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="drop-overlay">
          <div className="drop-message">
            <i className="bi bi-cloud-upload me-2"></i>
            Перетягніть файл сюди
          </div>
        </div>
      )}
      
      <Form onSubmit={handleSubmit} className="mt-3 message-input-container">
        {}
        {selectedFile && (
          <div className="selected-file mb-2 p-2 border rounded position-relative">
            <Button 
              variant="light" 
              size="sm" 
              className="position-absolute top-0 end-0 m-1"
              onClick={clearSelectedFile}
            >
              <i className="bi bi-x"></i>
            </Button>
            
            {filePreview && fileType === 'image' ? (
              <img 
                src={filePreview} 
                alt="Selected" 
                style={{ maxHeight: '150px', maxWidth: '100%' }} 
                className="d-block mx-auto"
              />
            ) : filePreview && fileType === 'video' ? (
              <video 
                src={filePreview} 
                controls 
                style={{ maxHeight: '150px', maxWidth: '100%' }} 
                className="d-block mx-auto"
              />
            ) : (
              <div className="text-center">
                <i className="bi bi-file-earmark me-2"></i>
                {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </div>
            )}
          </div>
        )}
        
        <InputGroup>
          <OverlayTrigger
            placement="top"
            overlay={<Tooltip>Прикріпити файл</Tooltip>}
          >
            <Button 
              variant="outline-secondary" 
              onClick={() => fileInputRef.current?.click()}
            >
              <i className="bi bi-paperclip"></i>
            </Button>
          </OverlayTrigger>
          
          <Form.Control
            ref={messageInputRef}
            type="text"
            placeholder={selectedFile ? "Додайте повідомлення до файлу (необов'язково)" : "Введіть повідомлення..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={sending}
          />
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={(!message.trim() && !selectedFile) || sending}
          >
            {sending ? (
              <Spinner animation="border" size="sm" />
            ) : (
              <i className="bi bi-send"></i>
            )}
          </Button>
          
          {}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            accept="image/*,video/*,audio/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          />
        </InputGroup>
      </Form>
    </div>
  );
};

export default MessageInput;