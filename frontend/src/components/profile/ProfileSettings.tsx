import React, { useState, useEffect, useRef } from 'react';
import { Container, Card, Button, Form, Image } from 'react-bootstrap';
import { QrCode } from 'react-bootstrap-icons';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { getCurrentUser } from '../../services/api';
import QRCodeModal from './QRCodeModal';
import './ProfileSettings.css';

const ProfileSettings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentThemeId, setCurrentThemeId] = useState(() => localStorage.getItem('theme') || 'classic');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getCurrentUser();
        console.log('Fetched user data:', userData);
        setCurrentUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Effect to listen for changes in localStorage theme
  useEffect(() => {
    const handleStorageChange = () => {
      setCurrentThemeId(localStorage.getItem('theme') || 'classic');
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', file);
    }
  };

  if (loading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Налаштування профілю</h2>
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div className="d-flex align-items-center">
              <div 
                className="user-avatar me-3"
                style={{
                  backgroundColor: currentUser.avatar ? 'transparent' : getAvatarColor(currentUser.username),
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: 'white',
                  cursor: 'pointer'
                }}
                onClick={handleAvatarClick}
              >
                {currentUser.avatar ? (
                  <Image src={currentUser.avatar} roundedCircle style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(currentUser.username)
                )}
              </div>
              <div>
                <h3 className="mb-1">{currentUser.username}</h3>
                <div className="text-muted">@{currentUser.username}</div>
              </div>
            </div>
            <Button 
              variant="outline-primary"
            >
              Редагувати профіль
            </Button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={handleFileChange}
          />

          <div className="profile-info">
            <div className="info-section">
              <h5>Особиста інформація</h5>
              <div className="info-item">
                <label>Ім'я користувача</label>
                <div>@{currentUser.username}</div>
              </div>
              <div className="info-item">
                <Button 
                  variant="outline-primary" 
                  className="d-flex align-items-center"
                  onClick={() => setShowQRCode(true)}
                >
                  <QrCode className="me-2" />
                  Показати QR-код
                </Button>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>

      <QRCodeModal 
        show={showQRCode}
        onHide={() => setShowQRCode(false)}
        user={currentUser}
        currentThemeId={currentThemeId}
      />
    </Container>
  );
};

export default ProfileSettings;