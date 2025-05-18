import { useEffect } from "react";
import "../styles/Modal.css";

/**
 * Reusable modal component with customizable content, title and actions.
 * Handles keyboard shortcuts, backdrop clicks, and prevents body scrolling when open.
 */

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  closeButtonText = "Close",
  showCloseButton = true,
  maxWidth = "500px",
  preventBackdropClose = false,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEsc);

    // Prevent body scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={preventBackdropClose ? undefined : onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {title && <h2>{title}</h2>}

        <div className="modal-body">{children}</div>

        {showCloseButton && (
          <button className="close-modal" onClick={onClose}>
            {closeButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default Modal;
