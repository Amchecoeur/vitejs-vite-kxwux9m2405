import React, { useState, useEffect, useRef } from 'react';
import {
  Phone, Plus, Volume2, VolumeX, Crown, Trophy, Monitor,
  ArrowLeft, LogOut, Star, Calendar, Archive,
  History, SkipForward, AlertCircle, Trash2, Music, Ghost, MessageSquare,
  Send, Minimize2, Zap, Move, RotateCw, Save, Lock, KeyRound, Settings, Briefcase, Skull, Car, Eraser, Search, MapPin, Building, User, Users, DollarSign, FileText, CalendarCheck, ChevronLeft, Book, Maximize2, X, Radio, Globe, Clock, Activity
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import {
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, writeBatch, query, getDocs, orderBy, limit, where
} from 'firebase/firestore';

// ==========================================
// 1. CONFIGURATION ET DONNÉES
// ==========================================

// --- FIREBASE ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- CONFIGURATIONS DES ÉQUIPES ---
const CONFIGS = {
  ADN: {
    id: 'ADN',
    label: 'ÉQUIPE ADN',
    desc: 'Version Classique',
    appId: 'strangers-phoning-event-final', // DB Originale
    title: 'STRANGER PHONING',
    assets: {
      splash: "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/main/public/assets/images/fond.JPG",
      background: "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/main/public/assets/images/fond.JPG",
      video: "https://cdn.jsdelivr.net/gh/Amchecoeur/vitejs-vite-kxwux9m2405@3693163d0ac91109846852ad4aaadb4ff4d620d1/public/assets/video/intro.mp4",
      music: "https://cdn.jsdelivr.net/gh/Amchecoeur/vitejs-vite-kxwux9m2405@0f0de90b192a639663ac641aa4ac1a93c4c14753/public/assets/sounds/strangersthings.mp3"
    },
    hasVideoIntro: true,
    primaryColor: 'text-red-600',
    borderColor: 'border-red-600',
    hoverBg: 'hover:bg-red-900/50'
  },
  CALL: {
    id: 'CALL',
    label: 'ÉQUIPE CALL',
    desc: 'Version Mada',
    appId: 'stranger-phoning-mada', // DB Mada
    title: 'STRANGER PHONING MADA',
    assets: {
      splash: "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/d938d76f01d070317e6d4f05b48e6c94c03e22b9/public/assets/images/madafond.jpeg",
      background: "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/d938d76f01d070317e6d4f05b48e6c94c03e22b9/public/assets/images/madafond.jpeg",
      video: null,
      music: "https://cdn.jsdelivr.net/gh/Amchecoeur/vitejs-vite-kxwux9m2405@0f0de90b192a639663ac641aa4ac1a93c4c14753/public/assets/sounds/strangersthings.mp3"
    },
    hasVideoIntro: false,
    primaryColor: 'text-yellow-500',
    borderColor: 'border-yellow-500',
    hoverBg: 'hover:bg-yellow-900/50'
  }
};

// --- CONSTANTES GLOBALES ---
const COLL_CURRENT = 'stranger-phoning-team-v2';
const COLL_HISTORY = 'stranger-phoning-history';
const COLL_CHAT = 'strangers-phoning-chat-global';
const COLL_EVENTS = 'strangers-phoning-global-events';

// Hash du code super admin (code caché)
const SUPER_ADMIN_HASH = "1a3bfc3e"; // Hash du code réel
const hashCode = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).substring(0, 8);
};
const verifySuperAdmin = (code) => hashCode(code) === SUPER_ADMIN_HASH;

const AUTO_ARCHIVE_HOUR = 19; // Heure de l'archivage automatique (19h = 19:00)

const LEVELS = [
  { lvl: 1, name: "ROOKIE", unlock: null },
  { lvl: 2, name: "SCOUT", unlock: null },
  { lvl: 3, name: "TROOPER", unlock: "Avatar" },
  { lvl: 4, name: "DETECTIVE", unlock: "Computer Skin" },
  { lvl: 5, name: "SHERIFF", unlock: "Card Color" },
  { lvl: 6, name: "HERO", unlock: null },
  { lvl: 7, name: "PSYCHIC", unlock: "Notepad" },
  { lvl: 8, name: "MIND FLAYER", unlock: null },
  { lvl: 9, name: "DUNGEON MASTER", unlock: null },
  { lvl: 10, name: "LEGEND", unlock: "MANAGER BOOST" }
];

const getLevelInfo = (lifetimeRdvs) => {
  const count = lifetimeRdvs || 0;
  const index = Math.min(LEVELS.length - 1, Math.floor(count / 3));
  return LEVELS[index];
};

const INACTIVITY_LIMIT = 15 * 24 * 60 * 60 * 1000;

// --- THEMES & COLORS ---
const THEMES = [
  { name: 'Red', primary: '#ef4444', secondary: '#7f1d1d' },
  { name: 'Blue', primary: '#3b82f6', secondary: '#1e3a8a' },
  { name: 'Green', primary: '#22c55e', secondary: '#14532d' },
  { name: 'Purple', primary: '#a855f7', secondary: '#581c87' },
  { name: 'Pink', primary: '#ec4899', secondary: '#831843' },
  { name: 'Yellow', primary: '#eab308', secondary: '#713f12' },
  { name: 'Cyan', primary: '#06b6d4', secondary: '#164e63' },
  { name: 'Orange', primary: '#f97316', secondary: '#7c2d12' },
];

const NOTEPAD_THEMES = [
  { name: 'Classic Yellow', bg: '#f3e5ab', text: '#1e293b' },
  { name: 'Dark Mode', bg: '#1e293b', text: '#e2e8f0' },
  { name: 'Neon Pink', bg: '#831843', text: '#fbcfe8' },
  { name: 'Matrix Green', bg: '#022c22', text: '#4ade80' },
  { name: 'Cyber Blue', bg: '#172554', text: '#60a5fa' }
];

const COMPUTER_THEMES = [
  { name: 'Phosphor Green', text: 'text-green-400', border: 'border-green-800', bg: 'bg-green-900/20', active: 'bg-green-900 text-green-400', inactive: 'text-neutral-500 hover:text-green-400' },
  { name: 'Amber Terminal', text: 'text-amber-500', border: 'border-amber-800', bg: 'bg-amber-900/20', active: 'bg-amber-900 text-amber-400', inactive: 'text-neutral-500 hover:text-amber-400' },
  { name: 'Cyber Blue', text: 'text-cyan-400', border: 'border-cyan-700', bg: 'bg-cyan-900/20', active: 'bg-cyan-900 text-cyan-400', inactive: 'text-neutral-500 hover:text-cyan-400' },
  { name: 'Red Alert', text: 'text-red-500', border: 'border-red-800', bg: 'bg-red-900/20', active: 'bg-red-900 text-red-400', inactive: 'text-neutral-500 hover:text-red-400' },
  { name: 'Monochrome', text: 'text-gray-300', border: 'border-gray-600', bg: 'bg-gray-800/50', active: 'bg-gray-700 text-white', inactive: 'text-neutral-500 hover:text-white' },
];

const getThemeFromName = (name) => {
  if (!name) return THEMES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % THEMES.length;
  return THEMES[index];
};

// --- UTILS ---
const playSound = (type, muted) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const simpleTone = (freq, duration, typeOsc = 'sine') => {
      osc.type = typeOsc;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    };

    if (type === 'click') simpleTone(800, 0.05, 'triangle');
    else if (type === 'unlock') { simpleTone(400, 0.1, 'square'); simpleTone(600, 0.1, 'square'); simpleTone(800, 0.3, 'square'); }
    else if (type === 'error') { simpleTone(150, 0.3, 'sawtooth'); }
    else if (type === 'wizz') { simpleTone(150, 0.5, 'sawtooth'); simpleTone(100, 0.5, 'square'); }
    else if (type === 'upside') { simpleTone(50, 2, 'sawtooth'); }
    else if (type === 'taunt') { simpleTone(400, 0.1, 'square'); simpleTone(600, 0.1, 'square'); }
    else if (type === 'message') { simpleTone(800, 0.1); }
    else if (type === 'eraser') { simpleTone(200, 0.1, 'sawtooth'); }
    else if (type === 'scan') { simpleTone(1200, 0.05, 'square'); setTimeout(() => simpleTone(1200, 0.05, 'square'), 100); }
    else if (type === 'coin') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(988, now);
      osc.frequency.linearRampToValueAtTime(1319, now + 0.08);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
    else if (type === 'superJackpotFun') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00];
      notes.forEach((freq, i) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(freq, now + i * 0.08);
        gain2.gain.setValueAtTime(0.05, now + i * 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + i * 0.08);
        osc2.stop(now + i * 0.08 + 0.3);
      });
      setTimeout(() => {
        const chord = [523.25, 783.99, 1046.50];
        chord.forEach(f => simpleTone(f, 0.5, 'triangle'));
      }, notes.length * 80);
    }
    else if (type === 'carHorn') {
      simpleTone(300, 0.1, 'sawtooth');
      setTimeout(() => simpleTone(300, 0.2, 'sawtooth'), 150);
    }
    else if (type === 'levelUp') {
      const notes = [
        { f: 392.00, d: 0.08 }, { f: 523.25, d: 0.08 }, { f: 659.25, d: 0.08 },
        { f: 783.99, d: 0.08 }, { f: 1046.50, d: 0.08 }, { f: 1318.51, d: 0.08 },
        { f: 1567.98, d: 0.3 },
      ];
      let time = now;
      notes.forEach(n => {
        const osc2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(n.f, time);
        g2.gain.setValueAtTime(0.1, time);
        g2.gain.exponentialRampToValueAtTime(0.01, time + n.d);
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.start(time);
        osc2.stop(time + n.d + 0.1);
        time += n.d;
      });
    }
  } catch (e) { }
};

// --- ICONS ---
const WalkieTalkieIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M7 2h2v5H7z" fillOpacity="0.8" />
    <rect x="6" y="2" width="4" height="1" rx="0.5" fillOpacity="0.9" />
    <path d="M8 7h10v15H8z" />
    <path d="M6 8h2v14H6z" fillOpacity="0.5" />
    <g fill="rgba(0,0,0,0.3)">
      <rect x="10" y="9" width="6" height="1" />
      <rect x="10" y="11" width="6" height="1" />
      <rect x="10" y="13" width="6" height="1" />
      <rect x="10" y="15" width="6" height="1" />
    </g>
    <rect x="9" y="17" width="8" height="4" fill="rgba(0,0,0,0.1)" />
    <circle cx="11.5" cy="19" r="1.5" fill="rgba(0,0,0,0.6)" />
    <circle cx="14.5" cy="19" r="1.5" fill="rgba(0,0,0,0.6)" />
    <rect x="15.5" y="16" width="1" height="1" fill="#ef4444" />
  </svg>
);

