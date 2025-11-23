import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, Plus, Volume2, VolumeX, Activity, Crown, Trophy, Monitor, 
  ArrowLeft, LogOut, Star, Calendar, ChevronDown, ChevronUp, Archive, 
  History, SkipForward, AlertCircle, Trash2, Music, Megaphone, Ghost, X, Check 
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, 
  onSnapshot, writeBatch, query, getDocs, orderBy 
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

// Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const appId = 'strangers-phoning-event-final';
const COLL_CURRENT = 'stranger-phoning-team-v2';
const COLL_HISTORY = 'stranger-phoning-history';

// --- ASSETS ---
const SPLASH_IMAGE_URL = "https://cdn.discordapp.com/attachments/1442142804544454748/1442250474442063902/IMG_1057.jpg?ex=6924bfec&is=69236e6c&hm=2e4500e8ff51822be8088777c704675756171d3d0b560ead4e53531d3cea34af&";
const INTRO_VIDEO_URL = "https://cdn.discordapp.com/attachments/1441718389356888116/1441718480696246293/aHR0cHM6Ly9hc3NldHMueC5haS91c2Vycy80ODc2Y2Y1Yi0zMGU4LTQ3YTUtOTExNS0xOTMyMDhmN2Q1MTcvZ2VuZXJhdGVkL2I5NGMwOTdlLTc5MTktNDg2YS05NjBhLWExOTZkZGQwN2YxMC9nZW5lcmF0ZWRfdmlkZW8ubXA0.mov?ex=692421f7&is=6922d077&hm=90b3bdde0f66249650494cde6bf9193efa26c7171befb02fe5f5de63088a7168&";
const BACKGROUND_MUSIC_URL = "https://cdn.discordapp.com/attachments/1441718389356888116/1442069978101583872/strangersthings.mp3?ex=692417d3&is=6922c653&hm=5e33346aa7ce1d08ab23e603d94527946aea3be5d22e112adcafc981af938de9&";
const BACKGROUND_MAIN_URL = "https://cdn.discordapp.com/attachments/1442142804544454748/1442232053394313296/Strangerthings_fond.jpg?ex=6924aec4&is=69235d44&hm=4daaa5089352d8b9cdce7beb12e9df281045296c24f0f4d72c738cc009ccfb1a&";

// --- SYSTEME DE COULEURS ---
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

const getThemeFromName = (name: string) => {
  if (!name) return THEMES[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % THEMES.length;
  return THEMES[index];
};

// --- MOTEUR AUDIO ---
const playSound = (type: string, muted: boolean) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number, vol = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    if (type === 'intro') {
      playTone(110, 'sawtooth', now, 1.5, 0.15);
      playTone(220, 'sine', now + 0.1, 1.0, 0.05);
    } else if (type === 'click') {
      playTone(800, 'triangle', now, 0.05, 0.02);
    } else if (type === 'jackpot') { 
      playTone(1200, 'sine', now, 0.4, 0.1);
      playTone(1600, 'sine', now + 0.1, 0.6, 0.1);
    } else if (type === 'superJackpot') { 
      const speed = 0.12;
      playTone(523.25, 'square', now, 0.4, 0.1);
      playTone(659.25, 'square', now + speed, 0.4, 0.1);
      playTone(783.99, 'square', now + speed * 2, 0.4, 0.1);
      playTone(1046.50, 'square', now + speed * 3, 0.4, 0.1);
      playTone(783.99, 'square', now + speed * 4, 0.4, 0.1);
      playTone(1046.50, 'square', now + speed * 5, 1.5, 0.2);
    } else if (type === 'carPass') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 1.5);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.5);
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

// --- COMPOSANT : FOND D'ECRAN GLOBAL ---
const AppBackground = () => (
  <div className="fixed inset-0 z-[-1]">
    <img src={BACKGROUND_MAIN_URL} alt="Background" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"></div>
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70"></div>
  </div>
);

