import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ConversationList from '../conversations/ConversationList';
import ConversationDetail from '../conversations/ConversationDetail';

const ChatLayout: React.FC = () => {
  return (
    <div className="chat-layout">
      <div className="conversations-sidebar">
        <ConversationList />
      </div>
      <div className="chat-main">
        <Routes>
          <Route path=":id" element={<ConversationDetail />} />
          <Route 
            path="/" 
            element={
              <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                Select a conversation to start chatting
              </div>
            } 
          />
        </Routes>
      </div>
    </div>
  );
};

export default ChatLayout; 