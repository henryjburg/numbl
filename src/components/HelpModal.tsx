import React from 'react';

interface HelpModalProps {
  helpModalOpen: boolean;
  helpPage: number;
  helpPages: Array<{ title: string; content: React.ReactNode }>;
  handleHelpPageChange: (newPage: number) => void;
  handleHelpClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({
  helpModalOpen,
  helpPage,
  helpPages,
  handleHelpPageChange,
  handleHelpClose,
}) => {
  if (!helpModalOpen) return null;

  return (
    <div className="settings-modal">
      <div className="settings-modal-content">
        <div className="help-header">
          <h2>How to Play</h2>
        </div>

        <div className="help-content">{helpPages[helpPage].content}</div>

        <div className="help-pagination">
          <button
            className="help-nav-btn"
            onClick={() => handleHelpPageChange(helpPage - 1)}
            disabled={helpPage === 0}
          >
            ←
          </button>
          <div className="help-dots">
            {helpPages.map((_, index) => (
              <button
                key={index}
                className={`help-dot ${index === helpPage ? 'active' : ''}`}
                onClick={() => handleHelpPageChange(index)}
              />
            ))}
          </div>
          <button
            className="help-nav-btn"
            onClick={() => handleHelpPageChange(helpPage + 1)}
            disabled={helpPage === helpPages.length - 1}
          >
            →
          </button>
        </div>

        <div className="settings-modal-buttons">
          <button
            className="settings-modal-btn primary"
            onClick={handleHelpClose}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