// ==========================================
// 2. COMPOSANTS RÉUTILISABLES
// ==========================================

const AppBackground = ({ url }) => (
  <div className="fixed inset-0 z-[-1]">
    <img
      src={url}
      alt="Background"
      className="w-full h-full object-cover transition-opacity duration-1000 ease-in-out"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
    <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>
  </div>
);

const LevelUpOverlay = ({ levelName, levelNum }) => {
  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-500 pointer-events-none">
      <div className="relative flex flex-col items-center">
        <div className="flex gap-2 mb-6">
          <Star size={40} className="text-yellow-400 animate-bounce delay-0" fill="currentColor" />
          <Star size={56} className="text-yellow-300 animate-bounce delay-100" fill="currentColor" />
          <Star size={40} className="text-yellow-400 animate-bounce delay-200" fill="currentColor" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)] animate-pulse mb-8">LEVEL UP!!</h1>
        <div className="bg-slate-800/80 border-2 border-yellow-500 px-8 py-4 rounded-xl text-center shadow-2xl transform rotate-1 mt-10">
          <h2 className="text-4xl font-black text-white uppercase">{levelName}</h2>
          <div className="text-xs font-mono text-yellow-500 mt-2">NIVEAU {levelNum} ATTEINT</div>
        </div>
      </div>
    </div>
  );
};

const RetroComputer = ({ computerThemeIndex, onUpdateTheme, canCustomize }) => {
  const [mode, setMode] = useState('siret');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [pjWhat, setPjWhat] = useState('');
  const [pjWhere, setPjWhere] = useState('');
  const [pjActive, setPjActive] = useState(false);

  const theme = COMPUTER_THEMES[computerThemeIndex % COMPUTER_THEMES.length] || COMPUTER_THEMES[0];

  const handleSiretSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResult(null);
    playSound('scan', false);

    try {
      const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(searchQuery)}&page=1&per_page=1`);
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        setSearchResult(data.results[0]);
      } else {
        setSearchResult('not_found');
      }
    } catch (error) {
      console.error("Search error", error);
      setSearchResult('error');
    }
    setIsSearching(false);
  };

  const handlePagesJaunesSearch = (e) => {
    e.preventDefault();
    if (!pjWhat.trim()) return;
    const url = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${encodeURIComponent(pjWhat)}&ou=${encodeURIComponent(pjWhere)}`;
    window.open(url, 'PagesJaunesSearch', 'width=1200,height=800,left=100,top=100,scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no');
    setPjActive(true);
    playSound('click', false);
  };

  return (
    <div className="w-full max-w-md h-80 bg-neutral-800 rounded-xl border-4 border-neutral-600 shadow-[0_0_0_2px_#000,0_10px_20px_rgba(0,0,0,0.5)] p-3 flex flex-col relative overflow-hidden transform -rotate-1">
      <div className="flex-1 bg-black rounded-lg border-2 border-neutral-700 shadow-inner overflow-hidden relative flex flex-col">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-20"></div>
        <div className="flex border-b border-neutral-800 bg-neutral-900/80 p-1 relative z-30 items-center justify-between">
          <div className="flex gap-1">
            <button onClick={() => setMode('siret')} className={`px-2 py-0.5 text-[9px] rounded font-mono ${mode === 'siret' ? theme.active : theme.inactive}`}>SIRET</button>
            <button onClick={() => setMode('pagesjaunes')} className={`px-2 py-0.5 text-[9px] rounded font-mono ${mode === 'pagesjaunes' ? 'bg-yellow-900 text-yellow-400' : 'text-neutral-500 hover:text-yellow-400'}`}>ANNUAIRE</button>
          </div>
          {canCustomize && (
            <button onClick={onUpdateTheme} className="text-neutral-500 hover:text-white p-1" title="Changer l'affichage"><Settings size={10} /></button>
          )}
        </div>
        <div className="relative z-0 h-full overflow-hidden p-2 font-mono text-xs">
          {mode === 'siret' && (
            <div className={`flex flex-col h-full ${theme.text}`}>
              <form onSubmit={handleSiretSearch} className="flex gap-1 mb-2 shrink-0">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="NOM / SIRET..." className={`flex-1 ${theme.bg} border ${theme.border.replace('border-', 'border-')}/50 ${theme.text} px-2 py-1 focus:outline-none focus:border-current placeholder-current uppercase`} />
                <button type="submit" disabled={isSearching} className={`px-2 font-bold border ${theme.border} bg-opacity-20 hover:bg-opacity-40 transition-colors`}>{isSearching ? '...' : '>'}</button>
              </form>
              <div className={`flex-1 overflow-y-auto scrollbar-hide space-y-2 border ${theme.border} p-2 ${theme.bg}`}>
                {searchResult === 'not_found' && <div className="opacity-50 text-center mt-4">CIBLE INCONNUE</div>}
                {searchResult && typeof searchResult === 'object' && (
                  <div className="space-y-1">
                    <div className={`font-bold uppercase border-b ${theme.border} pb-1`}>{searchResult.nom_complet}</div>
                    <div className="opacity-70 text-[10px]">{searchResult.siege?.adresse}</div>
                    <div className={`mt-2 flex justify-between text-[9px] opacity-50 border-t ${theme.border} pt-1`}>
                      <span>{searchResult.tranche_effectif_salarie || '?'} SALARIÉS</span>
                      <span>{searchResult.etat_administratif}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {mode === 'pagesjaunes' && (
            <div className="flex flex-col h-full text-yellow-500 items-center justify-center text-center p-4 space-y-4">
              {!pjActive ? (
                <form onSubmit={handlePagesJaunesSearch} className="space-y-2 w-full">
                  <input type="text" value={pjWhat} onChange={(e) => setPjWhat(e.target.value)} placeholder="ACTIVITÉ / NOM" className="w-full bg-yellow-900/10 border border-yellow-800/50 text-yellow-400 px-2 py-1 uppercase" />
                  <input type="text" value={pjWhere} onChange={(e) => setPjWhere(e.target.value)} placeholder="LOCALITÉ" className="w-full bg-yellow-900/10 border border-yellow-800/50 text-yellow-400 px-2 py-1 uppercase" />
                  <button type="submit" className="w-full mt-2 border border-yellow-600 bg-yellow-900/20 text-yellow-500 py-1 hover:bg-yellow-600 hover:text-black transition-colors font-bold">RECHERCHER</button>
                </form>
              ) : (
                <>
                  <Radio size={48} className="animate-pulse text-yellow-500" />
                  <p className="text-[10px] opacity-70">TERMINAL SECONDAIRE OUVERT.</p>
                  <button onClick={() => setPjActive(false)} className="mt-4 text-[9px] underline hover:text-white">NOUVELLE RECHERCHE</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RetroNotepad = ({ myId, initialData, myName, currentLevel, noteThemeIndex, appId }) => {
  const [activeTab, setActiveTab] = useState('J1');
  const [notes, setNotes] = useState(initialData || { J1: '', J2: '', J3: '' });
  const [isSaving, setIsSaving] = useState(false);
  const timeoutRef = useRef(null);
  const themeStyle = NOTEPAD_THEMES[noteThemeIndex % NOTEPAD_THEMES.length] || NOTEPAD_THEMES[0];
  const canCustomize = currentLevel.lvl >= 7;

  useEffect(() => { if (initialData) setNotes(initialData); }, [initialData]);

  const handleNoteChange = (e) => {
    const newVal = e.target.value;
    const newNotes = { ...notes, [activeTab]: newVal };
    setNotes(newNotes);
    setIsSaving(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      try {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myId), { [`notes`]: newNotes, lastActive: Date.now() });
        setIsSaving(false);
      } catch (err) { }
    }, 1500);
  };

  const clearPage = async () => {
    playSound('eraser', false);
    const newNotes = { ...notes, [activeTab]: '' };
    setNotes(newNotes);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myId), { [`notes`]: newNotes, lastActive: Date.now() });
  };

  const cycleTheme = async () => {
    if (!canCustomize) return;
    const nextIndex = (noteThemeIndex + 1) % NOTEPAD_THEMES.length;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myId), { noteThemeIndex: nextIndex });
  };

  return (
    <div
      className="w-full max-w-md h-80 rounded-lg border-2 flex flex-col font-mono overflow-hidden relative transform rotate-1 lg:mt-0 mt-8 backdrop-blur-md shadow-2xl"
      style={{
        backgroundColor: themeStyle.bg + 'E6',
        borderColor: themeStyle.text,
        boxShadow: `0 0 20px ${themeStyle.text}40`
      }}
    >
      <div className="h-8 bg-black/50 flex justify-between items-center px-2 border-b border-white/10 shrink-0">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => <div key={i} className="w-1.5 h-4 bg-slate-500 rounded-full"></div>)}
        </div>
        <div className="flex items-center gap-2">
          {canCustomize && (
            <button onClick={cycleTheme} className="text-[10px] uppercase font-bold text-white bg-white/20 px-2 py-1 rounded hover:bg-white/30 flex items-center gap-1">
              <Settings size={10} /> Skin
            </button>
          )}
          <button onClick={clearPage} className="text-white hover:text-red-400 transition-colors" title="Effacer la page">
            <Eraser size={14} />
          </button>
        </div>
      </div>

      <div className="flex bg-black/20 shrink-0">
        {['J1', 'J2', 'J3'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 font-bold text-xs border-r border-white/10 transition-all ${activeTab === tab ? 'opacity-100' : 'opacity-50 hover:opacity-80'}`}
            style={{ color: themeStyle.text, backgroundColor: activeTab === tab ? 'rgba(255,255,255,0.1)' : 'transparent' }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 relative p-4 overflow-hidden">
        <textarea
          value={notes[activeTab] || ''}
          onChange={handleNoteChange}
          placeholder={`// Notes du ${activeTab}...`}
          className="w-full h-full bg-transparent resize-none outline-none text-sm leading-[20px] font-bold"
          style={{
            fontFamily: "'Courier New', Courier, monospace",
            color: themeStyle.text,
            textShadow: `0 0 2px ${themeStyle.text}40`
          }}
        />
        <div className="absolute bottom-2 right-2 text-[10px] font-bold uppercase flex items-center gap-1">
          {isSaving ? <span className="animate-pulse opacity-50" style={{ color: themeStyle.text }}>...</span> : <span className="flex items-center gap-1 opacity-70" style={{ color: themeStyle.text }}><Save size={10} /></span>}
        </div>
      </div>
    </div>
  );
};

const ChatSystem = ({ myName, myId, appId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMsgIdRef = useRef(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
    if (isOpen) {
      setHasUnread(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CHAT), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(msgs);

      if (msgs.length > 0) {
        const latest = msgs[msgs.length - 1];
        if (lastMsgIdRef.current && lastMsgIdRef.current !== latest.id) {
          playSound('message', false);
          if (!isOpenRef.current) {
            setHasUnread(true);
          }
        }
        lastMsgIdRef.current = latest.id;
      }
    });
    return () => unsubscribe();
  }, [appId]);

  useEffect(() => { if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isOpen]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_CHAT), {
      text: inputText.trim(), senderName: myName, senderId: myId, timestamp: Date.now()
    });
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myId), { lastActive: Date.now() });
    setInputText('');
  };

  return (
    <div className="relative z-50 flex items-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative transition-transform hover:scale-110 focus:outline-none z-50 mr-4"
      >
        <div className={`relative transition-all duration-500 ${hasUnread ? 'animate-bounce' : ''}`}>
          <WalkieTalkieIcon
            className={`w-16 h-24 md:w-20 md:h-28 drop-shadow-2xl filter transition-all duration-500 scale-[1.2]
                    ${hasUnread
                ? 'text-green-500 drop-shadow-[0_0_20px_rgba(74,222,128,0.9)]'
                : 'text-red-700 drop-shadow-[0_0_15px_rgba(185,28,28,0.6)]'}`}
          />
          {hasUnread && (
            <span className="absolute -top-4 -right-4 flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-green-500 border-4 border-black"></span>
            </span>
          )}
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-0 left-24 z-[70] w-80 h-96 bg-slate-950/95 border-2 border-slate-600 rounded-r-xl rounded-bl-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-10 origin-top-left">
          <div className="bg-slate-900 p-3 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <WalkieTalkieIcon className="w-5 h-5 text-slate-400" />
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-mono uppercase text-slate-300">CHANNEL 4</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white"><Minimize2 size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.senderId === myId ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="w-8 h-8 rounded border border-slate-700 bg-slate-800 overflow-hidden shrink-0">
                  <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(msg.senderName)}`} className="w-full h-full object-cover" />
                </div>
                <div className={`flex flex-col max-w-[75%] ${msg.senderId === myId ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-slate-500 uppercase font-bold mb-1">{msg.senderName}</span>
                  <div className={`p-2 rounded-lg text-sm font-mono break-words ${msg.senderId === myId ? 'bg-red-900/40 text-red-100 border border-red-800' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>{msg.text}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={sendMessage} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
            <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-mono" />
            <button type="submit" disabled={!inputText.trim()} className="p-2 bg-red-600 text-white rounded-lg"><Send size={18} /></button>
          </form>
        </div>
      )}
    </div>
  );
};

const CarAnimationOverlay = ({ name }) => {
  if (!name) return null;
  return (
    <div className="fixed bottom-10 left-[-200px] z-[9999] animate-drive-by pointer-events-none">
      <style>{`@keyframes driveBy { 0% { transform: translateX(0); } 100% { transform: translateX(120vw); } } .animate-drive-by { animation: driveBy 4s linear forwards; }`}</style>
      <div className="relative">
        <div className="absolute -top-16 left-10 bg-white text-black font-black italic px-4 py-2 rounded-xl border-4 border-black whitespace-nowrap animate-bounce">GO GO GO !<div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-r-4 border-b-4 border-black transform rotate-45"></div></div>
        <div className="absolute -top-8 left-4 w-16 h-16 rounded-full border-2 border-black overflow-hidden bg-slate-800 z-0"><img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`} className="w-full h-full object-cover" /></div>
        <div className="relative z-10"><div className="w-32 h-12 bg-red-600 rounded-t-xl border-4 border-black flex items-center justify-center"><div className="text-white font-bold text-xs uppercase tracking-widest">TURBO</div></div><div className="absolute -bottom-4 left-2 w-8 h-8 bg-black rounded-full border-4 border-gray-600 animate-spin"></div><div className="absolute -bottom-4 right-2 w-8 h-8 bg-black rounded-full border-4 border-gray-600 animate-spin"></div></div>
        <div className="absolute top-4 -left-10 flex flex-col gap-2"><div className="w-8 h-1 bg-white opacity-50"></div><div className="w-12 h-1 bg-white opacity-50"></div><div className="w-6 h-1 bg-white opacity-50"></div></div>
      </div>
    </div>
  );
};

