import React, { useState } from 'react';
import { Modal, Form, Button, Image } from 'react-bootstrap';
import { ThreeDotsVertical, CameraFill } from 'react-bootstrap-icons';
import { User } from '../../types';
import { getAvatarColor, getInitials } from '../../utils/avatarUtils';

interface ProfileModalProps {
  show: boolean;
  onHide: () => void;
  currentUser: User;
  theme: string;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ show, onHide, currentUser }) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header>
        <Modal.Title>Про користувача</Modal.Title>
        <div className="d-flex align-items-center">
          <ThreeDotsVertical
            size={20}
            className="cursor-pointer me-2"
          />
          <button
            type="button"
            className="btn-close"
            onClick={onHide}
          />
        </div>
      </Modal.Header>
      <Modal.Body className="text-center pb-4">
        {/* Container for avatar and camera icon */}
        <div style={{ position: 'relative', display: 'inline-block' }}>
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
            {currentUser.avatar ? (
              <Image src={currentUser.avatar} roundedCircle style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              getInitials(currentUser.username)
            )}
          </div>
          {/* Camera Icon */}
          <CameraFill
            size={24}
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: 'white', // Add background for visibility
              borderRadius: '50%',
              padding: '4px',
              border: '1px solid #ccc' // Add border
            }}
          />
        </div>

        <div className="mb-3">
          <h5>Мій QR-код\</h5>
          {currentUser.qr_code && (
             <Image
              src={currentUser.qr_code}
              alt="QR Code"
              style={{ maxWidth: '150px' }}
              className="mb-2"
            />
          )}

          <Button
            variant="outline-primary"
          >
            Показати QR-код
          </Button>
        </div>

        <div className="mb-3">{currentUser.unique_id || '1111'}</div>

        <div className="user-info mt-4 text-start">
          <div className="info-item mb-3">
            <div className="text-muted mb-1">Ім'я користувача</div>
            <div>@{currentUser.username}</div>
          </div>
          <div className="info-item mb-3">
            <div className="text-muted mb-1">Активність</div>
            <div>недавно</div>
          </div>
        </div>

      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between align-items-center">
        <span>Сповіщення</span>
        <Form.Check
          type="switch"
          id="notification-switch"
        />
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileModal; 