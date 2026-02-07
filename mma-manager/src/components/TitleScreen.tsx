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
    <div className="scanlines" style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 70%)',
    }}>
      {/* Octagon background decoration */}
      <div style={{
        position: 'absolute',
        width: 300, height: 300,
        opacity: 0.06,
        border: '4px solid #d4a017',
        transform: 'rotate(22.5deg)',
        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
      }} />

      {/* Title */}
      <div className="animate-fadeIn" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{
          fontSize: 12, color: '#888', letterSpacing: 6,
          marginBottom: 16,
        }}>
          ★<span style={{ fontStyle: 'monospace', color: '#d4a017', fontSize: 10 }}> Not Software </span> PRESENTS ★
        </div>
        <h1 className="animate-glow" style={{
          fontSize: 36, color: '#d4a017',
          textShadow: '0 0 30px rgba(212,160,23,0.4), 0 4px 0 #8b6914',
          lineHeight: 1.2,
        }}>
          MMA
        </h1>
        <h2 style={{
          fontSize: 20, color: '#f0d060',
          letterSpacing: 8,
          textShadow: '0 0 20px rgba(240,208,96,0.3)',
        }}>
          MANAGER
        </h2>
        <div style={{
          fontSize: 8, color: '#555', marginTop: 8,
          letterSpacing: 4,
        }}>
          BUILD YOUR EMPIRE
        </div>
      </div>

      {/* Decorative line */}
      <div style={{
        width: 200, height: 2, margin: '20px 0',
        background: 'linear-gradient(90deg, transparent, #d4a017, transparent)',
      }} />

      {/* Menu */}
      {showMenu && (
        <div className="animate-slideUp" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 260 }}>
          {['NEW GAME', 'CONTINUE', 'OPTIONS'].map((label, i) => (
            <div
              key={label}
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
        <div className="animate-pulse-slow" style={{
          position: 'absolute', bottom: 40,
          fontSize: 9, color: '#555', letterSpacing: 3,
        }}>
          PRESS ENTER OR CLICK
        </div>
      )}

      {/* Version */}
      <div style={{
        position: 'absolute', bottom: 12, right: 16,
        fontSize: 7, color: '#333',
      }}>
        v0.1.0
      </div>
    </div>
  );
}
