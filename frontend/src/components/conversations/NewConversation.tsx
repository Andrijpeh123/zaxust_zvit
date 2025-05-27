import React, { useEffect, useState } from 'react';
import { Form, Button, Card, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { getUsers, startConversation } from '../../services/api';
import { User, Conversation } from '../../types';
import './NewConversation.css';

interface NewConversationProps {
  onConversationCreated: (conversation: Conversation) => void;
  onCancel: () => void;
}

const NewConversation: React.FC<NewConversationProps> = ({ onConversationCreated, onCancel }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        // Filter out current user
        const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
        setUsers(data.filter(user => user.id !== currentUserId));
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUsers.length === 0) return;

    setCreating(true);
    setError('');
    try {
      const newConversation = await startConversation(selectedUsers);
      onConversationCreated(newConversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation. Please try again.');
      setCreating(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Card className="mb-4 shadow-sm">
      <Card.Header className="bg-primary text-white">
        <h5 className="mb-0">New Conversation</h5>
      </Card.Header>
      <Card.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Search Users</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by name or username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </Form.Group>

          {selectedUsers.length > 0 && (
            <div className="mb-3">
              <div className="d-flex flex-wrap gap-2 align-items-center">
                <span>Selected: </span>
                {selectedUsers.map(userId => {
                  const user = users.find(u => u.id === userId);
                  return user ? (
                    <Badge 
                      key={userId} 
                      bg="primary" 
                      className="d-flex align-items-center p-2"
                    >
                      {user.username}
                      <Button 
                        variant="link" 
                        className="p-0 ms-2 text-white" 
                        onClick={() => handleUserSelect(userId)}
                        style={{ fontSize: '0.8rem' }}
                      >
                        ×
                      </Button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading users...</span>
              </Spinner>
              <p className="mt-2">Loading users...</p>
            </div>
          ) : (
            <>
              <div className="mb-3">Select users to start a conversation:</div>
              <ListGroup className="mb-3" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {filteredUsers.length === 0 ? (
                  <ListGroup.Item className="text-center py-3">
                    {searchTerm ? 'No users found matching your search' : 'No users available'}
                  </ListGroup.Item>
                ) : (
                  filteredUsers.map(user => (
                    <ListGroup.Item 
                      key={user.id} 
                      action 
                      active={selectedUsers.includes(user.id)}
                      onClick={() => handleUserSelect(user.id)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{user.username}</strong>
                        {(user.first_name || user.last_name) && (
                          <div className="text-muted small">
                            {user.first_name} {user.last_name}
                          </div>
                        )}
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <i className="bi bi-check-circle-fill text-success"></i>
                      )}
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </>
          )}

          <div className="d-flex justify-content-end">
            <Button variant="secondary" onClick={onCancel} className="me-2" disabled={creating}>
              Cancel
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={creating || selectedUsers.length === 0}
            >
              {creating ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Creating...
                </>
              ) : 'Start Conversation'}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default NewConversation;