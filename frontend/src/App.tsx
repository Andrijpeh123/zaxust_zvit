import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatLayout from './components/layout/ChatLayout';
import UserSettings from './components/settings/UserSettings';
import ProfileSettings from './components/profile/ProfileSettings';
import PrivateRoute from './components/auth/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ThemeSettings from './components/settings/ThemeSettings';
import SavedMessages from './components/messages/SavedMessages';

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route 
            path="/conversations/*" 
            element={
              <PrivateRoute>
                <ChatLayout />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <PrivateRoute>
                <UserSettings />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <PrivateRoute>
                <ProfileSettings />
              </PrivateRoute>
            } 
          />
          <Route path="/settings/profile" element={<ProfileSettings />} />
          <Route path="/settings/theme" element={<ThemeSettings />} />
          <Route path="/saved-messages" element={<SavedMessages />} />
          <Route path="/" element={<Navigate to="/conversations" replace />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;