import React from 'react';

export const AppLogo = ({ className = "", showText = true }: { className?: string, showText?: boolean }) => (
  <div className={`flex flex-col items-center justify-center ${className}`}>
    <svg viewBox="0 0 100 85" className={showText ? "w-12 h-12 mb-1" : "w-10 h-10"} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Sun Rays */}
      <g stroke="#FDD835" strokeWidth="4" strokeLinecap="round">
        <path d="M50 16 L50 8" />
        <path d="M62 19 L67 12" />
        <path d="M38 19 L33 12" />
        <path d="M72 29 L79 25" />
        <path d="M28 29 L21 25" />
        <path d="M79 43 L85 43" />
        <path d="M21 43 L15 43" />
      </g>
      
      {/* Sun Core Arc */}
      <path d="M28 50 C28 35 38 24 50 24 C62 24 72 35 72 50" stroke="#FDD835" strokeWidth="5" strokeLinecap="round" />
      <path d="M36 50 C36 41 42 34 50 34 C58 34 64 41 64 50" stroke="#FDD835" strokeWidth="5" strokeLinecap="round" />

      {/* Mountains */}
      {/* Left thick overlapping line */}
      <path d="M22 65 L44 32 L49 39" stroke="#263238" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Middle thick overlapping line */}
      <path d="M35 68 L53 36 L63 50" stroke="#263238" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Right giant shape */}
      <path d="M48 69 L62 44 L78 62 C73 70 65 72 50 72 Z" fill="#263238" />
      
      {/* White/negative space cuts in right side */}
      <path d="M62 48 L65 59 L74 61 L68 53 Z" fill="white" />
    </svg>
    {showText && (
      <div className="flex items-center gap-0 mt-0 font-sans text-[11px] uppercase tracking-[0.2em] leading-none">
        <span className="font-extrabold text-[#263238] dark:text-slate-100">ALERT</span>
        <span className="font-light text-slate-400 dark:text-slate-400">SPHERE</span>
      </div>
    )}
  </div>
);
