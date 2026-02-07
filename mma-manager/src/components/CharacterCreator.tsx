import { useState } from 'react';
import type { ManagerCharacter } from '../types';
import { customPortraits } from '../data/customPortraits';
import StatBar from './StatBar';

interface Props {
  onConfirm: (char: ManagerCharacter) => void;
  onBack: () => void;
}

export default function CharacterCreator({ onConfirm, onBack }: Props) {
  const [selectedPortrait, setSelectedPortrait] = useState(customPortraits[0]);
  const [name, setName] = useState('');

  // Stat allocation: 20 points across 4 stats, each 1–10
  const [stats, setStats] = useState({
    charisma: 5,
    negotiation: 5,
    scouting: 5,
    connections: 5,
  });
  const totalPoints = 20;
  const usedPoints = stats.charisma + stats.negotiation + stats.scouting + stats.connections;
  const remaining = totalPoints - usedPoints;

  const adjustStat = (stat: keyof typeof stats, delta: number) => {
    const newVal = stats[stat] + delta;
    if (newVal < 1 || newVal > 10) return;
    if (delta > 0 && remaining <= 0) return;
    setStats({ ...stats, [stat]: newVal });
  };

  const handleConfirm = () => {
    const char: ManagerCharacter = {
      id: 'custom-' + Date.now(),
      name: name.toUpperCase() || 'THE ROOKIE',
      title: 'THE ROOKIE',
      bio: 'A fresh face in the MMA management world.',
      preset: false,
      portraitBg: '#2244cc',
      accentColor: '#d4a017',
      portrait: selectedPortrait.src,
      ...stats,
    };
    onConfirm(char);
  };

  return (
    <div className="scanlines create-screen">
      {/* ── Title ── */}
      <h1 className="create-title animate-fadeIn">CREATE-A-PLAYER</h1>

      {/* ── Main content ── */}
      <div className="create-body animate-slideUp">

        {/* Left: big portrait preview + name + stats */}
        <div className="create-left">
          <div className="create-portrait-frame">
            <img
              src={selectedPortrait.src}
              alt={selectedPortrait.label}
              draggable={false}
              className="create-portrait-img"
            />
          </div>

          {/* Name input */}
          <div className="create-section" style={{ width: '100%' }}>
            <div className="create-label">MANAGER NAME</div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 16))}
              placeholder="Enter name..."
              maxLength={16}
              className="create-input"
              onFocus={(e) => (e.target.style.borderColor = '#d4a017')}
              onBlur={(e) => (e.target.style.borderColor = '#3a5a90')}
            />
            <div className="create-hint">{name.length}/16</div>
          </div>

          {/* Stats */}
          <div className="create-section" style={{ width: '100%' }}>
            <div className="create-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>STATS</span>
              <span style={{ color: remaining > 0 ? '#f0d060' : '#556' }}>
                {remaining} PTS LEFT
              </span>
            </div>
            {(Object.keys(stats) as (keyof typeof stats)[]).map((stat) => (
              <div key={stat} className="create-stat-row">
                <button className="create-stat-btn" onClick={() => adjustStat(stat, -1)}>−</button>
                <div style={{ flex: 1 }}>
                  <StatBar label={stat.toUpperCase()} value={stats[stat]} />
                </div>
                <button className="create-stat-btn" onClick={() => adjustStat(stat, 1)}>+</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: portrait picker grid */}
        <div className="create-right">
          <div className="create-label">CHOOSE YOUR LOOK</div>
          <div className="create-picker-grid">
            {customPortraits.map((p) => (
              <div
                key={p.id}
                className={`create-thumb${selectedPortrait.id === p.id ? ' active' : ''}`}
                onClick={() => setSelectedPortrait(p)}
              >
                <img src={p.src} alt={p.label} draggable={false} />
                <span className="create-thumb-label">{p.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="sel-actions">
        <button className="sel-btn" onClick={handleConfirm}>A: CONFIRM</button>
        <button className="sel-btn" onClick={onBack}>B: BACK</button>
      </div>
    </div>
  );
}
