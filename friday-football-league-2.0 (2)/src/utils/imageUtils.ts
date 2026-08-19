/**
 * Utility functions for resizing and compressing player profile images
 * to ensure fast Firebase syncing and lightweight local storage.
 */

export async function processAndCompressImage(
  fileOrDataUrl: File | string,
  maxWidth: number = 240,
  maxHeight: number = 240,
  quality: number = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // Determine crop and scale for square avatar
      const canvas = document.createElement('canvas');
      const minDimension = Math.min(img.width, img.height);
      
      canvas.width = maxWidth;
      canvas.height = maxHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(typeof fileOrDataUrl === 'string' ? fileOrDataUrl : '');
        return;
      }

      // Center crop to square
      const startX = (img.width - minDimension) / 2;
      const startY = (img.height - minDimension) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(
        img,
        startX,
        startY,
        minDimension,
        minDimension,
        0,
        0,
        maxWidth,
        maxHeight
      );

      // Output as compressed JPEG data URL
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    }
  });
}

export interface PresetAvatar {
  id: string;
  name: string;
  category: 'kit' | 'role' | 'badge';
  svgDataUrl: string;
}

// Generate high quality, clean SVG avatar data URLs for instant presets
function createSvgDataUrl(bgColor: string, emoji: string, label?: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgColor}" stop-opacity="1" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
      </linearGradient>
    </defs>
    <rect width="120" height="120" rx="28" fill="url(#grad)" />
    <circle cx="60" cy="55" r="38" fill="white" fill-opacity="0.08" />
    <text x="60" y="${label ? '58' : '68'}" font-size="44" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    ${label ? `<text x="60" y="98" font-size="11" font-family="sans-serif" font-weight="900" fill="#f8fafc" letter-spacing="1" text-anchor="middle">${label}</text>` : ''}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const PRESET_AVATARS: PresetAvatar[] = [
  { id: 'striker', name: 'Striker', category: 'role', svgDataUrl: createSvgDataUrl('#dc2626', '⚡', 'STRIKER') },
  { id: 'captain', name: 'Captain', category: 'role', svgDataUrl: createSvgDataUrl('#d97706', '👑', 'CAPTAIN') },
  { id: 'playmaker', name: 'Playmaker', category: 'role', svgDataUrl: createSvgDataUrl('#2563eb', '🎯', 'PLAYMAKER') },
  { id: 'goalkeeper', name: 'Goalkeeper', category: 'role', svgDataUrl: createSvgDataUrl('#059669', '🧤', 'KEEPER') },
  { id: 'defender', name: 'Defender', category: 'role', svgDataUrl: createSvgDataUrl('#475569', '🛡️', 'DEFENDER') },
  { id: 'golden_boot', name: 'Golden Boot', category: 'badge', svgDataUrl: createSvgDataUrl('#eab308', '👟', 'GOLDEN') },
  { id: 'trophy', name: 'Champion', category: 'badge', svgDataUrl: createSvgDataUrl('#f59e0b', '🏆', 'CHAMP') },
  { id: 'fire', name: 'On Fire', category: 'badge', svgDataUrl: createSvgDataUrl('#ea580c', '🔥', 'FIRE') },
  { id: 'diamond', name: 'MVP', category: 'badge', svgDataUrl: createSvgDataUrl('#06b6d4', '💎', 'ELITE') },
  { id: 'footballer_1', name: 'Pro 1', category: 'kit', svgDataUrl: createSvgDataUrl('#7c3aed', '⚽', 'NUMBER 10') },
  { id: 'footballer_2', name: 'Pro 2', category: 'kit', svgDataUrl: createSvgDataUrl('#db2777', '🏃', 'SPEED') },
  { id: 'legend', name: 'Legend', category: 'badge', svgDataUrl: createSvgDataUrl('#1e293b', '⭐', 'LEGEND') },
];
