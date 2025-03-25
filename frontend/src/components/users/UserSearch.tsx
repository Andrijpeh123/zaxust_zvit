import React, { useState } from 'react';
import { Form, Button, ListGroup, Image, Alert } from 'react-bootstrap';
import { User } from '../../types';
import { searchUsers } from '../../services/api';
import { generateColorFromUsername, getInitial } from '../../utils/avatarUtils';

interface UserSearchProps {
  onUserSelect: (user: User) => void;
}

const UserSearch: React.FC<UserSearchProps> = ({ onUserSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsSearching(true);
    setError(null);
    try {
      const results = await searchUsers(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="user-search">
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Form onSubmit={handleSearch}>
        <Form.Group className="mb-3">
          <Form.Label>Find users by ID or username</Form.Label>
          <div className="d-flex">
            <Form.Control
              type="text"
              placeholder="Enter user ID or username"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button 
              variant="primary" 
              type="submit" 
              className="ms-2"
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </Form.Group>
      </Form>

      {searchResults.length > 0 ? (
        <ListGroup className="mt-3">
          {searchResults.map(user => (
            <ListGroup.Item 
              key={user.id}
              action
              onClick={() => onUserSelect(user)}
              className="d-flex align-items-center"
            >
              {user.avatar ? (
                <Image 
                  src={user.avatar} 
                  roundedCircle 
                  width={40} 
                  height={40} 
                  className="me-3"
                />
              ) : (
                <div 
                  className="initial-avatar me-3"
                  style={{ 
                    backgroundColor: generateColorFromUsername(user.username),
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                >
                  {getInitial(user.username)}
                </div>
              )}
              <div>
                <div className="fw-bold">{user.username}</div>
                {user.unique_id && <div className="text-muted small">ID: {user.unique_id}</div>}
                {(user.first_name || user.last_name) && (
                  <div className="text-muted small">
                    {user.first_name} {user.last_name}
                  </div>
                )}
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      ) : searchTerm && !isSearching ? (
        <div className="text-center mt-3">No users found</div>
      ) : null}
    </div>
  );
};

export default UserSearch;