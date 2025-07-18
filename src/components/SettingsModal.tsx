import React from 'react';
import { createPortal } from 'react-dom';

interface SettingsModalProps {
  settingsModalOpen: boolean;
  keyboardPosition: 'left' | 'right';
  setKeyboardPosition: (position: 'left' | 'right') => void;
  setSettingsModalOpen: (open: boolean) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  settingsModalOpen,
  keyboardPosition,
  setKeyboardPosition,
  setSettingsModalOpen,
}) => {
  if (!settingsModalOpen) return null;

  const modalContent = (
    <div className="settings-modal">
      <div className="settings-modal-content">
        <h2>Settings</h2>

        <div className="settings-section">
          <h3>Difficulty</h3>
          <div className="difficulty-toggle">
            <label className="difficulty-option">
              <input
                type="radio"
                name="difficulty"
                value="easy"
                checked={false}
                disabled
              />
              <span className="difficulty-label">Easy</span>
              <span className="difficulty-description">
                Shows arrows for misplaced numbers (Coming Soon)
              </span>
            </label>
            <label className="difficulty-option">
              <input
                type="radio"
                name="difficulty"
                value="hard"
                checked={true}
                disabled
              />
              <span className="difficulty-label">Hard</span>
              <span className="difficulty-description">
                No arrows - pure logic puzzle
              </span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Keyboard Position</h3>
          <div className="difficulty-toggle">
            <label className="difficulty-option">
              <input
                type="radio"
                name="keyboardPosition"
                value="left"
                checked={keyboardPosition === 'left'}
                onChange={e =>
                  setKeyboardPosition(e.target.value as 'left' | 'right')
                }
              />
              <span className="difficulty-label">Left</span>
              <span className="difficulty-description">
                Keyboard appears on the left side
              </span>
            </label>
            <label className="difficulty-option">
              <input
                type="radio"
                name="keyboardPosition"
                value="right"
                checked={keyboardPosition === 'right'}
                onChange={e =>
                  setKeyboardPosition(e.target.value as 'left' | 'right')
                }
              />
              <span className="difficulty-label">Right</span>
              <span className="difficulty-description">
                Keyboard appears on the right side
              </span>
            </label>
          </div>
        </div>

        <div className="settings-version">
          Version 0.1.0 • Made by{' '}
          <a
            href="https://github.com/henryjburg"
            target="_blank"
            rel="noopener noreferrer"
          >
            @henryjburg
          </a>
        </div>

        <div className="settings-modal-buttons">
          <button
            className="settings-modal-btn primary"
            onClick={() => setSettingsModalOpen(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default SettingsModal;
