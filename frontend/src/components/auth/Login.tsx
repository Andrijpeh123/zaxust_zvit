import React, { useState, useEffect } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { login } from '../../services/api';
import { ApiError } from '../../types';
import './Login.css';

interface LocationState {
  message?: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check for success message from registration
    const state = location.state as LocationState;
    if (state && state.message) {
      setSuccessMessage(state.message);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await login(username, password);
      console.log('Login response:', data);

      if (data && data.token) {
        // Зберігаємо токен
        localStorage.setItem('token', data.token);
        
        // Створюємо об'єкт користувача
        const userData = {
          id: username, // Тимчасово використовуємо username як id
          username: username
        };
        
        // Зберігаємо дані користувача
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Встановлюємо заголовок Authorization для майбутніх запитів
        axios.defaults.headers.common['Authorization'] = `Token ${data.token}`;
        
        // Перенаправляємо на сторінку розмов
        navigate('/conversations');
      } else {
        setError('Invalid response from server');
        console.error('Invalid response:', data);
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const apiError = error as ApiError;
        const errorMessage = apiError.response?.data?.detail || 
                           apiError.response?.data?.message || 
                           'Login failed';
        setError(errorMessage);
        console.error('Login error:', error);
      } else {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-login-container">
      <div className="auth-login-card">
        <div className="auth-login-header">
          <h2>Увійти в акаунт</h2>
          <p>Введіть свої дані для входу</p>
        </div>

        {successMessage && <div className="auth-success-message">{successMessage}</div>}
        {error && <div className="auth-error-message">{error}</div>}

        <Form onSubmit={handleSubmit}>
          <Form.Group className="auth-form-group">
            <Form.Label className="auth-form-label">Ім'я користувача</Form.Label>
            <Form.Control
              type="text"
              placeholder="Введіть ім'я користувача"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="auth-form-control"
            />
          </Form.Group>

          <Form.Group className="auth-form-group">
            <Form.Label className="auth-form-label">Пароль</Form.Label>
            <Form.Control
              type="password"
              placeholder="Введіть пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="auth-form-control"
            />
          </Form.Group>

          <Button 
            className="auth-next-step w-100" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Вхід...' : 'Увійти'}
          </Button>

          <div className="auth-text-center mt-3">
            Немає акаунту? <Link to="/register" className="auth-link">Зареєструватися</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Login;