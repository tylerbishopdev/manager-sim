import { useState, useEffect } from 'react';

interface Props {
  onStart: () => void;
}

export default function TitleScreen({ onStart }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowMenu(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showMenu) return;
      if (e.key === 'ArrowDown') setSelectedIdx((i) => Math.min(i + 1, 2));
      if (e.key === 'ArrowUp') setSelectedIdx((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter' && selectedIdx === 0) onStart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showMenu, selectedIdx, onStart]);

  return (
    <div className="scanlines title-screen">
      {/* Octagon background decoration - pointer-events: none via CSS */}
      <div className="title-octagon" />

      {/* Title */}
      <div className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="title-presents">
          &#9733; <span style={{ color: '#d4a017' }}>Not Software</span> PRESENTS &#9733;
        </div>
        <h1 className="title-mma animate-glow">MMA</h1>
        <h2 className="title-manager">MANAGER</h2>
        <div className="title-subtitle">BUILD YOUR EMPIRE</div>
      </div>

      {/* Decorative line */}
      <div className="title-divider" />

      {/* Menu */}
      {showMenu && (
        <div className="animate-slideUp title-menu">
          {['NEW GAME', 'CONTINUE', 'OPTIONS'].map((label, i) => (
            <div
              key={label}
              role="button"
              tabIndex={0}
              className={`menu-item ${selectedIdx === i ? 'selected' : ''}`}
              onClick={() => {
                setSelectedIdx(i);
                if (i === 0) onStart();
              }}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{ opacity: i === 0 ? 1 : 0.4 }}
            >
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Bottom prompt */}
      {showMenu && (
        <div className="title-bottom-prompt animate-pulse-slow">
          PRESS ENTER OR TAP
        </div>
      )}

      {/* Version */}
      <div className="title-version">v0.1.0</div>
    </div>
  );
}
