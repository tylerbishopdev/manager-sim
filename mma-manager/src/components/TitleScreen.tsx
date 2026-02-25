import { useState, useEffect, useMemo } from 'react';

interface Props {
  onStart: () => void;
  onAdmin?: () => void;
}

export default function TitleScreen({ onStart, onAdmin }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const menuItems = useMemo(() => [
    { label: 'NEW GAME', action: onStart, enabled: true },
    { label: 'CONTINUE', action: undefined, enabled: false },
    { label: 'GAME BUILDER', action: onAdmin, enabled: !!onAdmin },
  ], [onStart, onAdmin]);

  useEffect(() => {
    const t = setTimeout(() => setShowMenu(true), 1200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!showMenu) return;
      if (e.key === 'ArrowDown') setSelectedIdx((i) => Math.min(i + 1, menuItems.length - 1));
      if (e.key === 'ArrowUp') setSelectedIdx((i) => Math.max(i - 1, 0));
      if (e.key === 'Enter') {
        const item = menuItems[selectedIdx];
        if (item.enabled && item.action) item.action();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [showMenu, selectedIdx, menuItems]);

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
          {menuItems.map((item, i) => (
            <div
              key={item.label}
              role="button"
              tabIndex={0}
              className={`menu-item ${selectedIdx === i ? 'selected' : ''}`}
              onClick={() => {
                setSelectedIdx(i);
                if (item.enabled && item.action) item.action();
              }}
              onMouseEnter={() => setSelectedIdx(i)}
              style={{ opacity: item.enabled ? 1 : 0.4 }}
            >
              {item.label}
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
