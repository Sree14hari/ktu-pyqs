
'use client';

import React, { useState, useEffect } from 'react';

const Snowflake = ({ style }: { style: React.CSSProperties }) => (
  <svg
    style={style}
    className="absolute text-white"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2V22M12 2L15.5 4M12 2L8.5 4M12 22L15.5 20M12 22L8.5 20M2 12H22M2 12L4 8.5M2 12L4 15.5M22 12L20 8.5M22 12L20 15.5M5.20577 5.20577L18.7942 18.7942M5.20577 5.20577L7.20577 7.20577M18.7942 18.7942L16.7942 16.7942M5.20577 18.7942L18.7942 5.20577M5.20577 18.7942L7.20577 16.7942M18.7942 5.20577L16.7942 7.20577"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export function ChristmasTheme() {
    const [snowflakes, setSnowflakes] = useState<{ id: number; style: React.CSSProperties }[]>([]);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const generatedSnowflakes = Array.from({ length: 30 }).map((_, i) => ({
            id: i,
            style: {
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * -100}%`, // Start off-screen
                width: `${Math.random() * 10 + 10}px`,
                height: `${Math.random() * 10 + 10}px`,
                opacity: Math.random() * 0.5 + 0.3,
                animation: `fall ${Math.random() * 10 + 10}s ${Math.random() * 5}s linear infinite`,
            },
        }));
        setSnowflakes(generatedSnowflakes);
    }, []);

    if (!isClient) {
        return null;
    }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <style>
            {`
                @keyframes fall {
                    0% { top: -10%; transform: translateX(0) rotate(0deg); }
                    100% { top: 110%; transform: translateX(${Math.random() > 0.5 ? '' : '-'}100px) rotate(360deg); }
                }
            `}
        </style>
      {snowflakes.map(flake => (
        <Snowflake key={flake.id} style={flake.style} />
      ))}
    </div>
  );
}