// --- COMPOSANT : ECRAN BRAVO ---
const CelebrationOverlay = ({ name, title, type = 'player', icon = '👍' }: { name: string, title: string, type?: 'player' | 'coach', icon?: string }) => {
  const theme = getThemeFromName(name);
  const avatarSeed = type === 'coach' ? 'CoachStrangerThings80s' : name;
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}&backgroundType=solid&backgroundColor=transparent`;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center animate-in zoom-in duration-300 backdrop-blur-md">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(220,38,38,0.4)_0%,transparent_70%)] animate-pulse"></div>
      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-end gap-4 mb-6">
          <div 
            className={`w-32 h-32 md:w-48 md:h-48 rounded-2xl border-4 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden animate-bounce`}
            style={{ borderColor: theme.primary, backgroundColor: theme.secondary }}
          >
            <img src={avatarUrl} alt="Winner" className="w-full h-full object-cover" />
          </div>
          <div className="text-6xl md:text-8xl animate-pulse origin-bottom-left rotate-12 filter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            {icon}
          </div>
        </div>
        <h2 
          className="text-5xl md:text-8xl font-black tracking-widest uppercase scale-110 transform transition-transform text-center px-4"
          style={{ color: theme.primary, textShadow: `0 0 20px ${theme.primary}` }}
        >
          {title}
        </h2>
        <h3 className="text-2xl md:text-4xl font-bold text-white mt-4 tracking-widest uppercase drop-shadow-lg bg-black/40 px-6 py-2 rounded-full border border-white/10">
          {type === 'coach' ? `POUR ${name}` : name}
        </h3>
      </div>
    </div>
  );
};

// --- COMPOSANT : MODAL DE CONFIRMATION SUPPRESSION ---
const DeleteConfirmModal = ({ name, onConfirm, onCancel }: { name: string, onConfirm: () => void, onCancel: () => void }) => (
  <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200 backdrop-blur">
    <div className="bg-slate-900 border-2 border-red-600 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(220,38,38,0.5)] text-center">
      <AlertCircle size={64} className="mx-auto text-red-500 mb-4 animate-bounce" />
      <h3 className="text-2xl font-black text-white mb-2">ATTENTION !</h3>
      <p className="text-slate-300 mb-8 text-lg">
        Voulez-vous vraiment bannir <strong>{name}</strong> dans le Monde à l'Envers ? <br/>
        <span className="text-xs opacity-50">(Cette action est irréversible)</span>
      </p>
      <div className="flex gap-4">
        <button 
          onClick={onCancel}
          className="flex-1 py-4 rounded-xl bg-slate-800 text-white font-bold border border-slate-600 hover:bg-slate-700 transition-colors"
        >
          ANNULER
        </button>
        <button 
          onClick={onConfirm}
          className="flex-1 py-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 shadow-lg shadow-red-900/50 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={20} /> SUPPRIMER
        </button>
      </div>
    </div>
  </div>
);

// --- COMPOSANT : EFFET SPORES (MONDE A L'ENVERS) ---
const UpsideDownParticles = () => (
  <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
    {[...Array(30)].map((_, i) => (
      <div 
        key={i} 
        className="absolute rounded-full bg-gray-400/40 animate-pulse"
        style={{
          width: Math.random() * 4 + 1 + 'px',
          height: Math.random() * 4 + 1 + 'px',
          top: Math.random() * 100 + '%',
          left: Math.random() * 100 + '%',
          animation: `float ${Math.random() * 10 + 10}s linear infinite`,
          opacity: Math.random() * 0.5 + 0.2
        }}
      />
    ))}
    <style>{`
      @keyframes float {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 0.8; }
        90% { opacity: 0.8; }
        100% { transform: translateY(-100vh) translateX(${Math.random() * 50 - 25}px); opacity: 0; }
      }
    `}</style>
  </div>
);

// --- COMPOSANT CARTE JOUEUR ---
const PlayerCard = ({ player, rank, isLeader, onUpdate, onRequestDelete, isAdmin = false, showControls = true, bigMode = false, flashId }: any) => {
  const isFlashing = flashId === player.id;
  const theme = getThemeFromName(player.name);
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(player.name)}&backgroundType=solid&backgroundColor=transparent`;
  const borderColor = isFlashing ? '#4ade80' : (isLeader ? '#eab308' : theme.primary);
  const shadowStyle = isFlashing ? `0 0 50px #4ade80` : (isLeader ? `0 0 30px #eab308` : `0 0 15px ${theme.primary}40`);

  return (
    <div 
      className={`relative bg-slate-900/90 backdrop-blur-md rounded-xl border-2 transition-all duration-300 overflow-hidden 
      ${bigMode ? 'p-6 w-full max-w-md mx-auto' : 'p-4'}`}
      style={{ borderColor: borderColor, boxShadow: shadowStyle }}
    >
      {player.rdvs >= 3 && <div className="absolute inset-0 bg-white/5 animate-pulse pointer-events-none"></div>}
      
      {/* --- BOUTON SUPPRIMER (Declenche la modale) --- */}
      {isAdmin && (
        <button 
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            onRequestDelete(player); // Passe l'objet joueur entier
          }} 
          className="absolute top-3 right-3 z-[50] w-10 h-10 bg-slate-950 rounded-full text-slate-500 hover:text-white hover:bg-red-600 border border-slate-700 flex items-center justify-center transition-all shadow-lg"
          title="Supprimer le joueur"
        >
          <Trash2 size={18} />
        </button>
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {rank && (
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm border
              ${rank === 1 ? 'bg-yellow-500 text-black border-yellow-400' : 
                rank === 2 ? 'bg-slate-300 text-slate-900 border-slate-200' : 
                rank === 3 ? 'bg-orange-700 text-orange-100 border-orange-600' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>{rank === 1 ? <Crown size={14} /> : rank}</div>
          )}
          <div className="w-12 h-12 rounded-lg overflow-hidden border-2 flex-shrink-0" style={{ borderColor: theme.primary, backgroundColor: theme.secondary }}><img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" /></div>
          <h2 className={`font-bold truncate ${bigMode ? 'text-3xl' : 'text-lg'}`} style={{ color: theme.primary }}>{player.name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1"><span className="text-[10px] text-slate-500 font-bold uppercase">Appels</span><Phone size={12} className="text-slate-600" /></div>
          <div className="flex justify-between items-end"><span className="text-2xl font-mono text-white">{player.calls}</span>{showControls && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'calls', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'calls', 1)} className="w-8 h-8 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white flex items-center justify-center"><Plus size={16} /></button></div>)}</div>
        </div>
        <div className="rounded-lg p-3 border flex flex-col justify-between transition-colors duration-500" style={{ borderColor: `${theme.primary}60`, background: `linear-gradient(135deg, ${theme.secondary}40, transparent)` }}>
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] font-bold uppercase" style={{color: theme.primary}}>RDV</span>
            <div className="flex gap-1">
              {player.rdvs >= 3 && <Star size={12} className="animate-spin-slow" style={{color: theme.primary}} fill="currentColor"/>}
              <Trophy size={12} style={{color: theme.primary}} />
            </div>
          </div>
          <div className="flex justify-between items-end"><span className="text-3xl font-mono font-bold" style={{color: theme.primary}}>{player.rdvs}</span>{showControls && (<div className="flex gap-1"><button onClick={() => onUpdate(player.id, 'rdvs', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button><button onClick={() => onUpdate(player.id, 'rdvs', 1, true)} className="w-8 h-8 rounded text-black shadow-lg active:scale-95 flex items-center justify-center" style={{ backgroundColor: theme.primary, boxShadow: `0 0 10px ${theme.primary}` }}><Plus size={18} strokeWidth={3} /></button></div>)}</div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function StrangerPhoningFinal() {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState('splash');
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isUpsideDown, setIsUpsideDown] = useState(false);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<{name: string, title: string, type: 'player' | 'coach', icon: string} | null>(null);
  
  // --- ETAT POUR LA MODALE DE SUPPRESSION ---
  const [playerToDelete, setPlayerToDelete] = useState<any>(null);

  const isMutedRef = useRef(isMuted);
  const prevRdvsRef = useRef<{[key: string]: number}>({});
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      const shouldPlayMusic = viewMode === 'admin' && !isMusicMuted;
      if (shouldPlayMusic) {
        audioRef.current.volume = 0.4;
        if (audioRef.current.paused) audioRef.current.play().catch(e => console.log("Lecture auto bloquée", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [viewMode, isMusicMuted]);

  // 1. Auth
  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } 
      catch (err: any) { setErrorMsg("Erreur Connexion: " + (err).message); }
      setAuthLoading(false);
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if(u) setAuthLoading(false);
    });
    const savedId = localStorage.getItem('stranger_player_id');
    if (savedId) setMyPlayerId(savedId);
    return () => unsubscribe();
  }, []);

  // 2. Sync
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.metadata.hasPendingWrites) {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const newData = change.doc.data();
            const oldRdv = prevRdvsRef.current[change.doc.id] || 0;
            const newRdv = newData.rdvs || 0;

            if (newRdv > oldRdv) {
              const cycle = newRdv % 3;
              if (cycle === 1) {
                setCelebration({ name: newData.name, title: "BRAVO", type: 'player', icon: "👍" });
              } else if (cycle === 2) {
                setCelebration({ name: newData.name, title: "CONTINUE !", type: 'coach', icon: "🔥" });
              } else { 
                setCelebration({ name: newData.name, title: "AMAZING !!!", type: 'coach', icon: "🚀" });
              }
              setTimeout(() => setCelebration(null), 3500);

              if (newRdv > 0 && newRdv % 3 === 0) playSound('superJackpot', isMutedRef.current);
              else playSound('jackpot', isMutedRef.current);
              
              setFlashId(change.doc.id);
              setTimeout(() => setFlashId(null), 800);
            }
          }
        });
      }
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const newRefMap: any = {};
      data.forEach((d: any) => newRefMap[d.id] = d.rdvs || 0);
      prevRdvsRef.current = newRefMap;
      data.sort((a: any, b: any) => {
        if ((b.rdvs || 0) !== (a.rdvs || 0)) return (b.rdvs || 0) - (a.rdvs || 0);
        return (b.calls || 0) - (a.calls || 0);
      });
      setCollaborators(data);
    }, (err) => {
      if (user) setErrorMsg("Erreur Sync: Vérifiez vos règles Firestore");
    });
    return () => unsubscribe();
  }, [user]);

  // 3. History
  useEffect(() => {
    if (viewMode === 'history' && user) {
      const fetchHistory = async () => {
        try {
          const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_HISTORY), orderBy('archivedAt', 'desc'));
          const snap = await getDocs(q);
          setHistoryList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
      };
      fetchHistory();
    }
  }, [viewMode, user]);

  const startMusic = () => {
    if (audioRef.current) {
      // @ts-ignore
      audioRef.current.volume = 0.4;
      // @ts-ignore
      audioRef.current.play().catch(e => console.log("Autoplay bloqué", e));
    }
  };

  const handleAdminSequence = (e: any) => { e.stopPropagation(); playSound('click', isMuted); startMusic(); setViewMode('admin_intro'); };
  const onIntroEnded = () => { setViewMode('admin'); };
  const handlePlayerStart = () => { playSound('click', isMuted); startMusic(); if (myPlayerId && collaborators.some((c) => c.id === myPlayerId)) { setViewMode('player'); } else { setViewMode('setup'); } };

  const joinGame = async (e: any) => {
    e.preventDefault();
    const nameToJoin = joinName.trim();
    if (!nameToJoin) return;
    if (!user) { alert("Connexion..."); return; }
    try {
      playSound('click', isMuted);
      const existingPlayer = collaborators.find((c) => c.name.toLowerCase() === nameToJoin.toLowerCase());
      if (existingPlayer) {
        setMyPlayerId(existingPlayer.id);
        localStorage.setItem('stranger_player_id', existingPlayer.id);
        setJoinName('');
        setViewMode('player');
        alert(`Bon retour ${existingPlayer.name} !`);
      } else {
        const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT), {
          name: nameToJoin, calls: 0, rdvs: 0, createdAt: Date.now()
        });
        setMyPlayerId(docRef.id);
        localStorage.setItem('stranger_player_id', docRef.id);
        setJoinName('');
        setViewMode('player');
      }
    } catch (err: any) { alert("Erreur ajout : " + (err).message); }
  };

  // --- NOUVELLE FONCTION DE SUPPRESSION (SÛRE) ---
  const confirmDelete = async () => {
    if (!playerToDelete) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, playerToDelete.id));
      if (playerToDelete.id === myPlayerId) logout();
      setPlayerToDelete(null); // Ferme la modale
      playSound('click', isMuted);
    } catch (e: any) {
      alert("Erreur suppression: " + e.message);
    }
  };

  const updateStats = async (id: string, field: string, delta: number, isRdv = false) => {
    const player = collaborators.find((c) => c.id === id);
    if (!player) return;
    const newVal = Math.max(0, (player[field] || 0) + delta);
    
    if (delta > 0) {
      if (isRdv) {
        const cycle = newVal % 3;
        if (cycle === 1) {
          setCelebration({ name: player.name, title: "BRAVO", type: 'player', icon: "👍" });
        } else if (cycle === 2) {
          setCelebration({ name: player.name, title: "CONTINUE !", type: 'coach', icon: "🔥" });
        } else { 
          setCelebration({ name: player.name, title: "AMAZING !!!", type: 'coach', icon: "🚀" });
        }
        setTimeout(() => setCelebration(null), 3500);

        if (newVal > 0 && newVal % 3 === 0) playSound('superJackpot', isMuted);
        else playSound('jackpot', isMuted);
        setFlashId(id);
        setTimeout(() => setFlashId(null), 800);
      } else if (field === 'calls' && newVal > 0 && newVal % 10 === 0) {
         setCelebration({ name: player.name, title: "GO GO GO !!!", type: 'coach', icon: "📣" });
         setTimeout(() => setCelebration(null), 3500);
         playSound('carPass', isMuted);
      } else { 
        playSound('click', isMuted); 
      }
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, id), { [field]: newVal });
  };

  const archiveAndResetDay = async () => {
    const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const archiveData = {
      dateLabel: todayStr, archivedAt: Date.now(),
      totalCalls: collaborators.reduce((acc, c: any) => acc + (c.calls || 0), 0),
      totalRdvs: collaborators.reduce((acc, c: any) => acc + (c.rdvs || 0), 0),
      players: collaborators.map((c: any) => ({ name: c.name, calls: c.calls, rdvs: c.rdvs }))
    };
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', COLL_HISTORY), archiveData);
    const batch = writeBatch(db);
    const q = query(collection(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT));
    const snap = await getDocs(q);
    snap.docs.forEach((d) => batch.update(d.ref, { calls: 0, rdvs: 0 }));
    await batch.commit();
    setShowResetConfirm(false);
    playSound('success', isMuted);
  };

  const logout = () => { localStorage.removeItem('stranger_player_id'); setMyPlayerId(null); setViewMode('setup'); };

  const totalRdvs = collaborators.reduce((acc, c: any) => acc + (c.rdvs || 0), 0);
  const totalCalls = collaborators.reduce((acc, c: any) => acc + (c.calls || 0), 0);
  const leaderId = collaborators.length > 0 && collaborators[0].rdvs > 0 ? collaborators[0].id : null;
  const myPlayer = collaborators.find((c: any) => c.id === myPlayerId);
  const myRank = myPlayer ? collaborators.findIndex((c: any) => c.id === myPlayerId) + 1 : null;

  // Style du conteneur principal (Rotation Upside Down + Effet Dark)
  const mainContainerClass = `min-h-screen text-white transition-all duration-1000 ease-in-out relative 
    ${isUpsideDown 
       ? 'rotate-180 saturate-[0.2] brightness-[0.6] contrast-125 bg-black' 
       : 'bg-transparent'
    }`;
  
  if (errorMsg) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center"><div className="bg-red-900/20 border border-red-500 p-6 rounded-xl text-red-400"><AlertCircle className="mx-auto mb-4" size={48} /><h2 className="text-xl font-bold mb-2">Problème Config</h2><p className="whitespace-pre-wrap">{errorMsg}</p></div></div>;

  return (
    <div className={mainContainerClass}>
      {/* FOND D'ECRAN GLOBAL */}
      <AppBackground />

      {/* Effet de particules "Spores" en mode Upside Down */}
      {isUpsideDown && <UpsideDownParticles />}

      <audio ref={audioRef} src={BACKGROUND_MUSIC_URL} loop />
      
      {celebration && <CelebrationOverlay name={celebration.name} title={celebration.title} type={celebration.type} icon={celebration.icon} />}

      {/* MODALE DE SUPPRESSION PERSONNALISÉE */}
      {playerToDelete && (
        <DeleteConfirmModal 
          name={playerToDelete.name} 
          onConfirm={confirmDelete} 
          onCancel={() => setPlayerToDelete(null)} 
        />
      )}

      {viewMode === 'splash' && (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none overflow-hidden">
          <img src={SPLASH_IMAGE_URL} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,black_90%)] pointer-events-none z-10"></div>
          <div onClick={handlePlayerStart} className="relative z-20 flex flex-col items-center justify-center h-full cursor-pointer group px-4">
            <h1 className="text-5xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_15px_rgba(220,38,38,1)] mb-8 animate-pulse text-center" style={{ fontFamily: 'serif' }}>STRANGER PHONING</h1>
            <div className="mt-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-red-900/30"><p className="text-red-500 font-bold tracking-[0.3em] text-lg animate-bounce group-hover:text-red-400 uppercase">Cliquer pour entrer</p></div>
          </div>
          <button onClick={handleAdminSequence} className="absolute bottom-6 right-6 z-30 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs uppercase tracking-widest bg-black/50 p-2 rounded-lg backdrop-blur"><Monitor size={14} /> Mode Admin / TV</button>
        </div>
      )}

      {viewMode === 'admin_intro' && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"><button onClick={onIntroEnded} className="absolute top-4 right-4 z-50 text-white/20 hover:text-white transition-colors"><SkipForward size={32} /></button><video src={INTRO_VIDEO_URL} autoPlay playsInline className="w-full h-full object-cover" onEnded={onIntroEnded} onError={() => {console.log("Erreur vidéo, passage à l'admin"); onIntroEnded();}}/></div>
      )}

      {viewMode === 'admin' && (
        <div className="min-h-screen font-sans p-6 animate-in fade-in duration-1000">
          <div className="flex justify-between items-center mb-8 border-b border-red-900/30 pb-4 bg-black/30 backdrop-blur-sm p-4 rounded-xl">
             <div><h1 className="text-4xl md:text-7xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ fontFamily: 'serif' }}>STRANGER PHONING</h1><p className="text-slate-400 tracking-[0.5em] uppercase text-sm mt-1">Admin Console</p></div>
             <div className="flex gap-8 text-center"><div><div className="text-xs text-slate-400 uppercase">Appels</div><div className="text-3xl font-mono text-blue-400 font-bold">{totalCalls}</div></div><div><div className="text-xs text-slate-400 uppercase">RDV</div><div className="text-4xl font-mono text-red-500 font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{totalRdvs}</div></div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
             {collaborators.map((collab, index) => (
               <PlayerCard 
                 key={collab.id} 
                 player={collab} 
                 rank={index + 1} 
                 isLeader={collab.id === leaderId} 
                 onUpdate={updateStats} 
                 onRequestDelete={setPlayerToDelete} // Nouveau : passe l'objet à la modale
                 isAdmin={true} 
                 showControls={false} 
                 flashId={flashId} 
               />
             ))}
          </div>
          <div className="fixed bottom-6 right-6 flex gap-3 z-50 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
            <button onClick={() => setIsUpsideDown(!isUpsideDown)} className={`p-3 rounded-xl border transition-colors ${isUpsideDown ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`} title="Upside Down Mode"><Ghost size={24}/></button>
            <div className="w-px bg-slate-800 mx-1"></div>
            <button onClick={() => setViewMode('splash')} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800" title="Exit"><LogOut size={20}/></button>
            <button onClick={() => setViewMode('history')} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-400 hover:text-white hover:bg-blue-900/50 flex items-center gap-2" title="Historique"><History size={20}/> <span className="hidden md:inline text-xs font-bold uppercase">Archives</span></button>
            {!showResetConfirm ? (<button onClick={() => setShowResetConfirm(true)} className="p-3 rounded-xl bg-slate-900 border border-red-900/50 text-red-500 hover:bg-red-950 flex items-center gap-2" title="Clôturer Journée"><Archive size={20}/> <span className="hidden md:inline text-xs font-bold uppercase">Clôturer</span></button>) : (<div className="flex gap-2 animate-in slide-in-from-right-5"><button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">Annuler</button><button onClick={archiveAndResetDay} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]">CONFIRMER</button></div>)}
            <div className="w-px bg-slate-800 mx-1"></div>
            <button onClick={() => setIsMusicMuted(!isMusicMuted)} className={`p-3 rounded-xl border transition-colors ${isMusicMuted ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-blue-900/30 border-blue-500 text-blue-400'}`} title="Musique">{isMusicMuted ? <span className="relative"><Music size={20}/><span className="absolute top-0 right-0 text-red-500 text-xs font-bold">X</span></span> : <Music size={20}/>}</button>
            <button onClick={() => setIsMuted(!isMuted)} className={`p-3 rounded-xl border transition-colors ${isMuted ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-slate-800 border-slate-600 text-white'}`} title="Sons">{isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
          </div>
        </div>
      )}

      {viewMode === 'history' && (
        <div className="min-h-screen font-sans flex flex-col">
          <div className="sticky top-0 bg-slate-950/95 backdrop-blur z-50 border-b border-red-900/30 p-4 flex items-center justify-between">
            <div className="flex items-center gap-4"><button onClick={() => setViewMode(myPlayerId ? 'player' : 'admin')} className="bg-slate-900 p-2 rounded-full border border-slate-700 hover:text-white text-slate-400"><ArrowLeft size={20} /></button><h2 className="text-xl font-black text-red-600 tracking-wider flex items-center gap-2"><Archive size={20} /> ARCHIVES</h2></div>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="max-w-2xl mx-auto space-y-4">
               {historyList.length === 0 && (<div className="text-center text-slate-500 py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed"><Calendar className="mx-auto mb-2 opacity-50" size={32} />Aucune archive.</div>)}
               {historyList.map((item) => (
                 <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                   <button onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"><div className="flex items-center gap-4"><div className="bg-slate-800 p-2 rounded text-slate-400"><Calendar size={18} /></div><div className="text-left"><div className="font-bold text-white capitalize text-sm md:text-base">{item.dateLabel}</div><div className="text-xs text-slate-500">{item.totalRdvs} RDV • {item.totalCalls} Appels</div></div></div>{expandedHistoryId === item.id ? <ChevronUp size={18} className="text-slate-500"/> : <ChevronDown size={18} className="text-slate-500"/>}</button>
                   {expandedHistoryId === item.id && (<div className="p-4 bg-slate-950/50 border-t border-slate-800 animate-in slide-in-from-top-2"><table className="w-full text-sm"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-2 font-normal uppercase text-[10px]">Joueur</th><th className="text-right py-2 font-normal uppercase text-[10px]">Calls</th><th className="text-right py-2 font-normal uppercase text-[10px]">RDV</th></tr></thead><tbody>{item.players.sort((a: any, b: any) => b.rdvs - a.rdvs).map((p: any, idx: number) => (<tr key={idx} className="border-b border-slate-800/50 last:border-0"><td className="py-2 text-slate-300 font-medium flex items-center gap-2">{idx === 0 && <Crown size={12} className="text-yellow-500"/>} {p.name}</td><td className="py-2 text-right text-blue-400 font-mono">{p.calls}</td><td className="py-2 text-right text-yellow-500 font-bold font-mono">{p.rdvs}</td></tr>))}</tbody></table></div>)}
                 </div>
               ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'setup' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-red-900/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.1)]">
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-2 text-center" style={{fontFamily: 'serif'}}>QUI ES-TU ?</h1>
            <form onSubmit={joinGame} className="flex flex-col gap-4 mt-8">
              <input type="text" autoFocus value={joinName} onChange={(e) => setJoinName(e.target.value)} className="bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all" placeholder="Ton Prénom" />
              <button type="submit" disabled={!joinName.trim() || authLoading} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] flex justify-center items-center">{authLoading ? <Activity className="animate-spin" /> : "REJOINDRE"}</button>
              {authLoading && <p className="text-center text-xs text-slate-500 animate-pulse">Connexion au serveur...</p>}
            </form>
            <button onClick={() => setViewMode('splash')} className="w-full mt-4 text-slate-400 text-xs hover:text-slate-200">Retour</button>
          </div>
        </div>
      )}

      {viewMode === 'player' && (
        <div className="min-h-screen flex flex-col p-4 pb-24">
          {/* ZONE OUTILS JOUEUR (DÉCONNEXION + UPSIDE DOWN) */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
              <button onClick={logout} className="p-3 rounded-full border bg-slate-900 border-slate-700 text-slate-400 hover:text-red-500 transition-colors" title="Déconnexion">
                  <LogOut size={28} />
              </button>
              <button onClick={() => setIsUpsideDown(!isUpsideDown)} className={`p-3 rounded-full border transition-colors ${isUpsideDown ? 'bg-red-900/50 border-red-500 text-red-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`} title="Upside Down Mode">
                  <Ghost size={28}/>
              </button>
          </div>
          
          <div className="flex justify-between items-center mb-4"><h1 className="text-3xl font-black text-red-600" style={{fontFamily: 'serif'}}>STRANGER PHONING</h1></div>
          <div className="flex-1 flex flex-col justify-center"><PlayerCard player={myPlayer} rank={myRank} isLeader={myPlayer.id === leaderId} onUpdate={updateStats} bigMode={true} flashId={flashId} /><div className="mt-6 text-center"><span className="inline-block bg-slate-900/80 backdrop-blur border border-slate-700 px-4 py-2 rounded-full text-sm text-slate-400">Rang actuel : <strong className="text-white">#{myRank}</strong> / {collaborators.length}</span></div></div>
          <div className="mt-8 grid grid-cols-2 gap-4"><button onClick={() => setViewMode('leaderboard')} className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:bg-slate-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-colors"><Trophy size={24} className="text-yellow-500"/><span className="text-xs uppercase tracking-widest">Classement</span></button><button onClick={() => setViewMode('history')} className="bg-slate-900/80 backdrop-blur border border-slate-700 hover:bg-slate-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-colors"><History size={24} className="text-blue-400"/><span className="text-xs uppercase tracking-widest">Archives</span></button></div>
        </div>
      )}

      {viewMode === 'leaderboard' && (
        <div className="min-h-screen text-gray-100 p-4">
          <div className="flex items-center gap-4 mb-6 sticky top-0 z-50 py-4 border-b border-slate-800"><button onClick={() => setViewMode('player')} className="bg-slate-900 p-2 rounded-full border border-slate-700 hover:text-white text-slate-400"><ArrowLeft size={20} /></button><h2 className="text-xl font-bold">Classement Général</h2></div>
          <div className="space-y-3">{collaborators.map((collab, index) => (<div key={collab.id} className={`flex items-center p-3 rounded-lg border ${collab.id === myPlayerId ? 'bg-slate-800/80 border-red-500/50' : 'bg-slate-900/80 border-slate-800'} backdrop-blur-sm`}><div className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 mr-3 bg-slate-950 rounded">{index + 1}</div><div className="flex-1"><div className="font-bold text-white">{collab.name} {collab.id === myPlayerId && '(Moi)'}</div><div className="text-xs text-slate-500">{collab.calls} appels</div></div><div className="text-yellow-500 font-bold font-mono text-xl">{collab.rdvs} <span className="text-xs text-yellow-700">RDV</span></div></div>))}</div>
        </div>
      )}
    </div>
  );
}
