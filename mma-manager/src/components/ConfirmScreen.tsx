import { useState } from 'react';
import type { ManagerCharacter } from '../types';
import StatBar from './StatBar';

interface Props {
  manager: ManagerCharacter;
  onConfirm: () => void;
  onBack: () => void;
}

export default function ConfirmScreen({ manager, onConfirm, onBack }: Props) {
  const [imgOk, setImgOk] = useState(true);
  const hasPortrait = manager.portrait && imgOk;

  return (
    <div className="scanlines confirm-screen">
      <div className="confirm-header">YOUR MANAGER</div>

      <div className="confirm-card pixel-border animate-fadeIn">
        {/* Portrait */}
        <div className="confirm-portrait" style={{ background: manager.portraitBg }}>
          {hasPortrait ? (
            <img
              src={manager.portrait}
              alt={manager.name}
              onError={() => setImgOk(false)}
              className="confirm-portrait-img"
            />
          ) : (
            <span style={{ fontSize: 48, color: 'rgba(255,255,255,0.15)' }}>?</span>
          )}
        </div>

        {/* Info */}
        <div className="confirm-info">
          <div className="confirm-name">{manager.name}</div>
          <div className="confirm-title-text">{manager.title}</div>
          <div className="confirm-bio">{manager.bio}</div>

          <div className="confirm-stats">
            <StatBar label="CHARISMA" value={manager.charisma} />
            <StatBar label="NEGOTIATION" value={manager.negotiation} />
            <StatBar label="SCOUTING" value={manager.scouting} />
            <StatBar label="CONNECTIONS" value={manager.connections} />
          </div>
        </div>
      </div>

      <div className="confirm-prompt">READY TO ENTER THE OCTAGON?</div>

      <div className="sel-actions">
        <button className="sel-btn" onClick={onConfirm}>A: BEGIN</button>
        <button className="sel-btn" onClick={onBack}>B: BACK</button>
      </div>
    </div>
  );
}
