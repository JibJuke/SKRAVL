import "../styles/TableRoom.css";

/**
 * Displays a conversation prompt in the table room.
 * Used by table creators to set discussion topics for table participants.
 */

const ConversationPrompt = ({ prompt }) => {
  if (!prompt) return null;

  return (
    <div className="conversation-prompt">
      <h3>CONVERSATION PROMPT</h3>
      <p>{prompt}</p>
    </div>
  );
};

export default ConversationPrompt;
