import React, { useState, useRef } from 'react';
import { Form, Button, InputGroup } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperclip, faArrowRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { sendMessage, uploadFile } from '../../services/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import './MessageInput.css';

interface MessageInputProps {
  conversationId: number;
  onMessageSent: (message: any) => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; 

const MessageInput: React.FC<MessageInputProps> = ({ conversationId, onMessageSent }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setFileError('');
    
    if (file.size > MAX_FILE_SIZE) {
      setFileError('Файл занадто великий. Максимальний розмір: 50MB');
      return false;
    }
    const allowedTypes = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedTypes.some(type => file.type.startsWith(type))) {
      setFileError('Цей тип файлу не підтримується');
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (validateFile(file)) {
        setSelectedFile(file);
      } else {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!message.trim() && !selectedFile) || sending) return;

    setSending(true);
    try {
      let fileData;
      if (selectedFile) {
        const response = await uploadFile(selectedFile);
        fileData = {
          url: response.url,
          name: selectedFile.name,
          type: selectedFile.type,
          size: selectedFile.size
        };
      }

      const newMessage = await sendMessage(conversationId, message, fileData);
      onMessageSent(newMessage);
      setMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Помилка при відправці повідомлення. Спробуйте ще раз.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="message-input-form">
      <InputGroup>
        <Form.Control
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Напишіть повідомлення..."
          disabled={sending}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <Button
          variant="outline-secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          className="attachment-button"
          title="Прикріпити файл"
        >
          <FontAwesomeIcon icon={faPaperclip} />
        </Button>
        <Button 
          type="submit" 
          variant="primary"
          disabled={(!message.trim() && !selectedFile) || sending}
          className="send-button"
          title="Надіслати"
        >
          <FontAwesomeIcon icon={faArrowRight} />
        </Button>
      </InputGroup>
      {fileError && (
        <div className="file-error">
          {fileError}
        </div>
      )}
      {selectedFile && (
        <div className="selected-file">
          <FontAwesomeIcon icon={faPaperclip} />
          <div className="file-info">
            <div className="file-name">{selectedFile.name}</div>
            <div className="file-size">{formatFileSize(selectedFile.size)}</div>
          </div>
          <Button
            variant="link"
            size="sm"
            className="remove-file"
            onClick={() => {
              setSelectedFile(null);
              setFileError('');
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            title="Видалити файл"
          >
            <FontAwesomeIcon icon={faTimes} />
          </Button>
        </div>
      )}
    </Form>
  );
};

export default MessageInput; 