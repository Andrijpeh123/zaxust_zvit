import React from 'react';
import { Modal, Image, Button } from 'react-bootstrap';
import { QrCode } from 'react-bootstrap-icons';
import { User } from '../../types';

interface QRCodeModalProps {
  show: boolean;
  onHide: () => void;
  user: User;
}

const QRCodeModal: React.FC<QRCodeModalProps> = ({ show, onHide, user }) => {
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
            <Image 
              src={user.qr_code} 
              alt="QR Code" 
              style={{ maxWidth: '250px' }} 
              className="mb-3"
            />
            <div className="text-muted mb-3">
              ID: {user.unique_id}
            </div>
            <Button 
              variant="outline-primary" 
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