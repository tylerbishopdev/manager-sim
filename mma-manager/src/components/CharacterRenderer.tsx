import { SKIN_TONES, FACIAL_HAIR, HATS, STYLES, EYE_SHAPES } from '../types';
import type { CustomOptions } from '../types';

interface Props {
  options: CustomOptions;
  size?: number;
}

/** Renders a layered pixel-art character from customization options */
export default function CharacterRenderer({ options, size = 160 }: Props) {
  const skin = SKIN_TONES[options.skinTone];
  const darkerSkin = darken(skin, 30);
  const eyeShape = EYE_SHAPES[options.eyeShape];
  const facial = FACIAL_HAIR[options.facialHair];
  const hat = HATS[options.hat];
  const style = STYLES[options.style];

  // Style colors
  const styleColors: Record<string, { primary: string; secondary: string }> = {
    suit: { primary: '#2c3e50', secondary: '#ecf0f1' },
    streetwear: { primary: '#e74c3c', secondary: '#2c2c2c' },
    tracksuit: { primary: '#27ae60', secondary: '#f1c40f' },
    casual: { primary: '#3498db', secondary: '#ecf0f1' },
    flashy: { primary: '#8e44ad', secondary: '#f1c40f' },
  };

  const sc = styleColors[style] || styleColors.suit;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 80"
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Body / Clothing */}
      <rect x="16" y="44" width="32" height="28" fill={sc.primary} />
      {/* Collar / accent */}
      <rect x="24" y="44" width="16" height="4" fill={sc.secondary} />
      {/* Lapel lines for suit */}
      {style === 'suit' && (
        <>
          <line x1="28" y1="48" x2="24" y2="60" stroke={sc.secondary} strokeWidth="1.5" />
          <line x1="36" y1="48" x2="40" y2="60" stroke={sc.secondary} strokeWidth="1.5" />
        </>
      )}
      {/* Stripe for tracksuit */}
      {style === 'tracksuit' && (
        <>
          <rect x="16" y="44" width="4" height="28" fill={sc.secondary} opacity="0.6" />
          <rect x="44" y="44" width="4" height="28" fill={sc.secondary} opacity="0.6" />
        </>
      )}
      {/* Chain for flashy */}
      {style === 'flashy' && (
        <path d="M28 48 Q32 54 36 48" fill="none" stroke="#f1c40f" strokeWidth="1.5" />
      )}
      {/* Hoodie string for streetwear */}
      {style === 'streetwear' && (
        <>
          <line x1="28" y1="48" x2="28" y2="56" stroke="#ddd" strokeWidth="1" />
          <line x1="36" y1="48" x2="36" y2="56" stroke="#ddd" strokeWidth="1" />
        </>
      )}

      {/* Neck */}
      <rect x="27" y="40" width="10" height="6" fill={skin} />

      {/* Head */}
      <ellipse cx="32" cy="28" rx="14" ry="16" fill={skin} />

      {/* Ears */}
      <ellipse cx="17" cy="28" rx="3" ry="4" fill={darkerSkin} />
      <ellipse cx="47" cy="28" rx="3" ry="4" fill={darkerSkin} />

      {/* Eyes */}
      {renderEyes(eyeShape)}

      {/* Nose */}
      <rect x="31" y="29" width="3" height="3" fill={darkerSkin} rx="1" />

      {/* Mouth */}
      <rect x="28" y="35" width="8" height="2" fill={darkerSkin} rx="1" />

      {/* Eyebrows */}
      <rect x="22" y="20" width="7" height="2" fill="#333" rx="0.5" />
      <rect x="35" y="20" width="7" height="2" fill="#333" rx="0.5" />

      {/* Hair base (behind hat if hat present) */}
      {hat === 'none' && (
        <path d="M18 24 Q18 10 32 10 Q46 10 46 24" fill="#2c2c2c" />
      )}

      {/* Facial hair layer */}
      {renderFacialHair(facial, darkerSkin)}

      {/* Hat layer */}
      {renderHat(hat)}
    </svg>
  );
}

function renderEyes(shape: string) {
  const eyeW = shape === 'narrow' ? 5 : shape === 'wide' ? 7 : 6;
  const eyeH = shape === 'narrow' ? 3 : shape === 'almond' ? 4 : shape === 'hooded' ? 3.5 : 5;
  const ry = shape === 'round' ? eyeH / 2 : eyeH / 2.5;

  return (
    <>
      {/* Left eye */}
      <ellipse cx="25" cy="26" rx={eyeW / 2} ry={ry} fill="white" />
      <circle cx="25" cy="26" r={2} fill="#222" />
      <circle cx="25.5" cy="25.5" r={0.7} fill="white" />

      {/* Right eye */}
      <ellipse cx="39" cy="26" rx={eyeW / 2} ry={ry} fill="white" />
      <circle cx="39" cy="26" r={2} fill="#222" />
      <circle cx="39.5" cy="25.5" r={0.7} fill="white" />

      {/* Hooded eyelid */}
      {shape === 'hooded' && (
        <>
          <rect x="22" y="23" width={eyeW} height="2" fill="currentColor" opacity="0.2" rx="1" />
          <rect x="36" y="23" width={eyeW} height="2" fill="currentColor" opacity="0.2" rx="1" />
        </>
      )}
    </>
  );
}

function renderFacialHair(type: string, _color: string) {
  switch (type) {
    case 'stubble':
      return (
        <g opacity="0.4">
          {[26, 28, 30, 32, 34, 36, 38].map((x) => (
            <circle key={x} cx={x} cy={37} r={0.5} fill="#333" />
          ))}
          {[27, 29, 31, 33, 35, 37].map((x) => (
            <circle key={x} cx={x} cy={38.5} r={0.5} fill="#333" />
          ))}
        </g>
      );
    case 'goatee':
      return (
        <path d="M28 36 Q32 44 36 36" fill="#2c2c2c" opacity="0.8" />
      );
    case 'fullBeard':
      return (
        <path d="M20 30 Q20 44 32 46 Q44 44 44 30" fill="#2c2c2c" opacity="0.7" />
      );
    case 'mustache':
      return (
        <path d="M25 33 Q28 36 32 34 Q36 36 39 33" fill="#2c2c2c" strokeWidth="1.5" />
      );
    default:
      return null;
  }
}

function renderHat(type: string) {
  switch (type) {
    case 'snapback':
      return (
        <g>
          <path d="M16 20 Q16 8 32 8 Q48 8 48 20 Z" fill="#c0392b" />
          <rect x="14" y="18" width="36" height="4" fill="#c0392b" rx="1" />
          <rect x="14" y="17" width="20" height="5" fill="#e74c3c" rx="1" />
        </g>
      );
    case 'fedora':
      return (
        <g>
          <path d="M12 22 L52 22 L48 18 Q48 6 32 6 Q16 6 16 18 Z" fill="#5d4037" />
          <rect x="10" y="20" width="44" height="4" fill="#4e342e" rx="1" />
          <rect x="22" y="16" width="20" height="2" fill="#d4a017" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M18 24 Q18 6 32 4 Q46 6 46 24" fill="#2c3e50" />
          <rect x="18" y="20" width="28" height="4" fill="#34495e" />
          <circle cx="32" cy="4" r="2" fill="#34495e" />
        </g>
      );
    case 'headband':
      return (
        <g>
          <path d="M18 24 Q18 10 32 10 Q46 10 46 24" fill="#2c2c2c" />
          <rect x="17" y="18" width="30" height="3" fill="#e74c3c" rx="1" />
        </g>
      );
    default:
      return null;
  }
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
