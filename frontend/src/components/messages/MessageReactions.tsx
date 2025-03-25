import React from 'react';
import { Button, OverlayTrigger, Popover, Badge } from 'react-bootstrap';
import { addReaction, removeReaction } from '../../services/api';
import { Reaction } from '../../types';

interface MessageReactionsProps {
  messageId: number;
  reactions: Reaction[];
  onReactionUpdate: (messageId: number, updatedReactions: Reaction[]) => void;
  showEmojiPicker: boolean;
  onEmojiPickerClose: () => void;
}

const EMOJI_OPTIONS = ['👍', '❤️', '😂', '😮', '😢', '👏', '🔥', '🎉'];

const MessageReactions: React.FC<MessageReactionsProps> = ({ 
  messageId, 
  reactions, 
  onReactionUpdate,
  showEmojiPicker,
  onEmojiPickerClose
}) => {
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const handleAddReaction = async (emoji: string) => {
    try {
      const newReaction = await addReaction(messageId, emoji);
      const updatedReactions = [...reactions, newReaction];
      onReactionUpdate(messageId, updatedReactions);
      onEmojiPickerClose();
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleRemoveReaction = async (reactionId: number) => {
    try {
      await removeReaction(messageId, reactionId);
      const updatedReactions = reactions.filter(r => r.id !== reactionId);
      onReactionUpdate(messageId, updatedReactions);
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  };
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, Reaction[]>);

  const emojiPicker = (
    <Popover id={`emoji-picker-${messageId}`}>
      <Popover.Body className="d-flex flex-wrap gap-2">
        {EMOJI_OPTIONS.map(emoji => (
          <Button 
            key={emoji} 
            variant="light" 
            size="sm" 
            onClick={() => handleAddReaction(emoji)}
            className="emoji-btn"
          >
            {emoji}
          </Button>
        ))}
      </Popover.Body>
    </Popover>
  );

  return (
    <div className="message-reactions">
      {showEmojiPicker && (
        <div className="d-flex flex-wrap gap-2 mb-2">
          {EMOJI_OPTIONS.map(emoji => (
            <Button 
              key={emoji} 
              variant="light" 
              size="sm" 
              onClick={() => handleAddReaction(emoji)}
              className="emoji-btn"
            >
              {emoji}
            </Button>
          ))}
        </div>
      )}
      
      <div className="d-flex flex-wrap gap-1 mb-1">
        {Object.entries(groupedReactions).map(([emoji, reactors]) => {
          const userReaction = reactors.find(r => r.user_id === currentUser.id);
          return (
            <OverlayTrigger
              key={emoji}
              placement="top"
              overlay={
                <Popover id={`reaction-users-${emoji}`}>
                  <Popover.Body>
                    {reactors.map(r => (
                      <div key={r.id}>{r.username}</div>
                    ))}
                  </Popover.Body>
                </Popover>
              }
            >
              <Badge 
                bg={userReaction ? "primary" : "light"} 
                text={userReaction ? "white" : "dark"}
                className="d-flex align-items-center p-2 reaction-badge"
                onClick={() => userReaction ? handleRemoveReaction(userReaction.id) : null}
                style={{ cursor: userReaction ? 'pointer' : 'default' }}
              >
                {emoji} {reactors.length}
              </Badge>
            </OverlayTrigger>
          );
        })}
      </div>
    </div>
  );
};

export default MessageReactions;