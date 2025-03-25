import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Form, Image } from 'react-bootstrap';
import { QrCode } from 'react-bootstrap-icons';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';
import { getCurrentUser } from '../../services/api';
import QRCodeModal from './QRCodeModal';
import './ProfileSettings.css';

const ProfileSettings: React.FC = () => {
  const [currentUser, setCurrentUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(currentUser.username);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);

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

  if (loading) {
    return <div className="text-center py-5">Loading...</div>;
  }

  const handleSave = async () => {
    try {
      // TODO: Додати API запит для оновлення профілю
      // await updateProfile({ username });
      setEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

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
                  backgroundColor: getAvatarColor(currentUser.username),
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '40px',
                  color: 'white'
                }}
              >
                {getInitials(currentUser.username)}
              </div>
              <div>
                <h3 className="mb-1">{currentUser.username}</h3>
                <div className="text-muted">@{currentUser.username}</div>
              </div>
            </div>
            <Button 
              variant="outline-primary"
              onClick={() => setEditMode(true)}
            >
              Редагувати профіль
            </Button>
          </div>

          {editMode ? (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Ім'я користувача</Form.Label>
                <Form.Control
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Form.Group>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={() => setEditMode(false)}>
                  Скасувати
                </Button>
                <Button variant="primary" onClick={handleSave}>
                  Зберегти
                </Button>
              </div>
            </Form>
          ) : (
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

              <div className="info-section">
                <h5>Налаштування сповіщень</h5>
                <Form.Check 
                  type="switch"
                  id="notification-switch"
                  label="Сповіщення про нові повідомлення"
                  defaultChecked
                />
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <QRCodeModal 
        show={showQRCode}
        onHide={() => setShowQRCode(false)}
        user={currentUser}
      />
    </Container>
  );
};

export default ProfileSettings;