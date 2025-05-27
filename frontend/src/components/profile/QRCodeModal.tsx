import React from 'react';
import { Modal, Image, Button, Form } from 'react-bootstrap';
import { QrCode } from 'react-bootstrap-icons';
import { User } from '../../types';

interface QRCodeModalProps {
  show: boolean;
  onHide: () => void;
  user: User;
  currentThemeId: string;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ show, onHide, user, currentThemeId }) => {
  console.log('QRCodeModal user data:', user);

  const handleDownloadQR = () => {
    if (user.qr_code) {
      const link = document.createElement('a');
      link.href = user.qr_code;
      link.download = `qr_code_${user.unique_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Мій QR-код</Modal.Title>
      </Modal.Header>
      <Modal.Body className="text-center">
        {user.qr_code && (
          <>
            {/* Container for QR code image */}
            <div 
              className={`qr-code-container mb-3 ${currentThemeId}`}
              style={{
                 backgroundColor: 'var(--primary-color)', // Use theme primary color (dark purple)
                 padding: '15px', // Increased padding slightly for visual separation
                 borderRadius: '8px'
              }}
            >
              <Image 
                src={user.qr_code} 
                alt="QR Code" 
                style={{ maxWidth: '250px' }} 
                className="img-fluid"
              />
            </div>
            
            <div className="text-muted mb-3">
              ID: {user.unique_id}
            </div>
            <Button 
              variant="primary"
              onClick={handleDownloadQR}
              className="w-100"
            >
              <QrCode className="me-2" />
              Завантажити QR-код
            </Button>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default QRCodeModal; 