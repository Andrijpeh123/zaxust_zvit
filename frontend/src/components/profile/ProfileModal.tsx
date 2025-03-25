import React, { useState } from 'react';
import { Modal, Form, Button, Image } from 'react-bootstrap';
import { ThreeDotsVertical } from 'react-bootstrap-icons';
import { User } from '../../types';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';

interface ProfileModalProps {
  show: boolean;
  onHide: () => void;
  currentUser: User;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ show, onHide, currentUser }) => {
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(currentUser.username);

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
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>Мій профіль</Modal.Title>
        <div className="d-flex align-items-center">
          <ThreeDotsVertical 
            size={32}
            className="cursor-pointer me-2" 
            onClick={() => setEditMode(true)}
          />
          <button 
            type="button" 
            className="btn-close" 
            onClick={onHide}
          />
        </div>
      </Modal.Header>
      <Modal.Body className="text-center pb-4">
        <div 
          className="user-avatar mb-3 mx-auto"
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

        {currentUser.qr_code && (
          <div className="mb-3">
            <h5>Мій QR-код</h5>
            <Image 
              src={currentUser.qr_code} 
              alt="QR Code" 
              style={{ maxWidth: '200px' }} 
              className="mb-2"
            />
            <div className="text-muted small">
              ID: {currentUser.unique_id}
            </div>
          </div>
        )}

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
          <>
            <h4>{currentUser.username}</h4>
            <div className="user-info mt-4">
              <div className="info-item mb-3">
                <div className="text-muted mb-1">Ім'я користувача</div>
                <div>@{currentUser.username}</div>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default ProfileModal; 