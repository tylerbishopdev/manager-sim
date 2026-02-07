import { useState } from 'react';
import type { ManagerCharacter } from '../types';
import { presetManagers } from '../data/presets';

interface Props {
  onSelect: (char: ManagerCharacter) => void;
  onCustom: () => void;
  onBack: () => void;
}

/**
 * Arcade-style "Select Your Manager" screen.
 *
 * Layout matches the reference: big portrait cards in a row,
 * character name plate underneath, action bar at bottom.
 * Portraits load from public/portraits/{id}.png.
 * When the image is missing a clean placeholder is shown.
 */
export default function CharacterSelect({ onSelect, onCustom, onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const current = presetManagers.find((m) => m.id === selected);

  /** Image error tracker so we can fall back gracefully */
  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const markBroken = (id: string) =>
    setBrokenImgs((prev) => new Set(prev).add(id));

  const [brokenSprites, setBrokenSprites] = useState<Set<string>>(new Set());
  const markBrokenSprite = (id: string) =>
    setBrokenSprites((prev) => new Set(prev).add(id));

  return (
    <div className="scanlines sel-screen">
      {/* ── Title ── */}
      <h1 className="sel-title animate-fadeIn">SELECT YOUR MANAGER</h1>

      {/* ── Cards ── */}
      <div className="sel-row animate-slideUp">
        {presetManagers.map((m) => {
          const active = selected === m.id;
          const hasPortrait = m.portrait && !brokenImgs.has(m.id);
          const hasSprite = m.sprite && !brokenSprites.has(m.id);

          return (
            <div
              key={m.id}
              className={`sel-card${active ? ' active' : ''}`}
              onClick={() => setSelected(m.id)}
            >
              {/* Portrait */}
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

                {/* Sprite overlay at bottom-left */}
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

              {/* Name plate */}
              <div className="sel-name-plate">
                <span className="sel-char-name">{m.name}</span>
              </div>
            </div>
          );
        })}

        {/* ── Create-a-Player card ── */}
        <div
          className={`sel-card${selected === 'custom' ? ' active' : ''}`}
          onClick={() => setSelected('custom')}
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

      {/* ── Action bar ── */}
      <div className="sel-actions">
        <button
          className="sel-btn"
          disabled={!selected}
          onClick={() => {
            if (selected === 'custom') {
              onCustom();
            } else if (current) {
              onSelect(current);
            }
          }}
        >
          A: CHOOSE
        </button>
        <button className="sel-btn" onClick={onBack}>
          B: BACK
        </button>
      </div>
    </div>
  );
}
