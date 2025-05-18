import { useState } from "react";
import "../styles/Modal.css";

/**
 * Form for creating or editing conversation prompts in the table room.
 * Includes character limit counter and validation for empty submissions.
 */

const PromptForm = ({ initialValue = "", onSubmit, isLoading = false }) => {
  const [promptText, setPromptText] = useState(initialValue);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(promptText);
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <textarea
        id="promptTextarea"
        name="promptText"
        placeholder="Enter a conversation prompt for the table..."
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        maxLength={200}
        autoFocus
      />
      <div className="character-count">{promptText.length}/200 characters</div>
      <div className="modal-actions">
        <button
          type="submit"
          className="submit-button"
          disabled={!promptText.trim() || isLoading}
        >
          {isLoading ? "Submitting..." : "Set Prompt"}
        </button>
      </div>
    </form>
  );
};

export default PromptForm;
