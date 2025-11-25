import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Plus, Volume2, VolumeX, Crown, Trophy, Monitor, 
  ArrowLeft, LogOut, Star, Calendar, Archive, 
  History, SkipForward, AlertCircle, Trash2, Music, Ghost, MessageSquare, 
  Send, Minimize2, Zap, Move, RotateCw, Save, Lock, KeyRound, Settings, Briefcase, Skull, Car, Eraser, Search, MapPin, Building, User, Users, DollarSign, FileText, CalendarCheck, ChevronLeft, Book, Maximize2, X, Radio
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, writeBatch, query, getDocs, orderBy, limit, where 
} from 'firebase/firestore';

// ==========================================
// CONFIGURATION FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyC9zC-MEA3bpP8gUHW3RdDixHf4o_DkB2k",
  authDomain: "strangersphoning.firebaseapp.com",
  projectId: "strangersphoning",
  storageBucket: "strangersphoning.firebasestorage.app",
  messagingSenderId: "28192352824",
  appId: "1:28192352824:web:09d9d5eae72c0853f954cd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ⚠️ ID UNIQUE POUR CETTE NOUVELLE APPLICATION (MADA) ⚠️
const appId = 'stranger-phoning-mada'; 

const COLL_CURRENT = 'stranger-phoning-team-v2';
const COLL_HISTORY = 'stranger-phoning-history';
const COLL_CHAT = 'strangers-phoning-chat-global';
const COLL_EVENTS = 'strangers-phoning-global-events';

// --- LEVELS SYSTEM ---
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

// --- ASSETS MADA (SANS VIDÉO) ---
const SPLASH_IMAGE_URL = "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/d938d76f01d070317e6d4f05b48e6c94c03e22b9/public/assets/images/madafond.jpeg";
const BACKGROUND_MAIN_URL = "https://raw.githubusercontent.com/Amchecoeur/vitejs-vite-kxwux9m2405/d938d76f01d070317e6d4f05b48e6c94c03e22b9/public/assets/images/madafond.jpeg";
const BACKGROUND_MUSIC_URL = "https://cdn.jsdelivr.net/gh/Amchecoeur/vitejs-vite-kxwux9m2405@2affcfe217a381cbe6563655379d7eef23d85951/public/assets/sounds/strangersthings.mp3";

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

// --- AUDIO ---
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
        return;
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
             {f: 392.00, d: 0.08}, {f: 523.25, d: 0.08}, {f: 659.25, d: 0.08}, 
             {f: 783.99, d: 0.08}, {f: 1046.50, d: 0.08}, {f: 1318.51, d: 0.08}, 
             {f: 1567.98, d: 0.3},
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
  } catch (e) {}
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

// --- COMPONENTS ---

const AppBackground = () => (
  <div className="fixed inset-0 z-[-1]">
    <img 
        src={BACKGROUND_MAIN_URL} 
        alt="Background" 
        className="w-full h-full object-cover" 
        onError={(e) => {e.target.style.display='none';}} 
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
                
                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)] animate-pulse mb-8">
                    LEVEL UP!!
                </h1>
                
                <div className="flex items-center gap-6 justify-center">
                    <div className="relative w-32 h-32">
                        <img 
                            src={`https://api.dicebear.com/9.x/pixel-art/svg?seed=Agent&backgroundColor=transparent`} 
                            alt="Level Up Avatar" 
                            className="w-full h-full rounded-full border-4 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] bg-slate-800"
                        />
                        <div className="absolute -top-10 -right-24 bg-white text-black font-black p-3 rounded-xl border-4 border-black whitespace-nowrap animate-bounce z-50">
                            Tu es au top !
                            <div className="absolute bottom-[-10px] left-4 w-4 h-4 bg-white border-r-4 border-b-4 border-black transform rotate-45"></div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800/80 border-2 border-yellow-500 px-8 py-4 rounded-xl text-center shadow-2xl transform rotate-1 mt-10">
                    <p className="text-yellow-200 font-bold text-sm uppercase tracking-widest mb-1">NOUVEAU RANG</p>
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
                     <button onClick={onUpdateTheme} className="text-neutral-500 hover:text-white p-1" title="Changer l'affichage"><Settings size={10}/></button>
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
                                     {searchResult.dirigeants && searchResult.dirigeants.length > 0 && (
                                        <div className={`mt-1 pt-1 border-t ${theme.border}`}>
                                            <div className="opacity-50 text-[8px]">DIRIGEANT:</div>
                                            <div>{searchResult.dirigeants[0].nom} {searchResult.dirigeants[0].prenoms}</div>
                                        </div>
                                     )}
                                     <div className={`mt-2 flex justify-between text-[9px] opacity-50 border-t ${theme.border} pt-1`}>
                                         <span>{searchResult.tranche_effectif_salarie || '?'} SALARIÉS</span>
                                         <span>{searchResult.etat_administratif}</span>
                                     </div>
                                 </div>
                             )}
                             {!searchResult && !isSearching && <div className="opacity-30 text-[9px] text-center mt-8">EN ATTENTE DE SAISIE...</div>}
                         </div>
                    </div>
                )}
                {mode === 'pagesjaunes' && (
                    <div className="flex flex-col h-full text-yellow-500">
                        {!pjActive ? (
                            <>
                                <div className="text-center text-[10px] mb-2 opacity-70 uppercase tracking-widest border-b border-yellow-900/50 pb-1">3615 PAGES JAUNES</div>
                                <form onSubmit={handlePagesJaunesSearch} className="space-y-2 flex-1 flex flex-col justify-center">
                                    <div>
                                        <label className="text-[9px] opacity-60 block mb-0.5">ACTIVITÉ / NOM</label>
                                        <input type="text" value={pjWhat} onChange={(e) => setPjWhat(e.target.value)} className="w-full bg-yellow-900/10 border border-yellow-800/50 text-yellow-400 px-2 py-1 focus:outline-none focus:border-yellow-600 uppercase" />
                                    </div>
                                    <div>
                                        <label className="text-[9px] opacity-60 block mb-0.5">LOCALITÉ</label>
                                        <input type="text" value={pjWhere} onChange={(e) => setPjWhere(e.target.value)} className="w-full bg-yellow-900/10 border border-yellow-800/50 text-yellow-400 px-2 py-1 focus:outline-none focus:border-yellow-600 uppercase" />
                                    </div>
                                    <button type="submit" className="w-full mt-4 border border-yellow-600 bg-yellow-900/20 text-yellow-500 py-2 hover:bg-yellow-600 hover:text-black transition-colors font-bold uppercase text-xs shadow-[0_0_10px_rgba(234,179,8,0.2)]">Lancer la Recherche</button>
                                </form>
                            </>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-center p-4 space-y-4">
                                <Radio size={48} className="animate-pulse text-yellow-500"/>
                                <div className="font-bold text-sm border-y border-yellow-900/50 py-2 w-full">
                                    LIAISON SATELLITE ACTIVE
                                </div>
                                <p className="text-[10px] opacity-70">
                                    TERMINAL SECONDAIRE OUVERT.<br/>
                                    CONSULTEZ LA FENÊTRE EXTERNE.
                                </p>
                                <button onClick={() => setPjActive(false)} className="mt-4 text-[9px] underline hover:text-white">NOUVELLE RECHERCHE</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="absolute bottom-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_5px_red] animate-pulse z-20"></div>
        </div>
        <div className="mt-2 text-center">
            <div className="text-neutral-400 font-bold text-[10px] tracking-widest uppercase">HAWK-9000</div>
        </div>
    </div>
  );
};

const RetroNotepad = ({ myId, initialData, myName, currentLevel, noteThemeIndex }) => {
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
      } catch (err) {}
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
      className="w-full max-w-md h-80 rounded-lg border-2 flex flex-col font-mono overflow-hidden relative transform rotate-1 lg:mt-0 mt-8 backdrop-blur-md transition-colors duration-500 shadow-2xl"
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
                <Settings size={10}/> Skin
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
          {isSaving ? <span className="animate-pulse opacity-50" style={{color: themeStyle.text}}>...</span> : <span className="flex items-center gap-1 opacity-70" style={{color: themeStyle.text}}><Save size={10}/></span>}
        </div>
      </div>
    </div>
  );
};

