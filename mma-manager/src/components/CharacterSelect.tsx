import { useState, useCallback } from 'react';
import type { ManagerCharacter } from '../types';
import { presetManagers } from '../data/presets';

interface Props {
  onSelect: (char: ManagerCharacter) => void;
  onCustom: () => void;
  onBack: () => void;
}

/** All choosable options: presets + custom slot */
const allOptions = [
  ...presetManagers,
  {
    id: 'custom',
    name: 'CREATE-A-PLAYER',
    title: '',
    bio: '',
    preset: false,
    portraitBg: '#1a1a30',
    accentColor: '#d4a017',
    portrait: undefined,
    sprite: undefined,
    charisma: 7,
    negotiation: 7,
    scouting: 7,
    connections: 7,
  } as ManagerCharacter,
];

export default function CharacterSelect({ onSelect, onCustom, onBack }: Props) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = allOptions[selectedIdx];

  const [brokenImgs, setBrokenImgs] = useState<Set<string>>(new Set());
  const markBroken = useCallback(
    (id: string) => setBrokenImgs((prev) => new Set(prev).add(id)),
    [],
  );

  const prev = () => setSelectedIdx((i) => (i - 1 + allOptions.length) % allOptions.length);
  const next = () => setSelectedIdx((i) => (i + 1) % allOptions.length);

  const confirm = () => {
    if (selected.id === 'custom') onCustom();
    else onSelect(selected);
  };

  const isCustom = selected.id === 'custom';
  const hasPortrait = !isCustom && selected.portrait && !brokenImgs.has(selected.id);

  return (
    <div className="scanlines sel-screen">
      <h1 className="sel-title animate-fadeIn">SELECT YOUR MANAGER</h1>

      {/* ── Desktop: all cards in a row ── */}
      <div className="sel-row sel-row-desktop animate-slideUp">
        {allOptions.map((m, i) => {
          const active = selectedIdx === i;
          const portrait = m.id !== 'custom' && m.portrait && !brokenImgs.has(m.id);

          return (
            <div
              key={m.id}
              role="button"
              tabIndex={0}
              className={`sel-card${active ? ' active' : ''}`}
              onClick={() => { setSelectedIdx(i); }}
              onDoubleClick={confirm}
            >
              <div className="sel-portrait" style={{ background: m.portraitBg }}>
                {portrait ? (
                  <img
                    src={m.portrait}
                    alt={m.name}
                    draggable={false}
                    onError={() => markBroken(m.id)}
                    className="sel-portrait-img"
                  />
                ) : (
                  <div className="sel-portrait-empty">
                    {m.id === 'custom' ? (
                      <>
                        <span className="sel-create-plus">+</span>
                        <span className="sel-create-label">CREATE NEW</span>
                      </>
                    ) : (
                      <span className="sel-portrait-silhouette">?</span>
                    )}
                  </div>
                )}
              </div>
              <div className="sel-name-plate">
                <span className="sel-char-name">{m.name}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Mobile: single card with arrows ── */}
      <div className="sel-mobile-carousel animate-slideUp">
        <button className="sel-arrow sel-arrow-left" onClick={prev} aria-label="Previous">
          ◀
        </button>

        <div className="sel-card active">
          <div className="sel-portrait" style={{ background: selected.portraitBg }}>
            {hasPortrait ? (
              <img
                src={selected.portrait}
                alt={selected.name}
                draggable={false}
                onError={() => markBroken(selected.id)}
                className="sel-portrait-img"
              />
            ) : (
              <div className="sel-portrait-empty">
                {isCustom ? (
                  <>
                    <span className="sel-create-plus">+</span>
                    <span className="sel-create-label">CREATE NEW</span>
                  </>
                ) : (
                  <span className="sel-portrait-silhouette">?</span>
                )}
              </div>
            )}
          </div>
          <div className="sel-name-plate">
            <span className="sel-char-name">{selected.name}</span>
          </div>
        </div>

        <button className="sel-arrow sel-arrow-right" onClick={next} aria-label="Next">
          ▶
        </button>
      </div>

      {/* Dots indicator (mobile) */}
      <div className="sel-dots">
        {allOptions.map((_, i) => (
          <span
            key={i}
            className={`sel-dot${selectedIdx === i ? ' active' : ''}`}
            onClick={() => setSelectedIdx(i)}
          />
        ))}
      </div>

      {/* Action bar */}
      <div className="sel-actions">
        <button className="sel-btn" onClick={confirm}>
          CHOOSE
        </button>
        <button className="sel-btn" onClick={onBack}>BACK</button>
      </div>
    </div>
  );
}