const SpecialEffectsLayer = ({ activeEffect }) => {
  if (!activeEffect) return null;
  if (activeEffect.type === 'taunt') {
    return (
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center animate-in zoom-in duration-300">
        <div className="flex flex-col items-center">
          <div className="relative">
            <style>{`@keyframes twerk { 0%,100% {transform:rotate(0deg);} 25% {transform:rotate(-10deg) translateY(10px);} 75% {transform:rotate(10deg) translateY(10px);} }`}</style>
            <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(activeEffect.senderName)}`} className="w-64 h-64 md:w-96 md:h-96 object-cover drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]" style={{ animation: 'twerk 0.2s infinite' }} />
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-2 rounded-full font-bold uppercase whitespace-nowrap border border-red-500 animate-bounce">{activeEffect.senderName} te nargue !</div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const CelebrationOverlay = ({ name, title, type = 'player', icon = '👍' }) => {
  const theme = getThemeFromName(name);
  const avatarSeed = type === 'coach' ? 'CoachStrangerThings80s' : name;
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=solid&backgroundColor=transparent`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-300 backdrop-blur-md">
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-end gap-4 mb-6">
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-2xl border-4 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden animate-bounce bg-slate-800" style={{ borderColor: theme.primary }}>
            <img src={avatarUrl} alt="Winner" className="w-full h-full object-cover" />
          </div>
          <div className="text-6xl md:text-8xl animate-pulse origin-bottom-left rotate-12 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">{icon}</div>
        </div>
        <h2 className="text-5xl md:text-8xl font-black tracking-widest uppercase scale-110 text-center px-4" style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}>{title}</h2>
        <h3 className="text-2xl md:text-4xl font-bold text-white mt-4 tracking-widest uppercase drop-shadow-lg bg-black/40 px-6 py-2 rounded-full border border-white/10">{type === 'coach' ? `POUR ${name}` : name}</h3>
      </div>
    </div>
  );
};