// --- CHAT SYSTEM (TALKIE GAUCHE - FENÊTRE DROITE - Z-INDEX MAX) ---
const ChatSystem = ({ myName, myId }) => {
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
  }, []);

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
    <div className="relative z-[60] flex items-start">
        {/* BOUTON TALKIE-WALKIE (GAUCHE) */}
        <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="relative transition-transform hover:scale-110 focus:outline-none z-[60] mr-4"
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

        {/* FENÊTRE DE CHAT (S'OUVRE À DROITE DU TALKIE) */}
        {isOpen && (
            <div className="absolute top-0 left-24 z-[70] w-80 h-96 bg-slate-950/95 border-2 border-slate-600 rounded-r-xl rounded-bl-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-left-10 origin-top-left">
                <div className="bg-slate-900 p-3 border-b border-slate-700 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <WalkieTalkieIcon className="w-5 h-5 text-slate-400"/>
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

const PlayerCard = ({ player, rank, isLeader, onUpdate, onRequestDelete, onUsePower, isAdmin = false, showControls = true, bigMode = false, flashId }) => {
  const isFlashing = flashId === player.id;
  const usedPowers = player.powersUsed || 0;
  const availableStock = Math.max(0, (player.rdvs || 0) - usedPowers);
  const nextPowerIndex = usedPowers % 3; 

  const levelInfo = getLevelInfo(player.lifetimeRdvs || 0);
  const canCustomAvatar = levelInfo.lvl >= 3;
  const canCustomColor = levelInfo.lvl >= 5;
  
  const defaultTheme = getThemeFromName(player.name);
  const customTheme = canCustomColor && player.cardThemeIndex !== undefined 
    ? THEMES[player.cardThemeIndex % THEMES.length] 
    : defaultTheme;
  
  const avatarSeed = canCustomAvatar && player.avatarSeed ? player.avatarSeed : player.name;
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=solid&backgroundColor=transparent`;

  const nextPowerLabels = ["Wizz", "Shake", "Inverser"];
  const nextPowerLabel = nextPowerLabels[nextPowerIndex];

  const cycleColor = async () => {
    if (!canCustomColor || isAdmin) return;
    const nextIdx = ((player.cardThemeIndex || 0) + 1) % THEMES.length;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, player.id), { cardThemeIndex: nextIdx, lastActive: Date.now() });
    playSound('click', false);
  };

  const randomizeAvatar = async () => {
    if (!canCustomAvatar || isAdmin) return;
    const newSeed = player.name + Math.random().toString(36).substring(7);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, player.id), { avatarSeed: newSeed, lastActive: Date.now() });
    playSound('click', false);
  };

  const activateBoost = async () => {
    if (levelInfo.lvl < 10) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_EVENTS), {
      type: 'manager_boost', senderName: player.name, timestamp: Date.now()
    });
    alert("DEMANDE DE BOOST ENVOYÉE AU MANAGER !");
  };

  return (
    <div 
      className={`relative bg-slate-900/10 backdrop-blur-md rounded-xl border-2 transition-all duration-300 overflow-hidden 
      ${bigMode ? 'p-6 w-full max-w-md' : 'p-4'}`}
      style={{ borderColor: isFlashing ? '#4ade80' : customTheme.primary, boxShadow: isFlashing ? `0 0 50px #4ade80` : `0 0 15px ${customTheme.primary}40` }}
    >
      {player.rdvs >= 3 && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>}
      
      {/* DELETE BUTTON MOVED TO BOTTOM RIGHT */}
      {isAdmin && <button onClick={(e) => { e.stopPropagation(); onRequestDelete(player); }} className="absolute bottom-3 right-3 z-[50] w-8 h-8 bg-slate-950/80 backdrop-blur rounded-full text-slate-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all border border-slate-700"><Trash2 size={14} /></button>}

      <div className="flex items-center gap-4 mb-4 relative z-10">
        {/* 1. AVATAR (GAUCHE) */}
        <div className="relative group flex-shrink-0">
            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 shadow-lg" style={{ borderColor: customTheme.primary, backgroundColor: customTheme.secondary }}><img src={avatarUrl} alt="Av" className="w-full h-full object-cover" /></div>
            {canCustomAvatar && showControls && !isAdmin && (
                <button onClick={randomizeAvatar} className="absolute -bottom-2 -right-2 bg-slate-800 p-1 rounded-full border border-slate-600 text-white hover:bg-blue-600 animate-in zoom-in" title="Changer Avatar"><Settings size={10}/></button>
            )}
        </div>
        
        {/* 2. NOM (CENTRE/GAUCHE) - HAUTEUR LIBRE POUR ÉVITER L'ÉCRASEMENT */}
        <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
            <h2 className={`font-black truncate leading-none mb-1 ${bigMode ? 'text-2xl' : 'text-xl'}`} style={{ color: customTheme.primary }}>{player.name}</h2>
            <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest leading-tight">{levelInfo.name}</div>
            
            {/* ADMIN POWER INFO */}
            {isAdmin && (
                <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${availableStock > 0 ? 'bg-green-900/30 text-green-400 border-green-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        POUVOIRS: {availableStock}
                    </span>
                    {availableStock > 0 ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-purple-900/30 text-purple-400 border-purple-500/30">
                            NEXT: {nextPowerLabel}
                        </span>
                    ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border bg-red-900/20 text-red-500 border-red-500/20 opacity-50">
                            ÉPUISÉ
                        </span>
                    )}
                </div>
            )}
        </div>

        {/* 3. RANK & LEVEL (DROITE) */}
        <div className="flex flex-col items-center justify-center min-w-[40px] flex-shrink-0">
            {rank && <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-black text-lg border bg-slate-800 text-slate-400 border-slate-700 mb-1`}>{rank === 1 ? <Crown size={20} className="text-yellow-500"/> : rank}</div>}
            <div className="text-xs uppercase font-black text-yellow-500 bg-yellow-900/30 px-2 py-0.5 rounded border border-yellow-700/50 shadow-lg whitespace-nowrap">LVL {levelInfo.lvl}</div>
        </div>
        
        {canCustomColor && showControls && !isAdmin && (
            <button onClick={cycleColor} className="bg-slate-800 p-1.5 rounded border border-slate-600 text-white hover:bg-blue-600 self-center animate-in zoom-in" title="Changer Couleur"><Settings size={14}/></button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1"><span className="text-[10px] text-slate-500 font-bold uppercase">Appels</span><Phone size={12} className="text-slate-600" /></div>
          <div className="flex justify-between items-end"><span className="text-2xl font-mono text-white">{player.calls}</span>{showControls && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'calls', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'calls', 1)} className="w-8 h-8 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center"><Plus size={16} /></button></div>)}</div>
        </div>
        <div className="rounded-lg p-3 border flex flex-col justify-between" style={{ borderColor: `${customTheme.primary}60`, background: `linear-gradient(135deg, ${customTheme.secondary}40, transparent)` }}>
          <div className="flex justify-between items-start mb-1"><span className="text-[10px] font-bold uppercase" style={{color: customTheme.primary}}>RDV</span><Trophy size={12} style={{color: customTheme.primary}} /></div>
          <div className="flex justify-between items-end"><span className="text-3xl font-mono font-bold" style={{color: customTheme.primary}}>{player.rdvs}</span>{showControls && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'rdvs', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'rdvs', 1, true)} className="w-8 h-8 rounded text-black shadow-lg active:scale-95 flex items-center justify-center" style={{ backgroundColor: customTheme.primary }}><Plus size={18} strokeWidth={3} /></button></div>)}</div>
        </div>
      </div>

      {/* Ajout du Rang Actuel ici */}
      {bigMode && (
        <div className="flex justify-end mt-2 mb-1 relative z-10">
            <span className="inline-block bg-slate-900/80 px-3 py-1 rounded-full text-[10px] uppercase font-bold text-slate-400 border border-slate-800">
                Rang actuel : <strong className="text-white">#{rank}</strong>
            </span>
        </div>
      )}

      {showControls && bigMode && (
        <div className="mt-1 border-t border-slate-800 pt-3 relative z-10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">POUVOIRS ({availableStock} DISPO)</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button disabled={availableStock <= 0 || nextPowerIndex !== 0} onClick={() => onUsePower('taunt')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 0 ? 'bg-purple-900/50 border-purple-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><Move size={20} /><span className="text-[8px] font-bold uppercase">Wizz</span></button>
            <button disabled={availableStock <= 0 || nextPowerIndex !== 1} onClick={() => onUsePower('wizz')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 1 ? 'bg-blue-900/50 border-blue-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><Zap size={20} /><span className="text-[8px] font-bold uppercase">Shake</span></button>
            <button disabled={availableStock <= 0 || nextPowerIndex !== 2} onClick={() => onUsePower('upside')} className={`p-3 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all ${availableStock > 0 && nextPowerIndex === 2 ? 'bg-red-900/50 border-red-500 text-white animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-600 opacity-50'}`}><RotateCw size={20} /><span className="text-[8px] font-bold uppercase">Inverser</span></button>
          </div>
          
          {levelInfo.lvl >= 10 && (
            <button onClick={activateBoost} className="w-full mt-2 bg-gradient-to-r from-yellow-600 to-yellow-800 border border-yellow-500 text-white font-bold text-xs py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 animate-pulse">
                <Briefcase size={16} /> MANAGER BOOST (1H)
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---
export default function StrangerPhoningUltimate() {
  const [user, setUser] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  // PERSISTENCE : On charge le mode de vue depuis le stockage local
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('stranger_view_mode') || 'splash');
  const [myPlayerId, setMyPlayerId] = useState(null);
  
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
  const [deleteCode, setDeleteCode] = useState(''); // NEW: Delete Code State
  const [celebration, setCelebration] = useState(null);
  const [carAnimation, setCarAnimation] = useState(null);
  const [levelUpNotification, setLevelUpNotification] = useState(null);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [powerNotification, setPowerNotification] = useState(null);
  const [showArchives, setShowArchives] = useState(false);
  const [selectedArchive, setSelectedArchive] = useState(null); // NEW: Selected Archive
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isMutedRef = useRef(isMuted);
  const prevStatsRef = useRef({});
  const audioRef = useRef(null);
  const upsideDownTimerRef = useRef(null);

  // PERSISTENCE : Sauvegarde du mode de vue à chaque changement
  useEffect(() => {
      localStorage.setItem('stranger_view_mode', viewMode);
  }, [viewMode]);

  // --- AUTO ARCHIVE LOGIC (18h00) ---
  const performDailyReset = async () => {
      try {
        const todayLabel = new Date().toLocaleDateString();
        // Check if archived already to prevent double archive
        const historyRef = collection(db, 'artifacts', appId, 'public', 'data', COLL_HISTORY);
        const q = query(historyRef, where('dateLabel', '==', todayLabel));
        const snap = await getDocs(q);
        
        if (!snap.empty) return; // Already archived

        // 1. Archive
        await addDoc(historyRef, { 
            dateLabel: todayLabel, 
            archivedAt: Date.now(), 
            players: collaborators 
        });
        
        // 2. Reset Counters
        const batch = writeBatch(db);
        const playersSnap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT)));
        playersSnap.forEach(d => batch.update(d.ref, { calls: 0, rdvs: 0, powersUsed: 0 }));
        
        // 3. Clear Chat (CORRECTION: DELETE ALL MESSAGES)
        const chatSnap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', COLL_CHAT));
        chatSnap.forEach(d => batch.delete(d.ref));
        
        await batch.commit();
        console.log("Auto-Archive completed");
      } catch (e) {
          console.error("Archive error", e);
      }
  };

  useEffect(() => {
      const checkTime = () => {
          const now = new Date();
          // Check if it is exactly 18:00 (allow a small window to catch it)
          if (now.getHours() === 18 && now.getMinutes() === 0) {
              performDailyReset();
          }
      };
      const interval = setInterval(checkTime, 30000); // Check every 30s
      return () => clearInterval(interval);
  }, [collaborators]); 

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      if (viewMode === 'admin' && !isMusicMuted) {
        audioRef.current.volume = 0.4;
        audioRef.current.play().catch(e => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [viewMode, isMusicMuted]);

  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, u => setUser(u));
    const savedId = localStorage.getItem('stranger_player_id');
    if (savedId) setMyPlayerId(savedId);
  }, []);

  useEffect(() => {
    if (showArchives) {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_HISTORY), orderBy('archivedAt', 'desc'), limit(20));
        getDocs(q).then(snap => {
            setHistoryList(snap.docs.map(d => ({id: d.id, ...d.data()})));
        });
    }
  }, [showArchives]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT));
    onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const newData = change.doc.data();
          const oldData = prevStatsRef.current[change.doc.id] || {};
          const oldRdv = oldData.rdvs || 0;
          const oldCalls = oldData.calls || 0;
          const oldLifetime = oldData.lifetimeRdvs || 0;
          
          // --- LEVEL UP DETECTION ---
          const oldLevel = getLevelInfo(oldLifetime);
          const newLevel = getLevelInfo(newData.lifetimeRdvs || 0);

          if (newLevel.lvl > oldLevel.lvl) {
              // Trigger Level Up
              playSound('levelUp', isMutedRef.current);
              setLevelUpNotification({ name: newLevel.name, lvl: newLevel.lvl });
              setTimeout(() => setLevelUpNotification(null), 5000);
          }

          // LOGIQUE RDV
          if (newData.rdvs > oldRdv) {
            const cycle = newData.rdvs % 3;
            let title = "BRAVO";
            let type = "player";
            if (cycle === 2) { title = "CONTINUE !"; type = "coach"; }
            if (cycle === 0) { title = "AMAZING !!!"; type = "coach"; }
            
            setCelebration({ name: newData.name, title, type, icon: cycle === 0 ? "🚀" : (cycle === 2 ? "🔥" : "👍") });
            setTimeout(() => setCelebration(null), 3500);
            
            // LOGIQUE SONORE MISE À JOUR
            if (newData.rdvs > 0 && newData.rdvs % 3 === 0) {
                playSound('superJackpotFun', isMutedRef.current);
            } else {
                playSound('coin', isMutedRef.current);
            }
            
            setFlashId(change.doc.id);
            setTimeout(() => setFlashId(null), 800);
          }

          // LOGIQUE APPELS
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
      const newRefMap = {};
      data.forEach(d => newRefMap[d.id] = { rdvs: d.rdvs || 0, calls: d.calls || 0, lifetimeRdvs: d.lifetimeRdvs || 0 });
      prevStatsRef.current = newRefMap;
      data.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0) || (b.calls || 0) - (a.calls || 0));
      setCollaborators(data);
    });
  }, [user]);

  useEffect(() => {
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_EVENTS), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const event = snap.docs[0].data();
        if (Date.now() - event.timestamp < 5000) {
          
          if (event.type === 'taunt') {
            playSound('taunt', isMutedRef.current);
            setActiveSpecialEffect({ type: 'taunt', senderName: event.senderName });
            setTimeout(() => setActiveSpecialEffect(null), 4000);
          } 
          else if (event.type === 'wizz') {
            playSound('wizz', isMutedRef.current);
            setIsShaking(true);
            setPowerNotification({ user: event.senderName, power: "SHAKE" }); // Afficher qui lance
            setTimeout(() => { setIsShaking(false); setPowerNotification(null); }, 3000);
          } 
          else if (event.type === 'upside') {
            playSound('upside', isMutedRef.current);
            setIsUpsideDown(true);
            setPowerNotification({ user: event.senderName, power: "UPSIDE DOWN" }); // Afficher qui lance
            setTimeout(() => setPowerNotification(null), 3000); // Cacher notification après 3s
            
            if (upsideDownTimerRef.current) clearTimeout(upsideDownTimerRef.current);
            upsideDownTimerRef.current = setTimeout(() => setIsUpsideDown(false), 60000);
          }
          else if (event.type === 'manager_boost') {
            playSound('coin', isMutedRef.current);
            setAdminNotifications(prev => [...prev, `${event.senderName} réclame son BOOST MANAGER !`]);
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
      const d = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT), { 
        name, calls: 0, rdvs: 0, lifetimeRdvs: 0, powersUsed: 0, pin: pinInput, notes: { J1: '', J2: '', J3: '' }, createdAt: now, lastActive: now 
      });
      setMyPlayerId(d.id);
      localStorage.setItem('stranger_player_id', d.id);
      setViewMode('player');
      setLoginStep('NAME');
      setPinInput('');
    } 
    else if (loginStep === 'AUTH_PIN') {
      const existing = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());
      if (existing && existing.pin === pinInput) {
        if (existing.lastActive && (now - existing.lastActive > INACTIVITY_LIMIT)) {
           await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, existing.id), { lifetimeRdvs: 0, lastActive: now });
           setInactivityAlert(true);
        } else {
           await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, existing.id), { lastActive: now });
        }
        setMyPlayerId(existing.id);
        localStorage.setItem('stranger_player_id', existing.id);
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
        if (delta > 0) {
            updates.lifetimeRdvs = (p.lifetimeRdvs || 0) + 1;
        } else if (delta < 0) {
            if (currentVal > 0) {
                 updates.lifetimeRdvs = Math.max(0, (p.lifetimeRdvs || 0) - 1);
            }
        }
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, id), updates);
  };

  const usePower = async (type) => {
    if (!myPlayerId) return;
    const me = collaborators.find(c => c.id === myPlayerId);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myPlayerId), { powersUsed: (me.powersUsed || 0) + 1, lastActive: Date.now() });
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_EVENTS), { type, senderName: me.name, timestamp: Date.now() });
  };

  const confirmDelete = async () => {
    if (playerToDelete) {
      // --- NEW: ADMIN CODE CHECK ---
      if (deleteCode !== '240113') {
          alert("CODE ADMIN INCORRECT ! ACCÈS REFUSÉ.");
          return;
      }

      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, playerToDelete.id));
      if (playerToDelete.id === myPlayerId) { localStorage.removeItem('stranger_player_id'); setMyPlayerId(null); setViewMode('setup'); }
      setPlayerToDelete(null);
      setDeleteCode('');
    }
  };

  const cycleComputerTheme = async () => {
    if (!myPlayerId) return;
    const me = collaborators.find(c => c.id === myPlayerId);
    if (!me) return;
    
    const currentTheme = me.computerThemeIndex || 0;
    const nextTheme = (currentTheme + 1) % COMPUTER_THEMES.length;
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, myPlayerId), { computerThemeIndex: nextTheme });
  };

  const myPlayer = collaborators.find(c => c.id === myPlayerId);
  const upsideClass = isUpsideDown ? 'rotate-180 saturate-[0.2] brightness-[0.6] contrast-125 bg-black' : '';
  const shakeClass = isShaking ? 'animate-shake' : '';
  const playerViewEffects = viewMode === 'player' ? `${upsideClass} ${shakeClass}` : '';

  return (
    <div className={`min-h-screen text-white transition-all duration-1000 ease-in-out relative ${playerViewEffects}`}>
      <style>{`@keyframes shake { 0%,100% {transform:translateX(0);} 10%,30%,50%,70%,90% {transform:translateX(-10px) translateY(5px);} 20%,40%,60%,80% {transform:translateX(10px) translateY(-5px);} } .animate-shake {animation:shake 0.5s cubic-bezier(.36,.07,.19,.97) both;}`}</style>
      <AppBackground />
      {isUpsideDown && <div className="fixed inset-0 pointer-events-none z-50"><div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div></div>}
      
      <audio ref={audioRef} src={BACKGROUND_MUSIC_URL} loop onError={() => console.log("Audio load error - check link validity")} />
      <SpecialEffectsLayer activeEffect={activeSpecialEffect} />
      {levelUpNotification && <LevelUpOverlay levelName={levelUpNotification.name} levelNum={levelUpNotification.lvl} />}
      {celebration && <CelebrationOverlay name={celebration.name} title={celebration.title} type={celebration.type} icon={celebration.icon} />}
      {carAnimation && <CarAnimationOverlay name={carAnimation.name} />}
      
      {/* --- UPDATED DELETE CONFIRMATION MODAL --- */}
      {playerToDelete && (
          <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-8 max-w-md w-full text-center shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                  <h3 className="text-2xl font-black mb-2 text-white">CONFIRMER SUPPRESSION ?</h3>
                  <p className="text-red-400 mb-6 font-bold uppercase tracking-wider">{playerToDelete.name}</p>
                  
                  <div className="mb-6">
                      <label className="block text-xs text-slate-500 uppercase mb-2 font-bold">Code de Sécurité Requis</label>
                      <input 
                          type="password" 
                          value={deleteCode}
                          onChange={(e) => setDeleteCode(e.target.value)}
                          placeholder="******"
                          autoFocus
                          className="w-full bg-black border border-red-800 text-white text-center text-2xl p-3 rounded font-mono tracking-[0.5em] focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-900"
                      />
                  </div>

                  <div className="flex gap-4">
                      <button onClick={() => {setPlayerToDelete(null); setDeleteCode('');}} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold transition-colors">ANNULER</button>
                      <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors shadow-lg shadow-red-900/20">SUPPRIMER</button>
                  </div>
              </div>
          </div>
      )}

      {/* INACTIVITY ALERT */}
      {inactivityAlert && (
          <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-8 max-w-md w-full text-center">
                  <Skull size={64} className="mx-auto text-red-500 mb-4 animate-bounce" />
                  <h3 className="text-2xl font-black mb-4 text-red-500">INACTIVITÉ DÉTECTÉE</h3>
                  <p className="text-slate-300 mb-6">Vous avez été absent plus de 15 jours. Vos niveaux ont été perdus dans le Monde à l'Envers.</p>
                  <button onClick={() => setInactivityAlert(false)} className="w-full py-3 bg-red-600 rounded font-bold">J'ACCEPTE MON SORT</button>
              </div>
          </div>
      )}

      {/* NOTIFICATION POUVOIR ADMIN (Grosse bannière) */}
      {viewMode === 'admin' && powerNotification && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] w-full bg-red-600/90 border-y-4 border-yellow-400 py-8 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(255,0,0,0.8)] animate-in zoom-in duration-300 pointer-events-none">
              <h2 className="text-4xl md:text-6xl font-black uppercase text-yellow-300 drop-shadow-lg text-center px-4 animate-pulse">
                  ⚠️ {powerNotification.user} ⚠️
              </h2>
              <h3 className="text-2xl md:text-4xl font-bold uppercase text-white mt-2 tracking-widest">
                  LANCE {powerNotification.power} !
              </h3>
          </div>
      )}

      {/* ADMIN NOTIFICATIONS (Boosts, etc.) */}
      {viewMode === 'admin' && adminNotifications.length > 0 && (
          <div className="fixed top-24 right-4 z-[80] space-y-2">
              {adminNotifications.map((notif, i) => (
                  <div key={i} className="bg-yellow-600 text-white p-4 rounded-lg shadow-lg border-2 border-yellow-400 animate-in slide-in-from-right font-bold flex items-center gap-2">
                      <Star className="animate-spin" /> {notif}
                  </div>
              ))}
              <button onClick={() => setAdminNotifications([])} className="text-xs text-slate-400 bg-black/50 px-2 py-1 rounded">Clear</button>
          </div>
      )}

      {/* ARCHIVES MODAL - LIST & DETAIL VIEW */}
      {showArchives && (
          <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-2xl max-h-[80vh] rounded-2xl border-2 border-slate-700 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                          <History /> {selectedArchive ? selectedArchive.dateLabel : 'ARCHIVES'}
                      </h3>
                      <div className="flex gap-2">
                          {selectedArchive && (
                              <button onClick={() => setSelectedArchive(null)} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold flex items-center gap-1 border border-slate-500">
                                  <ChevronLeft size={14}/> RETOUR
                              </button>
                          )}
                          <button onClick={() => {setShowArchives(false); setSelectedArchive(null);}} className="p-2 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white"><Minimize2 size={20}/></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {!selectedArchive ? (
                          // VUE LISTE
                          historyList.length === 0 ? <div className="text-center text-slate-500 italic py-10">Aucune archive trouvée.</div> : 
                          historyList.map((h) => (
                              <div key={h.id} onClick={() => setSelectedArchive(h)} className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center cursor-pointer hover:bg-slate-900 transition-colors group">
                                  <div>
                                      <div className="text-white font-bold group-hover:text-yellow-400 transition-colors">{h.dateLabel}</div>
                                      <div className="text-xs text-slate-500">{new Date(h.archivedAt).toLocaleTimeString()} • {h.players?.length || 0} Joueurs</div>
                                  </div>
                                  <div className="text-right">
                                      <div className="text-sm font-mono text-green-400">Appels: {h.players?.reduce((a,c)=>a+(c.calls||0),0) || 0}</div>
                                      <div className="text-sm font-mono text-red-400">RDV: {h.players?.reduce((a,c)=>a+(c.rdvs||0),0) || 0}</div>
                                  </div>
                              </div>
                          ))
                      ) : (
                          // VUE DÉTAIL
                          <div className="space-y-2">
                              <div className="grid grid-cols-12 text-xs text-slate-500 uppercase font-bold px-4 mb-2 border-b border-slate-800 pb-2">
                                  <div className="col-span-1 text-center">#</div>
                                  <div className="col-span-7">Agent</div>
                                  <div className="col-span-2 text-center">Appels</div>
                                  <div className="col-span-2 text-right">RDV</div>
                              </div>
                              {selectedArchive.players
                                  ?.sort((a, b) => (b.rdvs || 0) - (a.rdvs || 0) || (b.calls || 0) - (a.calls || 0))
                                  .map((p, i) => (
                                  <div key={i} className="grid grid-cols-12 items-center p-3 bg-slate-800/50 rounded border border-slate-700/50 hover:bg-slate-800 transition-colors">
                                      <div className="col-span-1 flex justify-center">
                                        <div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded ${i===0 ? 'bg-yellow-500 text-black' : (i===1 ? 'bg-slate-400 text-black' : (i===2 ? 'bg-orange-700 text-white' : 'bg-slate-900 text-slate-500'))}`}>
                                            {i+1}
                                        </div>
                                      </div>
                                      <div className="col-span-7 min-w-0 pl-2">
                                          <div className="font-bold text-white truncate text-sm">{p.name}</div>
                                          <div className="text-[9px] text-slate-500 uppercase">LVL {getLevelInfo(p.lifetimeRdvs).lvl} • {getLevelInfo(p.lifetimeRdvs).name}</div>
                                      </div>
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

      {/* LEADERBOARD MODAL */}
      {showLeaderboard && (
          <div className="fixed inset-0 z-[90] bg-black/95 flex flex-col items-center justify-center p-4">
              <div className="bg-slate-900 w-full max-w-md max-h-[80vh] rounded-2xl border-2 border-yellow-600 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(202,138,4,0.3)]">
                  <div className="p-4 border-b border-yellow-600/30 flex justify-between items-center bg-slate-900">
                      <h3 className="text-xl font-black text-yellow-500 flex items-center gap-2 uppercase tracking-wider"><Trophy /> CLASSEMENT</h3>
                      <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><Minimize2 size={20}/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2">
                      {collaborators.map((c, i) => (
                          <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${c.id === myPlayerId ? 'bg-yellow-900/20 border border-yellow-700/50' : 'bg-slate-800/50 border border-slate-700/50'}`}>
                              <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-black text-lg rounded ${i===0 ? 'bg-yellow-500 text-black' : (i===1 ? 'bg-slate-400 text-black' : (i===2 ? 'bg-orange-700 text-white' : 'bg-slate-800 text-slate-500'))}`}>
                                  {i+1}
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

      {/* --- VIEWS --- */}
      {viewMode === 'splash' && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none overflow-hidden">
          <img src={SPLASH_IMAGE_URL} className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div onClick={() => myPlayerId && collaborators.some(c => c.id === myPlayerId) ? setViewMode('player') : setViewMode('setup')} className="relative z-20 flex flex-col items-center cursor-pointer group">
            <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,1)] mb-8 animate-pulse text-center" style={{ fontFamily: 'serif' }}>STRANGER PHONING MADA</h1>
            <div className="bg-black/50 p-4 rounded-xl border border-red-900/30"><p className="text-red-500 font-bold tracking-[0.3em] animate-bounce uppercase">Cliquer pour entrer</p></div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setViewMode('admin_intro'); }} className="absolute bottom-6 right-6 z-30 text-slate-400 hover:text-white bg-black/50 p-2 rounded-lg text-xs uppercase"><Monitor size={14} /> Mode Admin</button>
        </div>
      )}

      {viewMode === 'admin_intro' && (
        // PAS DE VIDÉO -> REDIRECTION DIRECTE
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
             <button onClick={() => setViewMode('admin')} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl animate-pulse">ACCÉDER À LA CONSOLE</button>
        </div>
      )}

      {viewMode === 'admin' && (
        <div className="min-h-screen p-6 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center mb-8 bg-black/30 backdrop-blur-sm p-4 rounded-xl border-b border-red-900/30">
             <div><h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase" style={{ fontFamily: 'serif' }}>STRANGER PHONING MADA</h1><p className="text-slate-400 tracking-[0.5em] uppercase text-sm">Admin Console</p></div>
             <div className="flex gap-8 text-center">
               <div><div className="text-xs text-slate-400 uppercase">Appels</div><div className="text-3xl font-mono text-blue-400 font-bold">{collaborators.reduce((a,c)=>a+(c.calls||0),0)}</div></div>
               <div><div className="text-xs text-slate-400 uppercase">RDV</div><div className="text-4xl font-mono text-red-500 font-bold">{collaborators.reduce((a,c)=>a+(c.rdvs||0),0)}</div></div>
             </div>
          </div>
          {/* APPLICATON DES EFFETS UNIQUEMENT SUR LA GRILLE */}
          <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24 transition-all duration-1000 ${upsideClass} ${shakeClass}`}>
             {collaborators.map((c, i) => (<PlayerCard key={c.id} player={c} rank={i+1} isLeader={c.id === collaborators[0]?.id} onUpdate={updateStats} onRequestDelete={setPlayerToDelete} isAdmin={true} showControls={false} flashId={flashId} />))}
          </div>
          <div className="fixed bottom-6 right-6 flex gap-3 z-50 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
            <button onClick={() => setIsUpsideDown(!isUpsideDown)} className="p-3 rounded-xl border bg-slate-900 border-slate-700"><Ghost size={24}/></button>
            <button onClick={() => setShowArchives(true)} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"><History size={20}/></button>
            <button onClick={() => setViewMode('splash')} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400"><LogOut size={20}/></button>
            {!showResetConfirm ? (<button onClick={() => setShowResetConfirm(true)} className="p-3 rounded-xl bg-slate-900 border border-red-900/50 text-red-500 hover:bg-red-900/20"><CalendarCheck size={20}/></button>) : (<button onClick={async () => {
                // --- AUTO RESET FUNCTION CALLED MANUALLY HERE ---
                await performDailyReset();
                setShowResetConfirm(false);
            }} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs animate-pulse">CONFIRMER CLÔTURE</button>)}
            <button onClick={() => setIsMusicMuted(!isMusicMuted)} className={`p-3 rounded-xl border ${isMusicMuted ? 'text-slate-500' : 'text-blue-400'}`}><Music size={20}/></button>
          </div>
        </div>
      )}

      {viewMode === 'setup' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-red-900/30 p-8 rounded-2xl">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-2 text-center" style={{fontFamily: 'serif'}}>ACCÈS SÉCURISÉ</h1>
            {loginStep === 'NAME' && (
              <form onSubmit={handleJoinStep1} className="flex flex-col gap-4 mt-8">
                <input type="text" autoFocus value={joinName} onChange={(e) => setJoinName(e.target.value)} className="bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl font-mono uppercase" placeholder="NOM DE CODE" />
                <button type="submit" disabled={!joinName.trim()} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl">SUIVANT</button>
              </form>
            )}
            {loginStep === 'CREATE_PIN' && (
              <form onSubmit={handleJoinStep2} className="flex flex-col gap-4 mt-8 animate-in slide-in-from-right">
                <div className="text-center text-sm text-slate-300 mb-2">CRÉATION D'UN CODE D'ACCÈS (6 CHIFFRES)</div>
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" inputMode="numeric" maxLength={6} autoFocus value={pinInput} onChange={(e) => {setPinInput(e.target.value.replace(/\D/g,'')); setPinError('')}} className="w-full bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl font-mono tracking-[0.5em]" placeholder="------" /></div>
                {pinError && <div className="text-red-500 text-xs text-center font-bold">{pinError}</div>}
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><KeyRound size={20} /> CRÉER ET ENTRER</button>
                <button type="button" onClick={() => setLoginStep('NAME')} className="text-xs text-slate-500 underline text-center">Retour</button>
              </form>
            )}
            {loginStep === 'AUTH_PIN' && (
              <form onSubmit={handleJoinStep2} className="flex flex-col gap-4 mt-8 animate-in slide-in-from-right">
                <div className="text-center text-sm text-slate-300 mb-2">IDENTIFICATION REQUISE POUR <span className="text-red-400 font-bold">{joinName}</span></div>
                <div className="relative"><Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" /><input type="password" inputMode="numeric" maxLength={6} autoFocus value={pinInput} onChange={(e) => {setPinInput(e.target.value.replace(/\D/g,'')); setPinError('')}} className="w-full bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl font-mono tracking-[0.5em]" placeholder="------" /></div>
                {pinError && <div className="text-red-500 text-xs text-center font-bold">{pinError}</div>}
                <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><KeyRound size={20} /> DÉVERROUILLER</button>
                <button type="button" onClick={() => setLoginStep('NAME')} className="text-xs text-slate-500 underline text-center">Retour</button>
              </form>
            )}
            <button onClick={() => setViewMode('splash')} className="w-full mt-4 text-slate-400 text-xs">Retour Accueil</button>
          </div>
        </div>
      )}

      {viewMode === 'player' && (
        <div className="min-h-screen flex flex-col p-4 pb-24 relative">
          
          {/* --- HEADER BAR JOUEUR (MODIFIÉ) --- */}
          <div className="w-full max-w-6xl mx-auto flex items-start justify-between mb-8 relative z-40 pt-4">
              
              {/* GAUCHE: CHAT (Talkie-Walkie REVENU A SA PLACE) */}
              <div className="flex-shrink-0 relative z-50 mr-4">
                 <ChatSystem myName={myPlayer?.name} myId={myPlayerId} />
              </div>

              {/* CENTRE: TITRE & CARTE JOUEUR */}
              <div className="flex-1 flex flex-col items-center mx-4">
                  <h1 className="text-3xl font-black text-red-600 mb-4 text-center" style={{fontFamily: 'serif'}}>STRANGER PHONING MADA</h1>
                  <div className="w-full max-w-md">
                     <PlayerCard player={myPlayer} rank={collaborators.findIndex(c => c.id === myPlayerId) + 1} isLeader={myPlayerId === collaborators[0]?.id} onUpdate={updateStats} onUsePower={usePower} bigMode={true} flashId={flashId} showControls={true} />
                  </div>
              </div>

              {/* DROITE: ACTIONS (Trophée + Déco) */}
              <div className="flex gap-2 items-start relative z-50">
                 <button onClick={() => setShowLeaderboard(true)} className="p-3 rounded-full border bg-slate-900 border-yellow-600 text-yellow-500 hover:bg-yellow-900/50 transition-all hover:scale-110"><Trophy size={28} /></button>
                 <button onClick={() => {localStorage.removeItem('stranger_player_id'); setMyPlayerId(null); setViewMode('setup');}} className="p-3 rounded-full border bg-slate-900 border-slate-700 text-slate-400 hover:text-red-500 transition-all hover:scale-110"><LogOut size={28} /></button>
              </div>
          </div>
          
          {/* --- WORKSPACE (COMPUTER + NOTEPAD) --- */}
          <div className="flex-1 flex flex-col lg:flex-row justify-center items-start gap-8 w-full max-w-6xl mx-auto">
            
            {/* GAUCHE: ORDINATEUR (RECHERCHE) */}
            <RetroComputer 
                computerThemeIndex={myPlayer?.computerThemeIndex || 0} 
                onUpdateTheme={cycleComputerTheme}
                canCustomize={getLevelInfo(myPlayer?.lifetimeRdvs).lvl >= 4}
            />

            {/* DROITE: CARNET DE NOTES */}
            <RetroNotepad myId={myPlayerId} initialData={myPlayer?.notes} myName={myPlayer?.name} currentLevel={getLevelInfo(myPlayer?.lifetimeRdvs)} noteThemeIndex={myPlayer?.noteThemeIndex || 0} />

          </div>
        </div>
      )}
    </div>
  );
}
