import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col } from 'react-bootstrap';
import './ThemeSettings.css';

const themes = [
  { 
    id: 'classic',
    name: 'Класична',
    colors: {
      primary: '#0088cc',
      background: '#ffffff',
      secondaryBg: '#f8f9fa',
      text: '#000000',
      border: '#dee2e6',
      hover: 'rgba(0, 0, 0, 0.05)',
      messageBg: '#e3f2fd',
      chatBg: '#ffffff'
    }
  },
  { 
    id: 'dark',
    name: 'Темна',
    colors: {
      primary: '#8774e1',
      background: '#17212b',
      secondaryBg: '#242f3d',
      text: '#ffffff',
      border: '#404040',
      hover: 'rgba(255, 255, 255, 0.05)',
      messageBg: '#2b5278',
      chatBg: '#0e1621'
    }
  },
  {
    id: 'midnight',
    name: 'Опівнічна',
    colors: {
      primary: '#7aa2f7',
      background: '#1a1b26',
      secondaryBg: '#24283b',
      text: '#c0caf5',
      border: '#292e42',
      hover: 'rgba(122, 162, 247, 0.1)',
      messageBg: '#414868',
      chatBg: '#1a1b26'
    }
  },
  {
    id: 'discord',
    name: 'Discord',
    colors: {
      primary: '#5865f2',
      background: '#36393f',
      secondaryBg: '#2f3136',
      text: '#dcddde',
      border: '#202225',
      hover: 'rgba(79, 84, 92, 0.16)',
      messageBg: '#40444b',
      chatBg: '#36393f'
    }
  },
  {
    id: 'github',
    name: 'GitHub',
    colors: {
      primary: '#238636',
      background: '#0d1117',
      secondaryBg: '#161b22',
      text: '#c9d1d9',
      border: '#30363d',
      hover: 'rgba(177, 186, 196, 0.12)',
      messageBg: '#30363d',
      chatBg: '#0d1117'
    }
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      primary: '#bd93f9',
      background: '#282a36',
      secondaryBg: '#44475a',
      text: '#f8f8f2',
      border: '#6272a4',
      hover: 'rgba(189, 147, 249, 0.1)',
      messageBg: '#44475a',
      chatBg: '#282a36'
    }
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      primary: '#88c0d0',
      background: '#2e3440',
      secondaryBg: '#3b4252',
      text: '#eceff4',
      border: '#4c566a',
      hover: 'rgba(136, 192, 208, 0.1)',
      messageBg: '#434c5e',
      chatBg: '#2e3440'
    }
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      primary: '#a6e22e',
      background: '#272822',
      secondaryBg: '#3e3d32',
      text: '#f8f8f2',
      border: '#75715e',
      hover: 'rgba(166, 226, 46, 0.1)',
      messageBg: '#3e3d32',
      chatBg: '#272822'
    }
  },
  {
    id: 'material',
    name: 'Material',
    colors: {
      primary: '#82aaff',
      background: '#0F111A',
      secondaryBg: '#191a21',
      text: '#a6accd',
      border: '#1f2233',
      hover: 'rgba(130, 170, 255, 0.1)',
      messageBg: '#191a21',
      chatBg: '#0F111A'
    }
  },
  {
    id: 'catppuccin',
    name: 'Catppuccin',
    colors: {
      primary: '#f5c2e7',
      background: '#1e1e2e',
      secondaryBg: '#302d41',
      text: '#d9e0ee',
      border: '#575268',
      hover: 'rgba(245, 194, 231, 0.1)',
      messageBg: '#302d41',
      chatBg: '#1e1e2e'
    }
  },
  {
    id: 'light',
    name: 'Світла',
    colors: {
      primary: '#1e88e5',
      background: '#ffffff',
      secondaryBg: '#f5f5f5',
      text: '#2c3e50',
      border: '#e0e0e0',
      hover: 'rgba(30, 136, 229, 0.1)',
      messageBg: '#e3f2fd',
      chatBg: '#ffffff'
    }
  },
  {
    id: 'solarized',
    name: 'Solarized',
    colors: {
      primary: '#268bd2',
      background: '#002b36',
      secondaryBg: '#073642',
      text: '#839496',
      border: '#586e75',
      hover: 'rgba(38, 139, 210, 0.1)',
      messageBg: '#073642',
      chatBg: '#002b36'
    }
  }
];

const ThemeSettings: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState(() => 
    localStorage.getItem('theme') || 'classic'
  );

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('theme', themeId);
    
    const theme = themes.find(t => t.id === themeId);
    if (theme) {
      Object.entries(theme.colors).forEach(([key, value]) => {
        document.documentElement.style.setProperty(`--${key}-color`, value);
      });
    }
  };

  useEffect(() => {
    const theme = themes.find(t => t.id === currentTheme);
    if (theme) {
      handleThemeChange(theme.id);
    }
  }, []);

  return (
    <Container className="py-4">
      <h2 className="mb-4">Налаштування теми</h2>
      <Card>
        <Card.Body>
          <Row className="g-4">
            {themes.map(theme => (
              <Col key={theme.id} xs={6} md={4} lg={3}>
                <div 
                  className={`theme-preview ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div 
                    className="preview-content"
                    style={{ 
                      backgroundColor: theme.colors.background,
                      color: theme.colors.text 
                    }}
                  >
                    <div 
                      className="preview-header"
                      style={{ backgroundColor: theme.colors.primary }}
                    />
                    <div 
                      className="preview-sidebar"
                      style={{ backgroundColor: theme.colors.secondaryBg }}
                    />
                    <div className="preview-messages">
                      <div className="preview-message" />
                      <div className="preview-message" />
                    </div>
                  </div>
                  <div className="theme-name mt-2">{theme.name}</div>
                </div>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ThemeSettings; 