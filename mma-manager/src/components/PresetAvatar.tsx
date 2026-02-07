/** Renders a distinct pixel-art avatar for each preset manager */
export default function PresetAvatar({ id, size = 120 }: { id: string; size?: number }) {
  const configs: Record<string, { skin: string; hair: string; outfit: string; accent: string; eyeStyle: string; feature: string }> = {
    vince: { skin: '#f5d0a9', hair: '#888', outfit: '#2c3e50', accent: '#ecf0f1', eyeStyle: 'narrow', feature: 'cigar' },
    maya: { skin: '#c68642', hair: '#1a1a1a', outfit: '#8e44ad', accent: '#f1c40f', eyeStyle: 'almond', feature: 'ponytail' },
    dre: { skin: '#8d5524', hair: '#1a1a1a', outfit: '#e74c3c', accent: '#f1c40f', eyeStyle: 'round', feature: 'chain' },
    yuki: { skin: '#f5d0a9', hair: '#1a1a1a', outfit: '#3498db', accent: '#ecf0f1', eyeStyle: 'narrow', feature: 'glasses' },
    elena: { skin: '#f5d0a9', hair: '#d4a017', outfit: '#c0392b', accent: '#ecf0f1', eyeStyle: 'wide', feature: 'earrings' },
  };

  const c = configs[id] || configs.vince;
  const darker = darken(c.skin, 25);

  return (
    <svg width={size} height={size} viewBox="0 0 64 80" style={{ imageRendering: 'pixelated' }}>
      {/* Body */}
      <rect x="16" y="44" width="32" height="28" fill={c.outfit} />
      <rect x="24" y="44" width="16" height="4" fill={c.accent} />

      {/* Neck */}
      <rect x="27" y="40" width="10" height="6" fill={c.skin} />

      {/* Head */}
      <ellipse cx="32" cy="28" rx="14" ry="16" fill={c.skin} />
      <ellipse cx="17" cy="28" rx="3" ry="4" fill={darker} />
      <ellipse cx="47" cy="28" rx="3" ry="4" fill={darker} />

      {/* Hair */}
      {c.feature === 'ponytail' ? (
        <g>
          <path d="M18 24 Q18 10 32 10 Q46 10 46 24" fill={c.hair} />
          <path d="M44 14 Q52 14 50 30 Q48 28 46 24" fill={c.hair} />
        </g>
      ) : (
        <path d="M18 24 Q18 10 32 10 Q46 10 46 24" fill={c.hair} />
      )}

      {/* Eyes */}
      {renderPresetEyes(c.eyeStyle)}

      {/* Nose */}
      <rect x="31" y="29" width="3" height="3" fill={darker} rx="1" />

      {/* Mouth */}
      <rect x="28" y="35" width="8" height="2" fill={darker} rx="1" />

      {/* Eyebrows */}
      <rect x="22" y="20" width="7" height="2" fill="#333" rx="0.5" />
      <rect x="35" y="20" width="7" height="2" fill="#333" rx="0.5" />

      {/* Unique features */}
      {c.feature === 'cigar' && (
        <g>
          <rect x="38" y="34" width="10" height="2.5" fill="#8B4513" rx="1" />
          <circle cx="48" cy="33" r="1.5" fill="#ff6600" opacity="0.7" />
        </g>
      )}
      {c.feature === 'chain' && (
        <path d="M24 48 Q32 56 40 48" fill="none" stroke="#f1c40f" strokeWidth="2" />
      )}
      {c.feature === 'glasses' && (
        <g>
          <rect x="20" y="23" width="10" height="7" fill="none" stroke="#555" strokeWidth="1.5" rx="1" />
          <rect x="34" y="23" width="10" height="7" fill="none" stroke="#555" strokeWidth="1.5" rx="1" />
          <line x1="30" y1="26" x2="34" y2="26" stroke="#555" strokeWidth="1" />
        </g>
      )}
      {c.feature === 'earrings' && (
        <g>
          <circle cx="16" cy="32" r="2" fill="#f1c40f" />
          <circle cx="48" cy="32" r="2" fill="#f1c40f" />
        </g>
      )}
    </svg>
  );
}

function renderPresetEyes(style: string) {
  const w = style === 'narrow' ? 5 : style === 'wide' ? 7 : 6;
  const ry = style === 'narrow' ? 1.5 : style === 'almond' ? 2 : 2.5;
  return (
    <>
      <ellipse cx="25" cy="26" rx={w / 2} ry={ry} fill="white" />
      <circle cx="25" cy="26" r={1.8} fill="#222" />
      <circle cx="25.5" cy="25.5" r={0.6} fill="white" />
      <ellipse cx="39" cy="26" rx={w / 2} ry={ry} fill="white" />
      <circle cx="39" cy="26" r={1.8} fill="#222" />
      <circle cx="39.5" cy="25.5" r={0.6} fill="white" />
    </>
  );
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
