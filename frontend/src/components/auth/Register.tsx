import React, { useState } from 'react';
import { Form, Button, Container, Row, Col, Card, Alert, Image } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import './Register.css';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateFirstStep = () => {
    if (!username || !email || !password) {
      setError('Будь ласка, заповніть всі обов\'язкові поля');
      return false;
    }
    
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateFirstStep()) {
      setError(null);
      setStep(2);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await register(username, email, password, avatarFile || undefined);
      navigate('/login', { state: { message: 'Реєстрація успішна! Будь ласка, увійдіть.' } });
    } catch (err: any) {
      console.error('Помилка реєстрації:', err);
      setError(err.response?.data?.message || 'Помилка реєстрації. Спробуйте ще раз.');
    } finally {
      setLoading(false);
    }
  };

  const skipAvatar = () => {
    handleSubmit(new Event('submit') as any);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-steps">
          <div className={`step-indicator ${step === 1 ? 'active' : ''} ${step === 2 ? 'completed' : ''}`}>1</div>
          <div className={`step-indicator ${step === 2 ? 'active' : ''}`}>2</div>
        </div>

        <div className="register-header">
          <h2>{step === 1 ? 'Створити акаунт' : 'Додати аватар'}</h2>
          <p>{step === 1 ? 'Введіть свої дані для реєстрації' : 'Завантажте фото профілю'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className={`register-step ${step === 1 ? 'active' : ''}`}>
          <Form>
            <Form.Group className="form-group">
              <Form.Label>Ім'я користувача</Form.Label>
              <Form.Control
                type="text"
                placeholder="Введіть ім'я користувача"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Введіть email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <Form.Label>Пароль</Form.Label>
              <Form.Control
                type="password"
                placeholder="Введіть пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <Form.Label>Підтвердження паролю</Form.Label>
              <Form.Control
                type="password"
                placeholder="Підтвердіть пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button 
              className="next-step w-100" 
              onClick={handleNextStep}
              disabled={loading}
            >
              Далі <FontAwesomeIcon icon={faArrowRight} />
            </Button>
          </Form>
        </div>

        <div className={`register-step ${step === 2 ? 'active' : ''}`}>
          <div className="avatar-upload">
            <div className="avatar-preview">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" />
              ) : (
                <FontAwesomeIcon icon={faUser} className="placeholder" />
              )}
            </div>

            <label className="avatar-upload-btn">
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: 'none' }}
              />
              Завантажити фото
            </label>

            <button className="skip-avatar" onClick={skipAvatar}>
              Пропустити цей крок
            </button>
          </div>

          <div className="step-buttons">
            <button className="prev-step" onClick={handlePrevStep}>
              <FontAwesomeIcon icon={faArrowLeft} /> Назад
            </button>
            <button 
              className="next-step" 
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Реєстрація...' : 'Завершити реєстрацію'}
            </button>
          </div>
        </div>

        <div className="text-center mt-3">
          Вже маєте акаунт? <Link to="/login">Увійти</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;