const PlayerCard = ({ player, rank, isLeader, onUpdate, onRequestDelete, onUsePower, isAdmin = false, showControls = true, bigMode = false, flashId, appId }) => {
  const isFlashing = flashId === player.id;
  const usedPowers = player.powersUsed || 0;
  const availableStock = Math.max(0, (player.rdvs || 0) - usedPowers);
  const nextPowerIndex = usedPowers % 3;
  const levelInfo = getLevelInfo(player.lifetimeRdvs || 0);
  const canCustomAvatar = levelInfo.lvl >= 3;
  const canCustomColor = levelInfo.lvl >= 5;
  const defaultTheme = getThemeFromName(player.name);
  const customTheme = canCustomColor && player.cardThemeIndex !== undefined ? THEMES[player.cardThemeIndex % THEMES.length] : defaultTheme;
  const avatarSeed = canCustomAvatar && player.avatarSeed ? player.avatarSeed : player.name;
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=solid&backgroundColor=transparent`;
  const nextPowerLabels = ["Wizz", "Shake", "Inverser"];
  const nextPowerLabel = nextPowerLabels[nextPowerIndex];
  const timeLabel = player.timeSpent ? `${Math.floor(player.timeSpent / 60)}h${player.timeSpent % 60}` : null;

  return (
    <div className={`relative bg-slate-900/10 backdrop-blur-md rounded-xl border-2 transition-all duration-300 overflow-hidden ${bigMode ? 'p-6 w-full max-w-md' : 'p-4'}`} style={{ borderColor: isFlashing ? '#4ade80' : customTheme.primary, boxShadow: isFlashing ? `0 0 50px #4ade80` : `0 0 15px ${customTheme.primary}40` }}>
      {player.rdvs >= 3 && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>}
      {isAdmin && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          <button onClick={(e) => { e.stopPropagation(); onRequestDelete(player); }} className="w-6 h-6 bg-red-600 rounded text-white flex items-center justify-center hover:bg-red-500"><Trash2 size={12} /></button>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className="relative group flex-shrink-0"><div className="w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 shadow-lg" style={{ borderColor: customTheme.primary, backgroundColor: customTheme.secondary }}><img src={avatarUrl} alt="Av" className="w-full h-full object-cover" /></div>{canCustomAvatar && showControls && !isAdmin && (<button onClick={() => { const newSeed = player.name + Math.random().toString(36).substring(7); updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, player.id), { avatarSeed: newSeed, lastActive: Date.now() }); playSound('click', false); }} className="absolute -bottom-2 -right-2 bg-slate-800 p-1 rounded-full border border-slate-600 text-white hover:bg-blue-600 animate-in zoom-in"><Settings size={10} /></button>)}</div>
        <div className="flex-1 min-w-0 flex flex-col justify-center py-1"><h2 className={`font-black truncate leading-none mb-1 ${bigMode ? 'text-2xl' : 'text-xl'}`} style={{ color: customTheme.primary }}>{player.name}</h2><div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-tight">{levelInfo.name}</div>{isAdmin && (<div className="flex items-center gap-2 mt-1"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${availableStock > 0 ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>POUVOIRS: {availableStock}</span>{availableStock > 0 ? (<span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-900/30 text-purple-400 border-purple-500/30">NEXT: {nextPowerLabel}</span>) : (<span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-900/20 text-red-500 border-red-500/20 opacity-50">ÉPUISÉ</span>)}</div>)}</div>
        <div className="flex flex-col items-center justify-center min-w-[40px] flex-shrink-0">{rank && <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-lg border bg-slate-800 text-slate-400 border-slate-700 mb-1`}>{rank === 1 ? <Crown size={20} className="text-yellow-500" /> : rank}</div>}<div className="text-xs uppercase font-black text-yellow-500 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-700/50 shadow-lg whitespace-nowrap">LVL {levelInfo.lvl}</div></div>
        {canCustomColor && showControls && !isAdmin && (<button onClick={() => { const nextIdx = ((player.cardThemeIndex || 0) + 1) % THEMES.length; updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, player.id), { cardThemeIndex: nextIdx, lastActive: Date.now() }); playSound('click', false); }} className="bg-slate-800 p-1.5 rounded border border-slate-600 text-white hover:bg-blue-600 self-center animate-in zoom-in"><Settings size={14} /></button>)}
      </div>
      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-between"><div className="flex justify-between items-start mb-1"><span className="text-[10px] text-slate-500 font-bold uppercase">Appels</span><Phone size={12} className="text-slate-600" /></div><div className="flex justify-between items-end"><span className="text-2xl font-mono text-white">{player.calls}</span>{(showControls || isAdmin) && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'calls', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'calls', 1)} className="w-8 h-8 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center"><Plus size={16} /></button></div>)}</div></div>
        <div className="rounded-lg p-3 border flex flex-col justify-between" style={{ borderColor: `${customTheme.primary}60`, background: `linear-gradient(135deg, ${customTheme.secondary}40, transparent)` }}><div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold uppercase" style={{ color: customTheme.primary }}>RDV</span><Trophy size={12} style={{ color: customTheme.primary }} /></div><div className="flex justify-between items-end"><span className="text-3xl font-mono font-bold" style={{ color: customTheme.primary }}>{player.rdvs}</span>{(showControls || isAdmin) && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'rdvs', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'rdvs', 1, true)} className="w-8 h-8 rounded text-black shadow-lg active:scale-95 flex items-center justify-center" style={{ backgroundColor: customTheme.primary }}><Plus size={18} strokeWidth={3} /></button></div>)}</div></div>
      </div>
      {timeLabel && (<div className="absolute bottom-2 right-2 z-20 bg-black/50 px-2 py-0.5 rounded text-[9px] text-slate-400 flex items-center gap-1 font-mono border border-slate-800"><Clock size={10} /> {timeLabel}</div>)}
      {bigMode && (<div className="flex justify-end mt-2 mb-1 relative z-10"><span className="inline-block bg-slate-900/80 px-3 py-1 rounded-full text-[10px] uppercase font-bold text-slate-400 border border-slate-800">Rang actuel : <strong className="text-white">#{rank}</strong></span></div>)}
      {(showControls || isAdmin) && bigMode && (
        <div className="mt-1 border-t border-slate-800 pt-3 relative z-10"><div className="flex justify-between items-center mb-2"><span className="text-[10px] font-bold uppercase text-slate-400">POUVOIRS ({availableStock} DISPO)</span></div><div className="grid grid-cols-3 gap-2"><button disabled={availableStock <= 0 || nextPowerIndex !== 0} onClick={() => onUsePower('taunt')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 0 ? 'bg-purple-900/50 border-purple-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><Move size={20} /><span className="text-[8px] font-bold uppercase">Wizz</span></button><button disabled={availableStock <= 0 || nextPowerIndex !== 1} onClick={() => onUsePower('wizz')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 1 ? 'bg-blue-900/50 border-blue-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><Zap size={20} /><span className="text-[8px] font-bold uppercase">Shake</span></button><button disabled={availableStock <= 0 || nextPowerIndex !== 2} onClick={() => onUsePower('upside')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 2 ? 'bg-red-900/50 border-red-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><RotateCw size={20} /><span className="text-[8px] font-bold uppercase">Inverser</span></button></div>{levelInfo.lvl >= 10 && (<button onClick={() => { addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_EVENTS), { type: 'manager_boost', senderName: player.name, timestamp: Date.now() }); alert("DEMANDE DE BOOST ENVOYÉE AU MANAGER !"); }} className="w-full mt-2 bg-gradient-to-r from-yellow-600 to-yellow-800 border border-yellow-500 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 animate-pulse"><Briefcase size={16} /> MANAGER BOOST (1H)</button>)}</div>
      )}
    </div>
  );
};

// ==========================================
// 3. COMPOSANT PRINCIPAL "HUB"
// ==========================================

const SuperAdminDashboard = ({ onClose }) => {
  const [adnPlayers, setAdnPlayers] = useState([]);
  const [madaPlayers, setMadaPlayers] = useState([]);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [resetConfirm, setResetConfirm] = useState(null);

  const handleUpdateStats = async (targetAppId, id, field, delta) => {
    const allPlayers = [...adnPlayers, ...madaPlayers];
    const player = allPlayers.find(p => p.id === id);
    if (!player) return;
    const currentVal = player[field] || 0;
    if (delta < 0 && currentVal === 0) return;
    const newVal = Math.max(0, currentVal + delta);
    const updates = { [field]: newVal, lastActive: Date.now() };
    if (field === 'rdvs') {
      if (delta > 0) updates.lifetimeRdvs = (player.lifetimeRdvs || 0) + 1;
      else if (delta < 0 && currentVal > 0) updates.lifetimeRdvs = Math.max(0, (player.lifetimeRdvs || 0) - 1);
    }
    await updateDoc(doc(db, 'artifacts', targetAppId, 'public', 'data', COLL_CURRENT, id), updates);
  };

  const handleUsePower = async (targetAppId, playerId, type) => {
    const allPlayers = [...adnPlayers, ...madaPlayers];
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) return;
    await updateDoc(doc(db, 'artifacts', targetAppId, 'public', 'data', COLL_CURRENT, playerId), { powersUsed: (player.powersUsed || 0) + 1, lastActive: Date.now() });
    await addDoc(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_EVENTS), { type, senderName: player.name, timestamp: Date.now() });
  };

  const handleConfirmDelete = async () => {
    if (deleteCode !== '240113') { alert("CODE INCORRECT"); return; }
    if (!playerToDelete) return;
    const targetAppId = playerToDelete.appId;
    await deleteDoc(doc(db, 'artifacts', targetAppId, 'public', 'data', COLL_CURRENT, playerToDelete.id));
    setPlayerToDelete(null);
    setDeleteCode('');
  };

  const handleDailyReset = async (targetAppId) => {
    try {
      const todayLabel = new Date().toLocaleDateString();
      // Fetch current players to save
      const playersSnap = await getDocs(query(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_CURRENT)));
      const playersToArchive = playersSnap.docs.map(d => d.data());

      const historyRef = collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_HISTORY);
      await addDoc(historyRef, { dateLabel: todayLabel, archivedAt: Date.now(), players: playersToArchive });

      const batch = writeBatch(db);
      playersSnap.forEach(d => batch.update(d.ref, { calls: 0, rdvs: 0, powersUsed: 0 }));
      const chatSnap = await getDocs(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_CHAT));
      chatSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      setResetConfirm(null);
    } catch (e) {
      console.error("Archive error", e);
    }
  };

  const handleShowArchives = (targetAppId) => {
    const q = query(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_HISTORY), orderBy('archivedAt', 'desc'), limit(20));
    getDocs(q).then(snap => {
      setHistoryList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSelectedArchive('LIST');
    });
  };

  const useTeamData = (appId, setPlayers) => {
    useEffect(() => {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT));
      const unsub = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => {
          const d = doc.data();
          const lastActive = d.lastActive || d.createdAt || Date.now();
          const createdAt = d.createdAt || lastActive;
          const timeSpent = Math.floor((Date.now() - createdAt) / (1000 * 60));
          return { id: doc.id, ...d, timeSpent, appId };
        });
        data.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0));
        setPlayers(data);
      });
      return () => unsub();
    }, [appId]);
  };

  useTeamData(CONFIGS.ADN.appId, setAdnPlayers);
  useTeamData(CONFIGS.CALL.appId, setMadaPlayers);

  const renderTeamSection = (config, players, colorClass, bgClass) => (
    <div className="relative flex-1 flex flex-col border-b-8 border-black min-h-[60vh] overflow-hidden group">
      <div className="absolute inset-0 z-0">
        <img src={config.assets.background} className="w-full h-full object-cover opacity-40 transition-transform duration-[20s] ease-in-out group-hover:scale-110" />
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"></div>
      </div>
      <div className="relative z-10 flex flex-col h-full">
        <div className={`p-6 border-b border-white/10 flex justify-between items-center bg-black/40 backdrop-blur-md shadow-xl sticky top-0 z-20`}>
          <div className="flex items-center gap-4">
            <h2 className={`text-4xl font-black ${colorClass} tracking-tighter drop-shadow-lg`} style={{ fontFamily: 'serif' }}>{config.title}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold bg-black/50 border ${colorClass.replace('text', 'border')} text-white flex items-center gap-2`}>
              <Users size={12} /> {players.length} AGENTS
            </span>
          </div>
          <div className="flex gap-4 text-right items-center">
            <button onClick={() => handleShowArchives(config.appId)} className={`p-3 rounded-xl bg-black/50 border border-slate-700 text-slate-400 hover:text-white hover:border-white transition-all`} title="Archives"><History size={20} /></button>
            {resetConfirm === config.appId ? (
              <button onClick={() => handleDailyReset(config.appId)} className="px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-xs animate-pulse border border-red-400 shadow-lg">CONFIRMER CLÔTURE</button>
            ) : (
              <button onClick={() => setResetConfirm(config.appId)} className={`p-3 rounded-xl bg-black/50 border border-red-900 text-red-500 hover:bg-red-900/50 hover:text-white transition-all`} title="Clôturer la journée"><CalendarCheck size={20} /></button>
            )}
            <div className="h-10 w-[1px] bg-slate-700 mx-2"></div>
            <div className="bg-black/40 px-4 py-2 rounded-lg border border-white/5">
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total Appels</div>
              <div className="text-2xl font-mono text-white font-bold">{players.reduce((a, c) => a + (c.calls || 0), 0)}</div>
            </div>
            <div className={`bg-black/40 px-4 py-2 rounded-lg border border-white/5 ${colorClass.replace('text', 'border')}`}>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Total RDV</div>
              <div className={`text-3xl font-mono ${colorClass} font-black`}>{players.reduce((a, c) => a + (c.rdvs || 0), 0)}</div>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-black/20">
          {players.map((p, i) => (
            <PlayerCard
              key={p.id}
              player={p}
              rank={i + 1}
              isLeader={i === 0}
              isAdmin={true}
              showControls={true}
              bigMode={false}
              appId={config.appId}
              onUpdate={(id, field, delta) => handleUpdateStats(config.appId, id, field, delta)}
              onUsePower={(type) => handleUsePower(config.appId, p.id, type)}
              onRequestDelete={(player) => setPlayerToDelete(player)}
            />
          ))}
          {players.length === 0 && (<div className="col-span-full text-center py-12 text-slate-500 italic">Aucun agent connecté dans ce secteur...</div>)}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex flex-col animate-in fade-in overflow-hidden font-mono">
      <div className="bg-black border-b border-red-900 p-3 flex justify-between items-center shadow-2xl z-50">
        <div className="flex items-center gap-4">
          <Activity className="text-red-500 animate-pulse" />
          <h1 className="text-xl font-black text-white tracking-[0.3em]">SUPER <span className="text-red-500">ADMIN</span> CONSOLE</h1>
        </div>
        <button onClick={onClose} className="bg-red-900/20 hover:bg-red-600 text-red-500 hover:text-white px-6 py-2 rounded border border-red-900 uppercase font-bold text-xs transition-all flex items-center gap-2"><X size={14} /> QUITTER</button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900 scrollbar-track-black">
        {renderTeamSection(CONFIGS.ADN, adnPlayers, "text-red-600")}
        {renderTeamSection(CONFIGS.CALL, madaPlayers, "text-yellow-500")}
      </div>

      {selectedArchive && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border-2 border-slate-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><History /> ARCHIVES</h3>
              <button onClick={() => setSelectedArchive(null)} className="p-2 hover:bg-slate-700 rounded-full text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedArchive === 'LIST' ? historyList.map((h) => (
                <div key={h.id} onClick={() => setSelectedArchive(h)} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors group">
                  <div><div className="text-white font-bold group-hover:text-yellow-400 transition-colors">{h.dateLabel}</div><div className="text-xs text-slate-500">{new Date(h.archivedAt).toLocaleTimeString()} • {h.players?.length || 0} Joueurs</div></div>
                  <div className="text-right"><div className="text-sm font-mono text-green-400">Appels: {h.players?.reduce((a, c) => a + (c.calls || 0), 0) || 0}</div><div className="text-sm font-mono text-red-400">RDV: {h.players?.reduce((a, c) => a + (c.rdvs || 0), 0) || 0}</div></div>
                </div>
              )) : (
                <div className="space-y-2">
                  <button onClick={() => setSelectedArchive('LIST')} className="mb-4 text-xs text-slate-400 hover:text-white flex items-center gap-1"><ArrowLeft size={12} /> Retour liste</button>
                  {selectedArchive.players?.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0)).map((p, i) => (
                    <div key={i} className="grid grid-cols-12 items-center p-3 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="col-span-1 flex justify-center"><div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded bg-slate-700 text-white`}>{i + 1}</div></div>
                      <div className="col-span-7 min-w-0 pl-2"><div className="font-bold text-white truncate text-sm">{p.name}</div></div>
                      <div className="col-span-2 text-center font-mono text-blue-400 font-bold text-sm">{p.calls || 0}</div>
                      <div className="col-span-2 text-right font-mono text-red-500 font-bold text-lg pr-2">{p.rdvs || 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {playerToDelete && (
        <div className="fixed inset-0 z-[250] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-red-600 p-8 rounded-2xl text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] w-full max-w-md relative overflow-hidden">
            <div className="absolute inset-0 bg-red-900/10 animate-pulse pointer-events-none"></div>
            <div className="relative z-10">
              <Skull className="mx-auto text-red-500 mb-4 w-16 h-16 animate-bounce" />
              <h3 className="text-2xl font-black text-white mb-2 uppercase">TERMINER L'AGENT ?</h3>
              <p className="text-red-400 font-bold text-xl mb-6">{playerToDelete.name}</p>
              <input type="password" value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} className="w-full bg-black border border-red-800 p-4 text-center text-white text-2xl tracking-[0.5em] mb-6 focus:outline-none focus:border-red-500 rounded-xl font-mono shadow-inner" placeholder="CODE" autoFocus />
              <div className="flex gap-4"><button onClick={() => { setPlayerToDelete(null); setDeleteCode(''); }} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl font-bold transition-all">ANNULER</button><button onClick={handleConfirmDelete} className="flex-1 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 text-white p-4 rounded-xl font-bold shadow-lg shadow-red-900/50 transition-all transform hover:scale-105">CONFIRMER</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StrangerPhoningGame = ({ config, onBack, onRequestSuperAdmin }) => {
  const [user, setUser] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [viewMode, setViewMode] = useState('splash');
  const [myPlayerId, setMyPlayerId] = useState(localStorage.getItem(`stranger_player_id_${config.id}`));

  const [loginStep, setLoginStep] = useState('NAME');
  const [joinName, setJoinName] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [inactivityAlert, setInactivityAlert] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isUpsideDown, setIsUpsideDown] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [activeSpecialEffect, setActiveSpecialEffect] = useState(null);
  const [flashId, setFlashId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [deleteCode, setDeleteCode] = useState('');
  const [celebration, setCelebration] = useState(null);
  const [carAnimation, setCarAnimation] = useState(null);
  const [levelUpNotification, setLevelUpNotification] = useState(null);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [powerNotification, setPowerNotification] = useState(null);
  const [showArchives, setShowArchives] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // États pour le Super Admin dans ce composant
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [superAdminCode, setSuperAdminCode] = useState('');

  // États pour la gestion des utilisateurs
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [newGeneratedPin, setNewGeneratedPin] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const isMutedRef = useRef(isMuted);
  const prevStatsRef = useRef({});
  const audioRef = useRef(null);
  const upsideDownTimerRef = useRef(null);

  // --- EFFETS SONORES & AMBIANCE ---
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      // La musique se lance en mode admin, mais pas en mode player
      if (viewMode === 'admin' && !isMusicMuted) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(e => { });
      } else {
        audioRef.current.pause();
      }
    }
  }, [viewMode, isMusicMuted]);

  // --- AUTHENTIFICATION ---
  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, u => setUser(u));
  }, []);

  // --- CHARGEMENT DES DONNÉES (EN TEMPS RÉEL) ---
  useEffect(() => {
    if (!user) return;
    // Écoute de la collection spécifique à l'équipe (config.appId)
    const q = query(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const newData = change.doc.data();
          const oldData = prevStatsRef.current[change.doc.id] || {};
          const oldRdv = oldData.rdvs || 0;
          const oldCalls = oldData.calls || 0;
          const oldLifetime = oldData.lifetimeRdvs || 0;

          // Level Up
          const oldLevel = getLevelInfo(oldLifetime);
          const newLevel = getLevelInfo(newData.lifetimeRdvs || 0);
          if (newLevel.lvl > oldLevel.lvl) {
            playSound('levelUp', isMutedRef.current);
            setLevelUpNotification({ name: newLevel.name, lvl: newLevel.lvl });
            setTimeout(() => setLevelUpNotification(null), 5000);
          }

          // RDV Animation
          if (newData.rdvs > oldRdv) {
            const cycle = newData.rdvs % 3;
            let title = "BRAVO";
            let type = "player";
            if (cycle === 2) { title = "CONTINUE !"; type = "coach"; }
            if (cycle === 0) { title = "AMAZING !!!"; type = "coach"; }

            setCelebration({ name: newData.name, title, type, icon: cycle === 0 ? "🚀" : (cycle === 2 ? "🔥" : "👍") });
            setTimeout(() => setCelebration(null), 3500);

            if (newData.rdvs > 0 && newData.rdvs % 3 === 0) {
              playSound('superJackpotFun', isMutedRef.current);
            } else {
              playSound('coin', isMutedRef.current);
            }
            setFlashId(change.doc.id);
            setTimeout(() => setFlashId(null), 800);
          }

          // Call Animation
          if (newData.calls > oldCalls) {
            if (newData.calls > 0 && newData.calls % 10 === 0) {
              setCarAnimation({ name: newData.name });
              playSound('carHorn', isMutedRef.current);
              setTimeout(() => setCarAnimation(null), 4000);
            }
          }
        }
      });

      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Mise à jour des références pour la comparaison
      const newRefMap = {};
      data.forEach(d => newRefMap[d.id] = { rdvs: d.rdvs || 0, calls: d.calls || 0, lifetimeRdvs: d.lifetimeRdvs || 0 });
      prevStatsRef.current = newRefMap;

      data.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0) || (b.calls || 0) - (a.calls || 0));
      setCollaborators(data);
    });

    return () => unsubscribe();
  }, [user, config.appId]);

  // --- ÉCOUTE DES ÉVÉNEMENTS (POUVOIRS) ---
  useEffect(() => {
    const q = query(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_EVENTS), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const event = snap.docs[0].data();
        if (Date.now() - event.timestamp < 5000) {
          if (event.type === 'taunt') {
            playSound('taunt', isMutedRef.current);
            setActiveSpecialEffect({ type: 'taunt', senderName: event.senderName });
            setTimeout(() => setActiveSpecialEffect(null), 4000);
          } else if (event.type === 'wizz') {
            playSound('wizz', isMutedRef.current);
            setIsShaking(true);
            setPowerNotification({ user: event.senderName, power: "SHAKE" });
            setTimeout(() => { setIsShaking(false); setPowerNotification(null); }, 3000);
          } else if (event.type === 'upside') {
            playSound('upside', isMutedRef.current);
            setIsUpsideDown(true);
            setPowerNotification({ user: event.senderName, power: "UPSIDE DOWN" });
            setTimeout(() => setPowerNotification(null), 3000);
            if (upsideDownTimerRef.current) clearTimeout(upsideDownTimerRef.current);
            upsideDownTimerRef.current = setTimeout(() => setIsUpsideDown(false), 60000);
          } else if (event.type === 'manager_boost') {
            playSound('coin', isMutedRef.current);
            setAdminNotifications(prev => [...prev, `${event.senderName} réclame son BOOST MANAGER !`]);
          }
        }
      }
    });
    return () => unsubscribe();
  }, [config.appId]);

  // --- ACTIONS UTILISATEUR ---

  const handleJoin = async (e) => {
    e.preventDefault();
    // Logique simplifiée pour l'exemple (Login en 2 étapes dans le code original)
    // ... (Reprendre la logique complète si nécessaire)
  };

  const handleJoinStep1 = (e) => {
    e.preventDefault();
    const name = joinName.trim();
    if (!name) return;
    playSound('click', isMuted);
    const existing = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) setLoginStep('AUTH_PIN'); else setLoginStep('CREATE_PIN');
  };

  const handleJoinStep2 = async (e) => {
    e.preventDefault();
    if (pinInput.length !== 6) { setPinError("Le code doit faire 6 chiffres"); playSound('error', isMuted); return; }
    playSound('click', isMuted);
    const name = joinName.trim();
    const now = Date.now();

    if (loginStep === 'CREATE_PIN') {
      const d = await addDoc(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT), {
        name, calls: 0, rdvs: 0, lifetimeRdvs: 0, powersUsed: 0, pin: pinInput, notes: { J1: '', J2: '', J3: '' }, createdAt: now, lastActive: now
      });
      setMyPlayerId(d.id);
      localStorage.setItem(`stranger_player_id_${config.id}`, d.id);
      setViewMode('player');
      setLoginStep('NAME');
      setPinInput('');
    }
    else if (loginStep === 'AUTH_PIN') {
      const existing = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing && existing.pin === pinInput) {
        if (existing.lastActive && (now - existing.lastActive > INACTIVITY_LIMIT)) {
          await updateDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, existing.id), { lifetimeRdvs: 0, lastActive: now });
          setInactivityAlert(true);
        } else {
          await updateDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, existing.id), { lastActive: now });
        }
        setMyPlayerId(existing.id);
        localStorage.setItem(`stranger_player_id_${config.id}`, existing.id);
        setViewMode('player');
        setLoginStep('NAME');
        setPinInput('');
      } else {
        setPinError("Code Incorrect !");
        playSound('error', isMuted);
        setPinInput('');
      }
    }
  };

  const updateStats = async (id, field, delta) => {
    const p = collaborators.find(c => c.id === id);
    const currentVal = p[field] || 0;
    if (delta < 0 && currentVal === 0) return;
    const newVal = Math.max(0, currentVal + delta);
    if (delta > 0) playSound('click', isMuted);
    const updates = { [field]: newVal, lastActive: Date.now() };
    if (field === 'rdvs') {
      if (delta > 0) updates.lifetimeRdvs = (p.lifetimeRdvs || 0) + 1;
      else if (delta < 0 && currentVal > 0) updates.lifetimeRdvs = Math.max(0, (p.lifetimeRdvs || 0) - 1);
    }
    await updateDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, id), updates);
  };

  const usePower = async (type) => {
    if (!myPlayerId) return;
    const me = collaborators.find(c => c.id === myPlayerId);
    await updateDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, myPlayerId), { powersUsed: (me.powersUsed || 0) + 1, lastActive: Date.now() });
    await addDoc(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_EVENTS), { type, senderName: me.name, timestamp: Date.now() });
  };

  const confirmDelete = async () => {
    if (deleteCode !== '240113') { alert("CODE ADMIN INCORRECT !"); return; }
    await deleteDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, playerToDelete.id));
    if (playerToDelete.id === myPlayerId) { localStorage.removeItem(`stranger_player_id_${config.id}`); setMyPlayerId(null); setViewMode('setup'); }
    setPlayerToDelete(null); setDeleteCode('');
  };

  const handleDailyReset = async () => {
    try {
      const todayLabel = new Date().toLocaleDateString();
      // Fetch current players to save
      const playersSnap = await getDocs(query(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT)));
      const playersToArchive = playersSnap.docs.map(d => d.data());

      const historyRef = collection(db, 'artifacts', config.appId, 'public', 'data', COLL_HISTORY);
      await addDoc(historyRef, { dateLabel: todayLabel, archivedAt: Date.now(), players: playersToArchive });

      const batch = writeBatch(db);
      playersSnap.forEach(d => batch.update(d.ref, { calls: 0, rdvs: 0, powersUsed: 0 }));
      const chatSnap = await getDocs(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_CHAT));
      chatSnap.forEach(d => batch.delete(d.ref));

      await batch.commit();
      setShowResetConfirm(false);
    } catch (e) {
      console.error("Archive error", e);
    }
  };

  const handleShowArchives = () => {
    const q = query(collection(db, 'artifacts', config.appId, 'public', 'data', COLL_HISTORY), orderBy('archivedAt', 'desc'), limit(20));
    getDocs(q).then(snap => {
      setHistoryList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSelectedArchive('LIST');
      setShowArchives(true); // CORRECTION: Activer l'affichage de la modale
    });
  };

  const cycleComputerTheme = async () => {
    if (!myPlayerId) return;
    const me = collaborators.find(c => c.id === myPlayerId);
    const nextTheme = ((me.computerThemeIndex || 0) + 1) % COMPUTER_THEMES.length;
    await updateDoc(doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, myPlayerId), { computerThemeIndex: nextTheme });
  };

  const handleSuperAdminLogin = (e) => {
    e.preventDefault();
    if (verifySuperAdmin(superAdminCode)) {
      setViewMode('admin');
      setShowSuperAdminLogin(false);
      setSuperAdminCode('');
    } else {
      alert("Accès refusé.");
      setSuperAdminCode('');
    }
  };

  const handleResetUserPin = (userId, userName) => {
    // Générer un nouveau PIN aléatoire à 6 chiffres
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    setSelectedUserForReset({ id: userId, name: userName });
    setNewGeneratedPin(newPin);
    setResetSuccess(false);
  };

  const confirmPinReset = async () => {
    try {
      await updateDoc(
        doc(db, 'artifacts', config.appId, 'public', 'data', COLL_CURRENT, selectedUserForReset.id),
        { pin: newGeneratedPin }
      );
      playSound('coin', isMuted);
      setResetSuccess(true);
      // Garder la modale ouverte 3 secondes pour afficher le succès, puis fermer
      setTimeout(() => {
        setSelectedUserForReset(null);
        setNewGeneratedPin('');
        setResetSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du PIN:', error);
      alert('Erreur lors de la réinitialisation du PIN.');
    }
  };

  const myPlayer = collaborators.find(c => c.id === myPlayerId);
  const upsideClass = isUpsideDown ? 'rotate-180 saturate-[0.2] brightness-[0.6] contrast-125 bg-black' : '';
  const shakeClass = isShaking ? 'animate-shake' : '';

  return (
    <div className={`min-h-screen text-white relative transition-all duration-1000 ease-in-out ${upsideClass} ${shakeClass}`}>
      <AppBackground url={config.assets.background} />
      {/* Audio Element */}
      <audio ref={audioRef} src={config.assets.music} loop />

      {/* Overlays */}
      <SpecialEffectsLayer activeEffect={activeSpecialEffect} />
      {levelUpNotification && <LevelUpOverlay levelName={levelUpNotification.name} levelNum={levelUpNotification.lvl} />}
      {celebration && <CelebrationOverlay name={celebration.name} title={celebration.title} type={celebration.type} icon={celebration.icon} />}
      {carAnimation && <CarAnimationOverlay name={carAnimation.name} />}

      {/* Modals */}
      {playerToDelete && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4">
          {/* ... Delete Modal Content ... */}
          <div className="bg-slate-900 border-2 border-red-600 p-8 rounded-2xl text-center">
            <h3 className="text-2xl font-black text-white mb-4">SUPPRIMER {playerToDelete.name} ?</h3>
            <input type="password" value={deleteCode} onChange={(e) => setDeleteCode(e.target.value)} className="w-full bg-black border border-red-800 p-2 text-center text-white mb-4" placeholder="CODE" />
            <div className="flex gap-2">
              <button onClick={() => setPlayerToDelete(null)} className="flex-1 bg-slate-700 p-2 rounded">ANNULER</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 p-2 rounded">CONFIRMER</button>
            </div>
          </div>
        </div>
      )}

      {/* Super Admin Login Modal */}
      {showSuperAdminLogin && (
        <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4">
          <div className="bg-red-950 border border-red-600 p-6 rounded-xl w-full max-w-sm text-center">
            <h3 className="text-red-500 font-black mb-4 uppercase tracking-widest">Sécurité Maximale</h3>
            <form onSubmit={handleSuperAdminLogin}>
              <input
                type="password"
                autoFocus
                className="w-full bg-black border border-red-800 text-white text-center p-2 rounded mb-4"
                placeholder="Code Maître"
                value={superAdminCode}
                onChange={(e) => setSuperAdminCode(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => { setShowSuperAdminLogin(false); setSuperAdminCode(''); }} className="flex-1 bg-slate-800 py-2 rounded text-xs">Annuler</button>
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded text-xs font-bold">Accéder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW: SPLASH */}
      {viewMode === 'splash' && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none">
          {/* BOUTON RETOUR AU HUB */}
          <button onClick={onBack} className="absolute top-6 left-6 z-30 text-slate-400 hover:text-white bg-black/50 p-2 rounded-lg text-xs uppercase flex items-center gap-2 border border-slate-700/50"><ArrowLeft size={14} /> RETOUR HUB</button>

          <img src={config.assets.splash} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div onClick={() => myPlayerId && collaborators.some(c => c.id === myPlayerId) ? setViewMode('player') : setViewMode('setup')} className="relative z-20 flex flex-col items-center cursor-pointer group">
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,1)] mb-8 animate-pulse text-center" style={{ fontFamily: 'serif' }}>{config.title}</h1>
            <div className="bg-black/50 p-4 rounded-xl border border-red-900/30"><p className="text-red-500 font-bold tracking-[0.3em] animate-bounce uppercase">Cliquer pour entrer</p></div>
          </div>
          {/* Bouton Mode Admin protégé par code super admin */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowSuperAdminLogin(true); }}
            className="absolute bottom-6 right-6 z-30 text-slate-400 hover:text-white bg-black/50 p-2 rounded-lg text-xs uppercase flex items-center gap-2 border border-slate-800 hover:border-red-500 transition-colors"
          >
            <Monitor size={14} /> Mode Admin
          </button>
        </div>
      )}

      {/* VIEW: ADMIN INTRO (VIDEO OR DIRECT) - NE SERA PLUS UTILISÉ MAIS GARDÉ POUR RÉFÉRENCE */}
      {viewMode === 'admin_intro' && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
          {config.hasVideoIntro ? (
            <>
              <button onClick={() => setViewMode('admin')} className="absolute top-4 right-4 z-50 text-white/20 hover:text-white"><SkipForward size={32} /></button>
              <video src={config.assets.video} autoPlay playsInline className="w-full h-full object-cover" onEnded={() => setViewMode('admin')} onError={() => setViewMode('admin')} />
            </>
          ) : (
            <button onClick={() => setViewMode('admin')} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl animate-pulse">ACCÉDER À LA CONSOLE</button>
          )}
        </div>
      )}

      {/* VIEW: ADMIN */}
      {viewMode === 'admin' && (
        // CORRECTION 2 : Ajout de Z-Index et d'un fond opaque
        <div className="min-h-screen p-6 animate-in fade-in duration-500 relative z-50 bg-slate-900/95 overflow-y-auto font-mono">
          <div className="flex justify-between items-center mb-8 bg-black/50 backdrop-blur-md p-4 rounded-xl border-b border-red-900/50 shadow-lg">
            <div>
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase" style={{ fontFamily: 'serif' }}>{config.title}</h1>
              <p className="text-slate-400 tracking-[0.5em] uppercase text-sm font-bold">Admin Console</p>
            </div>
            <div className="flex gap-8 text-center">
              <div><div className="text-xs text-slate-400 uppercase">Appels</div><div className="text-3xl font-mono text-blue-400 font-bold">{collaborators.reduce((a, c) => a + (c.calls || 0), 0)}</div></div>
              <div><div className="text-xs text-slate-400 uppercase">RDV</div><div className="text-4xl font-mono text-red-500 font-bold">{collaborators.reduce((a, c) => a + (c.rdvs || 0), 0)}</div></div>
            </div>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24`}>
            {/* CORRECTION 3 : État "Vide" si aucun joueur */}
            {collaborators.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 opacity-50">
                <Ghost size={48} className="mb-4 animate-pulse" />
                <p className="text-xl uppercase font-bold">Aucun agent détecté</p>
                <p className="text-sm font-mono">En attente de connexion...</p>
              </div>
            )}
            {collaborators.map((c, i) => (<PlayerCard key={c.id} player={c} rank={i + 1} isLeader={c.id === collaborators[0]?.id} onUpdate={updateStats} onRequestDelete={setPlayerToDelete} isAdmin={true} showControls={false} flashId={flashId} appId={config.appId} />))}
          </div>
          {/* Admin Toolbar */}
          <div className="fixed bottom-6 right-6 flex gap-3 z-[60] bg-slate-950 p-3 rounded-2xl border border-slate-700 shadow-2xl animate-in slide-in-from-bottom-4">
            <button onClick={() => setShowUserManagement(true)} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-400 hover:text-white transition-colors" title="Gestion Utilisateurs"><Users size={20} /></button>
            <button onClick={() => setIsUpsideDown(!isUpsideDown)} className="p-3 rounded-xl border bg-slate-900 border-slate-700 text-slate-400 hover:text-white transition-colors"><Ghost size={20} /></button>
            <button onClick={handleShowArchives} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"><History size={20} /></button>
            {showResetConfirm ? (
              <button onClick={handleDailyReset} className="px-4 py-3 rounded-xl bg-red-600 text-white font-bold text-xs animate-pulse border border-red-400 shadow-lg">CONFIRMER CLÔTURE</button>
            ) : (
              <button onClick={() => setShowResetConfirm(true)} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-red-500 hover:text-white transition-colors"><CalendarCheck size={20} /></button>
            )}
            <button onClick={() => setViewMode('splash')} className="p-3 rounded-xl bg-red-900/20 border border-red-900 text-red-500 hover:text-white transition-colors" title="Quitter"><LogOut size={20} /></button>
            <button onClick={() => setIsMusicMuted(!isMusicMuted)} className={`p-3 rounded-xl border transition-colors ${isMusicMuted ? 'text-slate-500 border-slate-700' : 'text-blue-400 border-blue-900 bg-blue-900/20'}`}><Music size={20} /></button>
          </div>
        </div>
      )}

      {/* VIEW: SETUP (LOGIN) */}
      {viewMode === 'setup' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-red-900/30 p-8 rounded-2xl">
            <h1 className="text-2xl font-black text-center mb-6 text-white">ACCÈS SÉCURISÉ</h1>
            {loginStep === 'NAME' && (
              <form onSubmit={handleJoinStep1} className="flex flex-col gap-4">
                <input autoFocus type="text" value={joinName} onChange={e => setJoinName(e.target.value)} className="bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl" placeholder="NOM DE CODE" />
                <button type="submit" disabled={!joinName.trim()} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl">SUIVANT</button>
              </form>
            )}
            {/* Steps CREATE_PIN and AUTH_PIN omitted for brevity but logic is same as before */}
            {(loginStep === 'CREATE_PIN' || loginStep === 'AUTH_PIN') && (
              <form onSubmit={handleJoinStep2} className="flex flex-col gap-4">
                <div className="text-center text-white mb-2">{loginStep === 'CREATE_PIN' ? 'CRÉER UN CODE (6 CHIFFRES)' : 'ENTREZ VOTRE CODE'}</div>
                <input autoFocus type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} className="bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl tracking-[0.5em]" placeholder="------" />
                {pinError && <div className="text-red-500 text-center">{pinError}</div>}
                <button type="submit" className="bg-blue-600 text-white font-bold py-4 rounded-xl">VALIDER</button>
              </form>
            )}
            <button onClick={() => setViewMode('splash')} className="w-full mt-4 text-slate-500 text-xs">Retour</button>
          </div>
        </div>
      )}

      {/* VIEW: PLAYER DASHBOARD */}
      {viewMode === 'player' && (
        <div className="min-h-screen flex flex-col p-4 pb-24 relative">
          {/* Header */}
          <div className="w-full max-w-6xl mx-auto flex items-start justify-between mb-8 relative z-40 pt-4">
            <div className="flex-shrink-0 relative z-50 mr-4 mt-12">
              <ChatSystem myName={myPlayer?.name} myId={myPlayerId} appId={config.appId} />
            </div>
            <div className="flex-1 flex flex-col items-center mx-4">
              <h1 className="text-3xl font-black text-red-600 mb-4 text-center" style={{ fontFamily: 'serif' }}>{config.title}</h1>
              <div className="w-full max-w-md">
                <PlayerCard player={myPlayer} rank={collaborators.findIndex(c => c.id === myPlayerId) + 1} isLeader={myPlayerId === collaborators[0]?.id} onUpdate={updateStats} onUsePower={usePower} bigMode={true} flashId={flashId} showControls={true} appId={config.appId} />
              </div>
            </div>
            <div className="flex gap-2 items-start relative z-50">
              <button onClick={() => setShowLeaderboard(true)} className="p-3 rounded-full border bg-slate-900 border-yellow-600 text-yellow-500"><Trophy size={28} /></button>
              <button onClick={() => { localStorage.removeItem(`stranger_player_id_${config.id}`); setMyPlayerId(null); setViewMode('setup'); }} className="p-3 rounded-full border bg-slate-900 border-slate-700 text-slate-400"><LogOut size={28} /></button>
            </div>
          </div>

          {/* Workspace */}
          <div className="flex-1 flex flex-col lg:flex-row justify-center items-start gap-8 w-full max-w-6xl mx-auto">
            <RetroComputer computerThemeIndex={myPlayer?.computerThemeIndex || 0} onUpdateTheme={cycleComputerTheme} canCustomize={getLevelInfo(myPlayer?.lifetimeRdvs).lvl >= 4} />
            <RetroNotepad myId={myPlayerId} initialData={myPlayer?.notes} myName={myPlayer?.name} currentLevel={getLevelInfo(myPlayer?.lifetimeRdvs)} noteThemeIndex={myPlayer?.noteThemeIndex || 0} appId={config.appId} />
          </div>
        </div>
      )}

      {/* GLOBAL MODALS (OUTSIDE VIEW LOGIC) */}
      {showArchives && (
        <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border-2 border-slate-700 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><History /> ARCHIVES</h3>
              <button onClick={() => { setShowArchives(false); setSelectedArchive(null); }} className="p-2 hover:bg-slate-700 rounded-full text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectedArchive === 'LIST' ? historyList.map((h) => (
                <div key={h.id} onClick={() => setSelectedArchive(h)} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors group">
                  <div><div className="text-white font-bold group-hover:text-yellow-400 transition-colors">{h.dateLabel}</div><div className="text-xs text-slate-500">{new Date(h.archivedAt).toLocaleTimeString()} • {h.players?.length || 0} Joueurs</div></div>
                  <div className="text-right"><div className="text-sm font-mono text-green-400">Appels: {h.players?.reduce((a, c) => a + (c.calls || 0), 0) || 0}</div><div className="text-sm font-mono text-red-400">RDV: {h.players?.reduce((a, c) => a + (c.rdvs || 0), 0) || 0}</div></div>
                </div>
              )) : (
                <div className="space-y-2">
                  <button onClick={() => setSelectedArchive('LIST')} className="mb-4 text-xs text-slate-400 hover:text-white flex items-center gap-1"><ArrowLeft size={12} /> Retour liste</button>
                  {selectedArchive.players?.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0)).map((p, i) => (
                    <div key={i} className="grid grid-cols-12 items-center p-3 bg-slate-800/50 rounded border border-slate-700/50">
                      <div className="col-span-1 flex justify-center"><div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded bg-slate-700 text-white`}>{i + 1}</div></div>
                      <div className="col-span-7 min-w-0 pl-2"><div className="font-bold text-white truncate text-sm">{p.name}</div></div>
                      <div className="col-span-2 text-center font-mono text-blue-400 font-bold text-sm">{p.calls || 0}</div>
                      <div className="col-span-2 text-right font-mono text-red-500 font-bold text-lg pr-2">{p.rdvs || 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER MANAGEMENT MODAL */}
      {showUserManagement && (
        <div className="fixed inset-0 z-[350] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl border-2 border-blue-600 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-blue-600/30 flex justify-between items-center bg-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Users className="text-blue-400" /> GESTION DES UTILISATEURS
              </h2>
              <button onClick={() => setShowUserManagement(false)} className="p-2 hover:bg-slate-700 rounded-full text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {collaborators.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Ghost size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Aucun utilisateur inscrit</p>
                </div>
              ) : (
                collaborators.map((user, idx) => (
                  <div key={user.id} className="bg-slate-800/80 p-4 rounded-lg flex items-center justify-between hover:bg-slate-800 transition-colors border border-slate-700/50">
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(user.avatarSeed || user.name)}&backgroundColor=transparent`}
                        className="w-12 h-12 rounded border border-slate-600 bg-slate-700"
                        alt={user.name}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-white text-lg">{user.name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-3">
                          <span>Dernière activité: {user.lastActive ? new Date(user.lastActive).toLocaleString('fr-FR') : 'Jamais'}</span>
                          <span>•</span>
                          <span className="text-blue-400">{getLevelInfo(user.lifetimeRdvs).name}</span>
                        </div>
                      </div>
                      <div className="text-right mr-4">
                        <div className="text-sm text-slate-400">Stats</div>
                        <div className="flex gap-3">
                          <span className="text-blue-400 font-mono font-bold">{user.calls || 0} appels</span>
                          <span className="text-red-400 font-mono font-bold">{user.rdvs || 0} RDV</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleResetUserPin(user.id, user.name)}
                      className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg"
                    >
                      <KeyRound size={16} />
                      Réinitialiser PIN
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN RESET CONFIRMATION MODAL */}
      {selectedUserForReset && (
        <div className="fixed inset-0 z-[400] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-orange-600 p-8 rounded-2xl max-w-md w-full shadow-[0_0_100px_rgba(234,88,12,0.5)]">
            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-green-400 mb-2">PIN RÉINITIALISÉ !</h3>
                <p className="text-slate-400">Le nouveau code a été enregistré.</p>
              </div>
            ) : (
              <>
                <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-2">
                  <KeyRound className="text-orange-500" />
                  RÉINITIALISER LE PIN
                </h3>
                <p className="text-white mb-2">
                  Utilisateur: <span className="font-bold text-orange-400">{selectedUserForReset.name}</span>
                </p>

                <div className="bg-black border border-orange-600 p-6 rounded-xl mb-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-900/20 to-red-900/20 animate-pulse"></div>
                  <div className="relative z-10">
                    <div className="text-xs text-slate-400 mb-2 uppercase font-bold text-center">Nouveau Code PIN</div>
                    <div className="text-4xl font-mono text-orange-400 tracking-[0.5em] text-center font-black select-all cursor-pointer">
                      {newGeneratedPin}
                    </div>
                  </div>
                </div>

                <div className="bg-orange-900/20 border border-orange-800 p-3 rounded-lg mb-6">
                  <p className="text-orange-400 text-sm flex items-start gap-2">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>Veuillez noter ce code et le communiquer à l'utilisateur. Il ne sera plus affiché après confirmation.</span>
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => { setSelectedUserForReset(null); setNewGeneratedPin(''); }}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 p-3 rounded-lg transition-colors font-bold"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirmPinReset}
                    className="flex-1 bg-orange-600 hover:bg-orange-500 p-3 rounded-lg font-bold transition-colors shadow-lg"
                  >
                    Confirmer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showLeaderboard && (
        <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 w-full max-w-md max-h-[80vh] rounded-2xl border-2 border-yellow-600 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(202,138,4,0.3)]">
            <div className="p-4 border-b border-yellow-600/30 flex justify-between items-center bg-slate-900">
              <h3 className="text-xl font-black text-yellow-500 flex items-center gap-2 uppercase tracking-wider"><Trophy /> CLASSEMENT</h3>
              <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><Minimize2 size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {collaborators.map((c, i) => (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${c.id === myPlayerId ? 'bg-yellow-900/20 border border-yellow-700/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                  <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-lg rounded ${i === 0 ? 'bg-yellow-500 text-black' : (i === 1 ? 'bg-slate-400 text-black' : (i === 2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'))}`}>
                    {i + 1}
                  </div>
                  <img src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(c.avatarSeed || c.name)}&backgroundColor=transparent`} className="w-8 h-8 rounded border border-slate-600 bg-slate-700" />
                  <div className="flex-1 min-w-0">
                    <div className={`font-bold truncate ${c.id === myPlayerId ? 'text-yellow-400' : 'text-slate-200'}`}>{c.name}</div>
                    <div className="text-[10px] text-slate-500 uppercase">{getLevelInfo(c.lifetimeRdvs).name}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-white">{c.rdvs} <span className="text-[10px] text-slate-500">RDV</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// ==========================================
// 5. COMPOSANT HUB (LE LAUNCHER)
// ==========================================

// --- FONCTION D'ARCHIVAGE AUTOMATIQUE ---
const performAutoArchive = async (targetAppId) => {
  try {
    const todayLabel = new Date().toLocaleDateString();
    const playersSnap = await getDocs(query(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_CURRENT)));
    const playersToArchive = playersSnap.docs.map(d => d.data());

    // Ne pas archiver s'il n'y a pas de joueurs
    if (playersToArchive.length === 0) return;

    const historyRef = collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_HISTORY);
    await addDoc(historyRef, {
      dateLabel: todayLabel,
      archivedAt: Date.now(),
      players: playersToArchive,
      autoArchive: true // Marqueur pour identifier les archives automatiques
    });

    const batch = writeBatch(db);
    playersSnap.forEach(d => batch.update(d.ref, { calls: 0, rdvs: 0, powersUsed: 0 }));
    const chatSnap = await getDocs(collection(db, 'artifacts', targetAppId, 'public', 'data', COLL_CHAT));
    chatSnap.forEach(d => batch.delete(d.ref));

    await batch.commit();
    console.log(`[AUTO-ARCHIVE] Archivage automatique effectué pour ${targetAppId} à ${new Date().toLocaleTimeString()}`);
  } catch (e) {
    console.error("[AUTO-ARCHIVE] Erreur lors de l'archivage automatique:", e);
  }
};

export default function App() {
  const [activeApp, setActiveApp] = useState(null);
  const [hoveredApp, setHoveredApp] = useState(null);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [showSuperAdminDashboard, setShowSuperAdminDashboard] = useState(false);
  const [superAdminCode, setSuperAdminCode] = useState('');

  const titleTimerRef = useRef(null);

  // --- ARCHIVAGE AUTOMATIQUE À 19H ---
  useEffect(() => {
    const checkAndArchive = async () => {
      const now = new Date();
      const currentHour = now.getHours();
      const todayKey = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      const lastArchiveKey = 'stranger_last_auto_archive';
      const lastArchiveDate = localStorage.getItem(lastArchiveKey);

      // Vérifier si c'est l'heure (19h) et si l'archivage n'a pas déjà été fait aujourd'hui
      if (currentHour === AUTO_ARCHIVE_HOUR && lastArchiveDate !== todayKey) {
        console.log(`[AUTO-ARCHIVE] Déclenchement de l'archivage automatique à ${now.toLocaleTimeString()}`);

        // Archiver les deux équipes
        await performAutoArchive(CONFIGS.ADN.appId);
        await performAutoArchive(CONFIGS.CALL.appId);

        // Marquer comme archivé pour aujourd'hui
        localStorage.setItem(lastArchiveKey, todayKey);
        console.log(`[AUTO-ARCHIVE] Archivage terminé pour toutes les équipes`);
      }
    };

    // Vérifier immédiatement au chargement
    checkAndArchive();

    // Vérifier toutes les minutes
    const intervalId = setInterval(checkAndArchive, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  // Gestion du clic long pour le Super Admin
  const handleTitleMouseDown = () => {
    titleTimerRef.current = setTimeout(() => {
      setShowSuperAdminLogin(true);
    }, 3000); // 3 secondes
  };

  const handleTitleMouseUp = () => {
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
  };

  const handleSuperAdminLogin = (e) => {
    e.preventDefault();
    if (verifySuperAdmin(superAdminCode)) {
      setShowSuperAdminDashboard(true);
      setShowSuperAdminLogin(false);
      setSuperAdminCode('');
    } else {
      alert("Accès refusé.");
    }
  };

  // Si le dashboard Super Admin est actif
  if (showSuperAdminDashboard) {
    return <SuperAdminDashboard onClose={() => setShowSuperAdminDashboard(false)} />;
  }

  // Si une app est sélectionnée
  if (activeApp) {
    return <StrangerPhoningGame config={CONFIGS[activeApp]} onBack={() => setActiveApp(null)} onRequestSuperAdmin={() => setShowSuperAdminLogin(true)} />;
  }

  // Sinon, on affiche le HUB
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black text-white font-mono">
      {/* FOND DYNAMIQUE */}
      <div className="absolute inset-0 z-0 transition-all duration-700 ease-in-out">
        {hoveredApp === 'ADN' && (
          <img src={CONFIGS.ADN.assets.splash} className="w-full h-full object-cover opacity-40 scale-105 transition-transform duration-1000" />
        )}
        {hoveredApp === 'CALL' && (
          <img src={CONFIGS.CALL.assets.splash} className="w-full h-full object-cover opacity-40 scale-105 transition-transform duration-1000" />
        )}
        {!hoveredApp && <div className="w-full h-full bg-slate-950"></div>}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* MODALE LOGIN SUPER ADMIN */}
      {showSuperAdminLogin && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="bg-red-950 border border-red-600 p-6 rounded-xl w-full max-w-sm text-center">
            <h3 className="text-red-500 font-black mb-4 uppercase tracking-widest">Sécurité Maximale</h3>
            <form onSubmit={handleSuperAdminLogin}>
              <input
                type="password"
                autoFocus
                className="w-full bg-black border border-red-800 text-white text-center p-2 rounded mb-4"
                placeholder="Code Maître"
                value={superAdminCode}
                onChange={(e) => setSuperAdminCode(e.target.value)}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowSuperAdminLogin(false)} className="flex-1 bg-slate-800 py-2 rounded text-xs">Annuler</button>
                <button type="submit" className="flex-1 bg-red-600 py-2 rounded text-xs font-bold">Accéder</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative z-10 text-center p-8 max-w-4xl w-full">
        {/* TITRE AVEC DÉCLENCHEUR SECRET */}
        <h1
          className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-500 mb-4 tracking-tighter cursor-default select-none active:scale-95 transition-transform"
          style={{ fontFamily: 'serif' }}
          onMouseDown={handleTitleMouseDown}
          onMouseUp={handleTitleMouseUp}
          onTouchStart={handleTitleMouseDown}
          onTouchEnd={handleTitleMouseUp}
        >
          STRANGER PHONING
        </h1>
        <p className="text-slate-400 mb-12 tracking-[0.5em] text-sm uppercase">Sélectionnez votre fréquence</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
          {/* BOUTON ADN (CLASSIQUE) */}
          <div
            className="group relative h-64 border-2 border-slate-700 rounded-2xl overflow-hidden cursor-pointer hover:border-red-600 transition-all duration-300 hover:scale-105"
            onMouseEnter={() => setHoveredApp('ADN')}
            onMouseLeave={() => setHoveredApp(null)}
            onClick={() => setActiveApp('ADN')}
          >
            <div className="absolute inset-0 bg-slate-900/80 group-hover:bg-red-900/20 transition-colors"></div>
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <Ghost size={64} className="text-slate-500 group-hover:text-red-500 mb-4 transition-colors duration-300" />
              <h2 className="text-3xl font-black text-white mb-2">ADN</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest group-hover:text-red-300">Équipe Classique</p>
            </div>
          </div>

          {/* BOUTON CALL (MADA) */}
          <div
            className="group relative h-64 border-2 border-slate-700 rounded-2xl overflow-hidden cursor-pointer hover:border-yellow-500 transition-all duration-300 hover:scale-105"
            onMouseEnter={() => setHoveredApp('CALL')}
            onMouseLeave={() => setHoveredApp(null)}
            onClick={() => setActiveApp('CALL')}
          >
            <div className="absolute inset-0 bg-slate-900/80 group-hover:bg-yellow-900/20 transition-colors"></div>
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <Globe size={64} className="text-slate-500 group-hover:text-yellow-500 mb-4 transition-colors duration-300" />
              <h2 className="text-3xl font-black text-white mb-2">CALL</h2>
              <p className="text-xs text-slate-400 uppercase tracking-widest group-hover:text-yellow-300">Équipe Mada</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 text-[10px] text-slate-600 uppercase">System v2.0 • Secure Connection</div>
    </div>
  );
}
