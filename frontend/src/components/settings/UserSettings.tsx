import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { getUserSettings, updateUserSettings, UserSettings } from '../../services/api';

const UserSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'light',
    notification_enabled: true,
    message_sound_enabled: true,
    language: 'en'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const userSettings = await getUserSettings();
        setSettings(userSettings);
        setError(null);
      } catch (err) {
        setError('Failed to load settings. Please try again later.');
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      const updatedSettings = await updateUserSettings(settings);
      setSettings(updatedSettings);
      setSaveSuccess(true);
    } catch (err) {
      setError('Failed to save settings. Please try again.');
      console.error('Error saving settings:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading settings...</div>;
  }

  return (
    <Container className="mt-4">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Header as="h4">User Settings</Card.Header>
            <Card.Body>
              {saveSuccess && (
                <Alert variant="success" dismissible onClose={() => setSaveSuccess(false)}>
                  Settings saved successfully!
                </Alert>
              )}
              
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Theme</Form.Label>
                  <Form.Select 
                    name="theme" 
                    value={settings.theme} 
                    onChange={handleChange}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Language</Form.Label>
                  <Form.Select 
                    name="language" 
                    value={settings.language} 
                    onChange={handleChange}
                  >
                    <option value="en">English</option>
                    <option value="uk">Ukrainian</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    id="notification-enabled"
                    label="Enable notifications"
                    name="notification_enabled"
                    checked={settings.notification_enabled}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Check 
                    type="checkbox"
                    id="message-sound-enabled"
                    label="Enable message sounds"
                    name="message_sound_enabled"
                    checked={settings.message_sound_enabled}
                    onChange={handleChange}
                  />
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserSettingsPage;