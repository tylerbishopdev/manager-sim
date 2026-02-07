import { useState, useCallback } from 'react';
import type { ManagerCharacter } from '../types';
import { presetManagers } from '../data/presets';

interface Props {
  onSelect: (char: ManagerCharacter) => void;
  onCustom: () => void;
  onBack: () => void;
}

export default function CharacterSelect({ onSelect, onCustom, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = presetManagers.find((m) => m.id === selected);

  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const markBroken = useCallback((id: string) =>
    setBrokenImgs((prev) => new Set(prev).add(id)), []);

  const [brokenSprites, setBrokenSprites] = useState<Set<string>>(new Set());
  const markBrokenSprite = useCallback((id: string) =>
    setBrokenSprites((prev) => new Set(prev).add(id)), []);

  /** On mobile, tapping a selected card again confirms it */
  const handleCardTap = (id: string) => {
    if (selected === id) {
      if (id === 'custom') {
        onCustom();
      } else {
        const m = presetManagers.find((p) => p.id === id);
        if (m) onSelect(m);
      }
    } else {
      setSelected(id);
    }
  };

  return (
    <div className="scanlines sel-screen">
      <h1 className="sel-title animate-fadeIn">SELECT YOUR MANAGER</h1>

      {/* Horizontal-scrollable on mobile, flex row on desktop */}
      <div className="sel-row animate-slideUp">
        {presetManagers.map((m) => {
          const active = selected === m.id;
          const hasPortrait = m.portrait && !brokenImgs.has(m.id);
          const hasSprite = m.sprite && !brokenSprites.has(m.id);

          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className={`sel-card${active ? ' active' : ''}`}
              onClick={() => handleCardTap(m.id)}
            >
              <div className="sel-portrait" style={{ background: m.portraitBg }}>
                {hasPortrait ? (
                  <img
                    src={m.portrait}
                    alt={m.name}
                    draggable={false}
                    onError={() => markBroken(m.id)}
                    className="sel-portrait-img"
                  />
                ) : (
                  <div className="sel-portrait-empty">
                    <span className="sel-portrait-silhouette">?</span>
                  </div>
                )}
                {hasSprite && (
                  <img
                    src={m.sprite}
                    alt=""
                    draggable={false}
                    onError={() => markBrokenSprite(m.id)}
                    className="sel-sprite"
                  />
                )}
              </div>
              <div className="sel-name-plate">
                <span className="sel-char-name">{m.name}</span>
              </div>
            </div>
          );
        })}

        {/* Create-a-Player */}
        <div
          role="button"
          tabIndex={0}
          className={`sel-card${selected === 'custom' ? ' active' : ''}`}
          onClick={() => handleCardTap('custom')}
        >
          <div className="sel-portrait" style={{ background: '#1a1a30' }}>
            <div className="sel-portrait-empty">
              <span style={{ fontSize: 40, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: 1, marginTop: 4 }}>CREATE NEW</span>
            </div>
          </div>
          <div className="sel-name-plate">
            <span className="sel-char-name">CREATE-A-PLAYER</span>
          </div>
        </div>
      </div>

      {/* Hint text on mobile when something is selected */}
      {selected && (
        <div className="sel-tap-hint">TAP AGAIN TO CONFIRM</div>
      )}

      {/* Action bar */}
      <div className="sel-actions">
        <button
          className="sel-btn"
          disabled={!selected}
          onClick={() => {
            if (selected === 'custom') onCustom();
            else if (current) onSelect(current);
          }}
        >
          CHOOSE
        </button>
        <button className="sel-btn" onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}
