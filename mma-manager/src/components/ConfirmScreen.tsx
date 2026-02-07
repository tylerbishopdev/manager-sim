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
    <div className="scanlines" style={{
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a1a 70%)',
      gap: 16,
    }}>
      <div style={{ fontSize: 10, color: '#888', letterSpacing: 4 }}>
        YOUR MANAGER
      </div>

      <div className="pixel-border animate-fadeIn" style={{
        padding: 24,
        background: '#12122a',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16,
        minWidth: 320,
      }}>
        {/* Portrait */}
        <div style={{
          width: 200, height: 250,
          background: manager.portraitBg,
          border: '3px solid #4a6fb0',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {hasPortrait ? (
            <img
              src={manager.portrait}
              alt={manager.name}
              onError={() => setImgOk(false)}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: 48, color: 'rgba(255,255,255,0.15)' }}>?</span>
          )}
        </div>

        {/* Name */}
        <div style={{
          fontSize: 14, color: '#f0d060', letterSpacing: 4,
          textShadow: '0 2px 0 #000, 0 0 20px rgba(212,160,23,0.3)',
        }}>
          {manager.name}
        </div>

        <div style={{ fontSize: 9, color: '#8899aa', letterSpacing: 2 }}>
          {manager.title}
        </div>

        {/* Bio */}
        <div style={{ fontSize: 8, color: '#888', textAlign: 'center', lineHeight: 1.8, maxWidth: 260 }}>
          {manager.bio}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
          <StatBar label="CHARISMA" value={manager.charisma} />
          <StatBar label="NEGOTIATION" value={manager.negotiation} />
          <StatBar label="SCOUTING" value={manager.scouting} />
          <StatBar label="CONNECTIONS" value={manager.connections} />
        </div>
      </div>

      <div style={{ fontSize: 9, color: '#555', letterSpacing: 2, textAlign: 'center' }}>
        READY TO ENTER THE OCTAGON?
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button className="btn-outline" onClick={onBack}>◀ BACK</button>
        <button className="btn-gold" onClick={onConfirm}>BEGIN ▶</button>
      </div>
    </div>
  );
}
