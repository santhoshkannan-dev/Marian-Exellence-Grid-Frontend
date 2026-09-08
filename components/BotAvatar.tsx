import React from 'react';

interface BotAvatarProps {
  size?: number;
  className?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({ size = 60, className = '' }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Purple gradient circle */}
        <linearGradient id="botBgGradient" x1="15" y1="15" x2="85" y2="85" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6d28d9" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>

        {/* Soft shadow under elements */}
        <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Main Circular Background */}
      <circle cx="50" cy="50" r="46" fill="url(#botBgGradient)" />

      {/* Subtle outer highlight rim */}
      <circle cx="50" cy="50" r="45" stroke="#a78bfa" strokeWidth="1.2" strokeOpacity="0.3" fill="none" />

      {/* White Robot Head - horizontal eye/oval shape */}
      <path
        d="M 23 40 C 26 26, 74 26, 77 40 C 74 54, 26 54, 23 40 Z"
        fill="#FFFFFF"
        filter="url(#softGlow)"
      />

      {/* Dark Visor / Screen */}
      <rect
        x="36"
        y="34"
        width="28"
        height="12"
        rx="6"
        fill="#0f172a"
      />

      {/* Visor Cyan Glowing Eyes */}
      <ellipse cx="43" cy="40" rx="3" ry="3" fill="#00f5d4" />
      <ellipse cx="57" cy="40" rx="3" ry="3" fill="#00f5d4" />

      {/* White Speech Bubble Collar / Body with Tail */}
      <path
        d="M 35 53 
           C 40 50, 60 50, 65 53 
           C 69 57, 65 67, 58 68 
           C 55 72, 49 76, 45 78 
           C 47 74, 48 70, 47 68 
           C 39 67, 33 58, 35 53 Z"
        fill="#FFFFFF"
        filter="url(#softGlow)"
      />

      {/* 3 Dots inside Speech Bubble */}
      <circle cx="43" cy="61.5" r="2.2" fill="#1e1b4b" />
      <circle cx="50" cy="61.5" r="2.2" fill="#1e1b4b" />
      <circle cx="57" cy="61.5" r="2.2" fill="#1e1b4b" />
    </svg>
  );
};
