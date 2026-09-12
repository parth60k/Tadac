'use client';

import { useTheme } from '@/lib/theme';

// Day scene: gentle sky gradient with pixel-art style hills
function DayScene() {
  return (
    <>
      {/* Clouds */}
      <div
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          width: 120,
          height: 40,
          borderRadius: 40,
          background: 'rgba(255,255,255,0.60)',
          animation: 'driftCloud 30s linear infinite alternate',
          boxShadow: '0 0 0 18px rgba(255,255,255,0.30)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '8%',
          left: '38%',
          width: 80,
          height: 28,
          borderRadius: 30,
          background: 'rgba(255,255,255,0.50)',
          animation: 'driftCloud 22s linear infinite alternate-reverse',
          boxShadow: '0 0 0 12px rgba(255,255,255,0.22)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '18%',
          right: '10%',
          width: 100,
          height: 32,
          borderRadius: 35,
          background: 'rgba(255,255,255,0.45)',
          animation: 'driftCloud 38s linear infinite alternate',
          boxShadow: '0 0 0 14px rgba(255,255,255,0.20)',
        }}
      />

      {/* Ground / hills */}
      <svg
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%' }}
        viewBox="0 0 1440 280"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Far hill */}
        <ellipse cx="720" cy="320" rx="900" ry="130" fill="rgba(168,214,120,0.55)" />
        {/* Near hill left */}
        <ellipse cx="200" cy="350" rx="500" ry="160" fill="rgba(140,195,90,0.65)" />
        {/* Near hill right */}
        <ellipse cx="1250" cy="360" rx="500" ry="170" fill="rgba(130,185,80,0.60)" />
        {/* Ground strip */}
        <rect x="0" y="240" width="1440" height="40" fill="rgba(120,180,70,0.50)" />
      </svg>

      {/* Desk lamp glow — subtle warm circle in lower center */}
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 320,
          height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,220,120,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
    </>
  );
}

// Night scene: deep sky, stars, warm lamp glow
// Stars generated at module level (stable, not recreated on each render)
const STARS = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  top:      `${(i * 37 + 11) % 70}%`,
  left:     `${(i * 61 + 7)  % 100}%`,
  size:     (i % 3) + 1.2,
  delay:    `${(i % 5) * 0.8}s`,
  duration: `${2 + (i % 4) * 0.7}s`,
}));

function NightScene() {
  return (
    <>
      {/* Stars */}
      {STARS.map(s => (
        <div
          key={s.id}
          className="scene-star"
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDuration: s.duration,
            animationDelay: s.delay,
          }}
        />
      ))}

      {/* City skyline silhouette */}
      <svg
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0, width: '100%' }}
        viewBox="0 0 1440 220"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0"    y="100" width="1440" height="120" fill="rgba(8,12,28,0.85)" />
        <rect x="80"   y="60"  width="60"   height="60"  fill="rgba(8,12,28,0.85)" />
        <rect x="200"  y="30"  width="50"   height="90"  fill="rgba(8,12,28,0.85)" />
        <rect x="300"  y="55"  width="80"   height="65"  fill="rgba(8,12,28,0.85)" />
        <rect x="500"  y="20"  width="40"   height="100" fill="rgba(8,12,28,0.85)" />
        <rect x="600"  y="50"  width="70"   height="70"  fill="rgba(8,12,28,0.85)" />
        <rect x="750"  y="35"  width="55"   height="85"  fill="rgba(8,12,28,0.85)" />
        <rect x="900"  y="15"  width="45"   height="105" fill="rgba(8,12,28,0.85)" />
        <rect x="1000" y="60"  width="90"   height="60"  fill="rgba(8,12,28,0.85)" />
        <rect x="1150" y="40"  width="60"   height="80"  fill="rgba(8,12,28,0.85)" />
        <rect x="1300" y="55"  width="80"   height="65"  fill="rgba(8,12,28,0.85)" />
        {/* Window lights */}
        <rect x="210" y="50"  width="8" height="8" fill="rgba(255,220,120,0.70)" rx="1" />
        <rect x="510" y="40"  width="6" height="6" fill="rgba(255,220,120,0.60)" rx="1" />
        <rect x="760" y="55"  width="7" height="7" fill="rgba(200,220,255,0.55)" rx="1" />
        <rect x="910" y="35"  width="6" height="6" fill="rgba(255,220,120,0.65)" rx="1" />
        <rect x="1160" y="60" width="8" height="8" fill="rgba(255,220,120,0.60)" rx="1" />
      </svg>

      {/* Warm desk lamp glow */}
      <div
        style={{
          position: 'absolute',
          bottom: '18%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 160,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(255,200,80,0.18) 0%, transparent 68%)',
          pointerEvents: 'none',
        }}
      />

      {/* Moon */}
      <div
        style={{
          position: 'absolute',
          top: '8%',
          right: '12%',
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: 'rgba(240,240,200,0.90)',
          boxShadow: '0 0 40px rgba(240,240,200,0.35)',
        }}
      />
    </>
  );
}

export default function SceneBackground() {
  const { resolvedTheme } = useTheme();

  return (
    <div className="scene-bg">
      {resolvedTheme === 'day' ? <DayScene /> : <NightScene />}
    </div>
  );
}
