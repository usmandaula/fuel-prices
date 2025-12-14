import React from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';

interface DarkModeToggleProps {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const DarkModeToggle: React.FC<DarkModeToggleProps> = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <button
      className="dark-mode-toggle"
      onClick={toggleDarkMode}
      aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className="toggle-track">
        <div className={`toggle-thumb ${isDarkMode ? 'dark' : 'light'}`}>
          {isDarkMode ? (
            <FaMoon className="toggle-icon" />
          ) : (
            <FaSun className="toggle-icon" />
          )}
        </div>
      </div>
      <span className="toggle-label">
        {isDarkMode ? 'Dark' : 'Light'}
      </span>
    </button>
  );
};

export default DarkModeToggle;