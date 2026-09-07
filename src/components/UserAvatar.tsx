'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface UserAvatarProps {
  email?: string;
  plan?: 'free' | 'pro';
  onLogout?: () => void;
  onUpgradeClick?: () => void;
}

export default function UserAvatar({
  email = 'user@example.com',
  plan = 'free',
  onLogout,
  onUpgradeClick
}: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Chiude il menu cliccando all'esterno
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Estrazione iniziali dall'email (es. edoardo.berna... -> EB, mario -> MA)
  const getInitials = (str: string) => {
    const clean = str.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || 'U';
  };

  // Palette gradienti deterministici
  const gradients = [
    'from-blue-600 via-indigo-600 to-violet-600',
    'from-violet-600 via-purple-600 to-fuchsia-600',
    'from-emerald-500 via-teal-600 to-cyan-700',
    'from-rose-500 via-pink-600 to-indigo-600',
    'from-amber-500 via-orange-600 to-red-600',
  ];

  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash += str.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  const initials = getInitials(email);
  const gradientClass = getGradient(email);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Avatar Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 transition cursor-pointer group focus:outline-none"
      >
        <div className="relative">
          <div
            className={`w-9 h-9 rounded-full bg-gradient-to-tr ${gradientClass} flex items-center justify-center text-white text-xs font-black tracking-wider shadow-sm ring-2 ring-white group-hover:scale-105 transition-transform duration-200`}
          >
            {initials}
          </div>
          {/* Indicatore online */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
            {email.split('@')[0]}
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
            {plan === 'pro' ? 'Piano Pro ★' : 'Piano Free'}
          </span>
        </div>

        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-slate-600' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white shadow-2xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Info Utente */}
          <div className="p-3 border-b border-slate-100 space-y-1">
            <p className="text-[11px] font-medium text-slate-400">Connesso come</p>
            <p className="text-xs font-bold text-slate-900 truncate" title={email}>
              {email}
            </p>
            <div className="pt-1 flex items-center gap-2">
              <span
                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  plan === 'pro'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Piano {plan}
              </span>
              {plan === 'free' && onUpgradeClick && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onUpgradeClick();
                  }}
                  className="text-[10px] font-bold text-amber-600 hover:text-amber-700 cursor-pointer"
                >
                  Passa a Pro →
                </button>
              )}
            </div>
          </div>

          {/* Voci Menu */}
          <div className="py-1 text-xs text-slate-700 space-y-0.5">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 font-medium transition"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Builder Calcolatore
            </Link>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 hover:text-blue-600 font-medium transition"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Dashboard & Lead
            </Link>
          </div>

          {/* Logout */}
          {onLogout && (
            <div className="pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
              >
                <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Esci dall&apos;account
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}