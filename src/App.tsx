import React, { useState, useEffect, useRef } from 'react';
import { Phone, Plus, Volume2, VolumeX, Activity, Crown, Trophy, Monitor, ArrowLeft, LogOut, Star, Calendar, ChevronDown, ChevronUp, Archive, History, SkipForward, AlertCircle, Trash2 } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, writeBatch, query, getDocs, orderBy } from 'firebase/firestore';

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
const SPLASH_IMAGE_URL = "https://cdn.discordapp.com/attachments/1441718389356888116/1441900637100183625/IMG_7437.jpg?ex=69237a1d&is=6922289d&hm=dd50abb6cd9a3becf85735ddf34286970b6cdb5adedf357270371f3e33789b37&";
const INTRO_VIDEO_URL = "https://cdn.discordapp.com/attachments/1441718389356888116/1441718480696246293/aHR0cHM6Ly9hc3NldHMueC5haS91c2Vycy80ODc2Y2Y1Yi0zMGU4LTQ3YTUtOTExNS0xOTMyMDhmN2Q1MTcvZ2VuZXJhdGVkL2I5NGMwOTdlLTc5MTktNDg2YS05NjBhLWExOTZkZGQwN2YxMC9nZW5lcmF0ZWRfdmlkZW8ubXA0.mov?ex=6922d077&is=69217ef7&hm=94f7038b46f00b34c1b4a267b45ca88d4bfebb4fa7df7ff06f42873f96415692&";

// --- MOTEUR AUDIO ---
const playSound = (type, muted) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const playTone = (freq, type, startTime, duration, vol = 0.1) => {
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
    }
  } catch (e) {
    console.error("Audio error", e);
  }
};

// --- COMPOSANT CARTE JOUEUR ---
const PlayerCard = ({ player, rank, isLeader, onUpdate, onDelete, isAdmin = false, showControls = true, bigMode = false, flashId }) => {
  const isFlashing = flashId === player.id;
  
  // Avatar Pixel Art
  const avatarUrl = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(player.name)}&backgroundType=solid&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <div className={`relative bg-slate-900 rounded-xl border transition-all duration-300 overflow-hidden 
      ${isFlashing ? 'border-green-400 shadow-[0_0_50px_rgba(74,222,128,0.5)] scale-[1.02] z-20 ring-2 ring-green-400' : isLeader ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.15)]' : 'border-slate-800'} 
      ${bigMode ? 'p-6 w-full max-w-md mx-auto' : 'p-4'}`
    }>
      {player.rdvs >= 3 && <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"></div>}
      
      {/* Bouton Poubelle (Admin) */}
      {isAdmin && (
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(player.id); }}
          className="absolute top-2 right-2 z-50 p-2 bg-slate-950/80 rounded-full text-slate-600 hover:text-red-500 border border-slate-800"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3 overflow-hidden">
          {rank && (
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm border
              ${rank === 1 ? 'bg-yellow-500 text-black border-yellow-400' : 
                rank === 2 ? 'bg-slate-300 text-slate-900 border-slate-200' : 
                rank === 3 ? 'bg-orange-700 text-orange-100 border-orange-600' : 'bg-slate-800 text-slate-500 border-slate-700'}
            `}>
              {rank === 1 ? <Crown size={14} /> : rank}
            </div>
          )}
          
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-700 bg-slate-800 flex-shrink-0">
            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <h2 className={`font-bold truncate ${bigMode ? 'text-2xl' : 'text-lg'} ${isLeader ? 'text-yellow-100' : 'text-white'}`}>
            {player.name}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 relative z-10">
        <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] text-slate-500 font-bold uppercase">Appels</span>
             <Phone size={12} className="text-slate-600" />
          </div>
          <div className="flex justify-between items-end">
             <span className="text-2xl font-mono text-blue-400">{player.calls}</span>
             {showControls && (
               <div className="flex gap-1">
                 <button onClick={() => onUpdate(player.id, 'calls', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button>
                 <button onClick={() => onUpdate(player.id, 'calls', 1)} className="w-8 h-8 rounded bg-blue-900/20 text-blue-400 border border-blue-900/30 hover:bg-blue-600 hover:text-white flex items-center justify-center">
                   <Plus size={16} />
                 </button>
               </div>
             )}
          </div>
        </div>

        <div className={`rounded-lg p-3 border flex flex-col justify-between transition-colors duration-500
            ${player.rdvs >= 3 
               ? 'bg-gradient-to-br from-yellow-900/20 to-red-900/20 border-yellow-500/50' 
               : 'bg-gradient-to-br from-slate-900 to-yellow-900/10 border-yellow-900/20'
            }
        `}>
          <div className="flex justify-between items-start mb-1">
             <span className="text-[10px] text-yellow-600/80 font-bold uppercase flex items-center gap-1">RDV</span>
             <div className="flex gap-1">
               {player.rdvs >= 3 && <Star size={12} className="text-yellow-400 animate-spin-slow" fill="currentColor"/>}
               <Trophy size={12} className="text-yellow-600" />
             </div>
          </div>
          <div className="flex justify-between items-end">
             <span className={`text-3xl font-mono font-bold ${player.rdvs > 0 ? 'text-yellow-400' : 'text-slate-600'}`}>{player.rdvs}</span>
             {showControls && (
               <div className="flex gap-1">
                 <button onClick={() => onUpdate(player.id, 'rdvs', -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-500 hover:text-white flex items-center justify-center">-</button>
                 <button onClick={() => onUpdate(player.id, 'rdvs', 1, true)} className="w-8 h-8 rounded bg-yellow-600 text-white shadow-[0_0_10px_rgba(202,138,4,0.4)] hover:bg-yellow-400 border border-yellow-500 active:scale-95 flex items-center justify-center">
                   <Plus size={18} strokeWidth={3} />
                 </button>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
export default function StrangersPhoningFinal() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [viewMode, setViewMode] = useState('splash');
  const [myPlayerId, setMyPlayerId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [flashId, setFlashId] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [joinName, setJoinName] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  const isMutedRef = useRef(isMuted);
  const prevRdvsRef = useRef({});

  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // 1. Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Auth Error", err);
        setErrorMsg("Erreur Connexion: " + err.message);
      }
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
              if (newRdv === 3) playSound('superJackpot', isMutedRef.current);
              else playSound('jackpot', isMutedRef.current);
              setFlashId(change.doc.id);
              setTimeout(() => setFlashId(null), 800);
            }
          }
        });
      }
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const newRefMap = {};
      data.forEach(d => newRefMap[d.id] = d.rdvs || 0);
      prevRdvsRef.current = newRefMap;
      data.sort((a, b) => {
        if ((b.rdvs || 0) !== (a.rdvs || 0)) return (b.rdvs || 0) - (a.rdvs || 0);
        return (b.calls || 0) - (a.calls || 0);
      });
      setCollaborators(data);
    }, (err) => {
      console.error("Sync Error", err);
      if (user) setErrorMsg("Erreur Sync: Vérifiez vos règles Firestore (Mode Test ?)");
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
        } catch (e) {
          console.error("History Error", e);
        }
      };
      fetchHistory();
    }
  }, [viewMode, user]);

  const handleAdminSequence = (e) => { e.stopPropagation(); playSound('click', isMuted); setViewMode('admin_intro'); };
  const onIntroEnded = () => { setViewMode('admin'); };
  const handlePlayerStart = () => { playSound('click', isMuted); if (myPlayerId && collaborators.some(c => c.id === myPlayerId)) { setViewMode('player'); } else { setViewMode('setup'); } };

  const joinGame = async (e) => {
    e.preventDefault();
    const nameToJoin = joinName.trim();
    if (!nameToJoin) return;
    if (!user) { alert("Connexion..."); return; }
    try {
      playSound('click', isMuted);
      const existingPlayer = collaborators.find(c => c.name.toLowerCase() === nameToJoin.toLowerCase());
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
    } catch (err) { alert("Erreur ajout : " + err.message); }
  };

  const deletePlayer = async (id) => {
    if (window.confirm("Supprimer ce joueur ?")) {
      try {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, id));
        if (id === myPlayerId) logout();
      } catch (e) { alert("Erreur suppression"); }
    }
  };

  const updateStats = async (id, field, delta, isRdv = false) => {
    const player = collaborators.find(c => c.id === id);
    if (!player) return;
    const newVal = Math.max(0, (player[field] || 0) + delta);
    if (delta > 0) {
      if (isRdv) {
        if (newVal === 3) playSound('superJackpot', isMuted);
        else playSound('jackpot', isMuted);
        setFlashId(id);
        setTimeout(() => setFlashId(null), 800);
      } else { playSound('click', isMuted); }
    }
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', COLL_CURRENT, id), { [field]: newVal });
  };

  const archiveAndResetDay = async () => {
    const todayStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const archiveData = {
      dateLabel: todayStr, archivedAt: Date.now(),
      totalCalls: collaborators.reduce((acc, c) => acc + (c.calls || 0), 0),
      totalRdvs: collaborators.reduce((acc, c) => acc + (c.rdvs || 0), 0),
      players: collaborators.map(c => ({ name: c.name, calls: c.calls, rdvs: c.rdvs }))
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

  const totalRdvs = collaborators.reduce((acc, c) => acc + (c.rdvs || 0), 0);
  const totalCalls = collaborators.reduce((acc, c) => acc + (c.calls || 0), 0);
  const leaderId = collaborators.length > 0 && collaborators[0].rdvs > 0 ? collaborators[0].id : null;
  const myPlayer = collaborators.find(c => c.id === myPlayerId);
  const myRank = myPlayer ? collaborators.findIndex(c => c.id === myPlayerId) + 1 : null;

  // VIEWS
  if (errorMsg) return <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8 text-center"><div className="bg-red-900/20 border border-red-500 p-6 rounded-xl text-red-400"><AlertCircle className="mx-auto mb-4" size={48} /><h2 className="text-xl font-bold mb-2">Problème Config</h2><p className="whitespace-pre-wrap">{errorMsg}</p></div></div>;

  if (viewMode === 'splash') {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center select-none overflow-hidden">
        <img src={SPLASH_IMAGE_URL} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_0%,black_90%)] pointer-events-none z-10"></div>
        <div onClick={handlePlayerStart} className="relative z-20 flex flex-col items-center justify-center h-full cursor-pointer group px-4">
          <h1 className="text-4xl md:text-6xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_10px_rgba(220,38,38,0.9)] mb-8 animate-pulse text-center" style={{ fontFamily: 'serif' }}>STRANGERS PHONING</h1>
          <div className="mt-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-red-900/30"><p className="text-red-500 font-bold tracking-[0.3em] text-lg animate-bounce group-hover:text-red-400 uppercase">Cliquer pour entrer</p></div>
        </div>
        <button onClick={handleAdminSequence} className="absolute bottom-6 right-6 z-30 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs uppercase tracking-widest bg-black/50 p-2 rounded-lg backdrop-blur"><Monitor size={14} /> Mode Admin / TV</button>
      </div>
    );
  }

  if (viewMode === 'admin_intro') return <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"><button onClick={onIntroEnded} className="absolute top-4 right-4 z-50 text-white/20 hover:text-white transition-colors"><SkipForward size={32} /></button><video src={INTRO_VIDEO_URL} autoPlay playsInline className="w-full h-full object-cover" onEnded={onIntroEnded} /></div>;

  if (viewMode === 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 font-sans p-6 animate-in fade-in duration-1000">
        <div className="flex justify-between items-center mb-8 border-b border-red-900/30 pb-4">
           <div><h1 className="text-3xl md:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-600 to-purple-600 uppercase drop-shadow-[0_0_5px_rgba(220,38,38,0.8)]" style={{ fontFamily: 'serif' }}>STRANGERS PHONING</h1><p className="text-slate-500 tracking-[0.5em] uppercase text-sm mt-1">Admin Console</p></div>
           <div className="flex gap-8 text-center"><div><div className="text-xs text-slate-500 uppercase">Appels</div><div className="text-3xl font-mono text-blue-400 font-bold">{totalCalls}</div></div><div><div className="text-xs text-slate-500 uppercase">RDV</div><div className="text-4xl font-mono text-red-500 font-bold drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">{totalRdvs}</div></div></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-24">
           {collaborators.map((collab, index) => (<PlayerCard key={collab.id} player={collab} rank={index + 1} isLeader={collab.id === leaderId} onUpdate={updateStats} onDelete={deletePlayer} isAdmin={true} showControls={false} flashId={flashId} />))}
        </div>
        <div className="fixed bottom-6 right-6 flex gap-3 z-50 bg-slate-950/90 p-3 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur">
          <button onClick={() => setViewMode('splash')} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800" title="Exit"><LogOut size={20}/></button>
          <div className="w-px bg-slate-800 mx-1"></div>
          <button onClick={() => setViewMode('history')} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-blue-400 hover:text-white hover:bg-blue-900/50 flex items-center gap-2" title="Historique"><History size={20}/> <span className="hidden md:inline text-xs font-bold uppercase">Archives</span></button>
          {!showResetConfirm ? (<button onClick={() => setShowResetConfirm(true)} className="p-3 rounded-xl bg-slate-900 border border-red-900/50 text-red-500 hover:bg-red-950 flex items-center gap-2" title="Clôturer Journée"><Archive size={20}/> <span className="hidden md:inline text-xs font-bold uppercase">Clôturer</span></button>) : (<div className="flex gap-2 animate-in slide-in-from-right-5"><button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs">Annuler</button><button onClick={archiveAndResetDay} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]">CONFIRMER</button></div>)}
          <div className="w-px bg-slate-800 mx-1"></div>
          <button onClick={() => setIsMuted(!isMuted)} className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white">{isMuted ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
        </div>
      </div>
    );
  }

  if (viewMode === 'history') {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 font-sans flex flex-col">
        <div className="sticky top-0 bg-slate-950/95 backdrop-blur z-50 border-b border-red-900/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4"><button onClick={() => setViewMode(myPlayerId ? 'player' : 'admin')} className="bg-slate-900 p-2 rounded-full border border-slate-700 hover:text-white text-slate-400"><ArrowLeft size={20} /></button><h2 className="text-xl font-black text-red-600 tracking-wider flex items-center gap-2"><Archive size={20} /> ARCHIVES</h2></div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-4">
             {historyList.length === 0 && (<div className="text-center text-slate-500 py-12 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed"><Calendar className="mx-auto mb-2 opacity-50" size={32} />Aucune archive.</div>)}
             {historyList.map((item) => (
               <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                 <button onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)} className="w-full flex items-center justify-between p-4 hover:bg-slate-800 transition-colors"><div className="flex items-center gap-4"><div className="bg-slate-800 p-2 rounded text-slate-400"><Calendar size={18} /></div><div className="text-left"><div className="font-bold text-white capitalize text-sm md:text-base">{item.dateLabel}</div><div className="text-xs text-slate-500">{item.totalRdvs} RDV • {item.totalCalls} Appels</div></div></div>{expandedHistoryId === item.id ? <ChevronUp size={18} className="text-slate-500"/> : <ChevronDown size={18} className="text-slate-500"/>}</button>
                 {expandedHistoryId === item.id && (<div className="p-4 bg-slate-950/50 border-t border-slate-800 animate-in slide-in-from-top-2"><table className="w-full text-sm"><thead><tr className="text-slate-500 border-b border-slate-800"><th className="text-left py-2 font-normal uppercase text-[10px]">Joueur</th><th className="text-right py-2 font-normal uppercase text-[10px]">Calls</th><th className="text-right py-2 font-normal uppercase text-[10px]">RDV</th></tr></thead><tbody>{item.players.sort((a, b) => b.rdvs - a.rdvs).map((p, idx) => (<tr key={idx} className="border-b border-slate-800/50 last:border-0"><td className="py-2 text-slate-300 font-medium flex items-center gap-2">{idx === 0 && <Crown size={12} className="text-yellow-500"/>} {p.name}</td><td className="py-2 text-right text-blue-400 font-mono">{p.calls}</td><td className="py-2 text-right text-yellow-500 font-bold font-mono">{p.rdvs}</td></tr>))}</tbody></table></div>)}
               </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'setup') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-red-900/30 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.1)]">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-purple-600 mb-2 text-center" style={{fontFamily: 'serif'}}>QUI ES-TU ?</h1>
          <form onSubmit={joinGame} className="flex flex-col gap-4 mt-8">
            <input type="text" autoFocus value={joinName} onChange={(e) => setJoinName(e.target.value)} className="bg-slate-950 border border-slate-700 text-white text-center text-xl p-4 rounded-xl focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all" placeholder="Ton Prénom" />
            <button type="submit" disabled={!joinName.trim() || authLoading} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(220,38,38,0.4)] flex justify-center items-center">{authLoading ? <Activity className="animate-spin" /> : "REJOINDRE"}</button>
            {authLoading && <p className="text-center text-xs text-slate-500 animate-pulse">Connexion au serveur...</p>}
          </form>
          <button onClick={() => setViewMode('splash')} className="w-full mt-4 text-slate-600 text-xs hover:text-slate-400">Retour</button>
        </div>
      </div>
    );
  }

  if (viewMode === 'player') {
    if (!myPlayer) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500"><Activity className="animate-spin mr-2"/> Chargement...</div>;
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 flex flex-col p-4 pb-24">
        <div className="flex justify-between items-center mb-4"><h1 className="text-xl font-black text-red-600" style={{fontFamily: 'serif'}}>STRANGERS PHONING</h1><button onClick={logout} className="text-slate-600 hover:text-red-500"><LogOut size={18}/></button></div>
        <div className="flex-1 flex flex-col justify-center"><PlayerCard player={myPlayer} rank={myRank} isLeader={myPlayer.id === leaderId} onUpdate={updateStats} bigMode={true} flashId={flashId} /><div className="mt-6 text-center"><span className="inline-block bg-slate-900 border border-slate-700 px-4 py-2 rounded-full text-sm text-slate-400">Rang actuel : <strong className="text-white">#{myRank}</strong> / {collaborators.length}</span></div></div>
        <div className="mt-8 grid grid-cols-2 gap-4"><button onClick={() => setViewMode('leaderboard')} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-colors"><Trophy size={24} className="text-yellow-500"/><span className="text-xs uppercase tracking-widest">Classement</span></button><button onClick={() => setViewMode('history')} className="bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 font-bold transition-colors"><History size={24} className="text-blue-400"/><span className="text-xs uppercase tracking-widest">Archives</span></button></div>
      </div>
    );
  }

  if (viewMode === 'leaderboard') {
    return (
      <div className="min-h-screen bg-slate-950 text-gray-100 p-4">
        <div className="flex items-center gap-4 mb-6 sticky top-0 bg-slate-950 z-50 py-4 border-b border-slate-800"><button onClick={() => setViewMode('player')} className="bg-slate-900 p-2 rounded-full border border-slate-700 hover:text-white text-slate-400"><ArrowLeft size={20} /></button><h2 className="text-xl font-bold">Classement Général</h2></div>
        <div className="space-y-3">{collaborators.map((collab, index) => (<div key={collab.id} className={`flex items-center p-3 rounded-lg border ${collab.id === myPlayerId ? 'bg-slate-800 border-red-500/50' : 'bg-slate-900 border-slate-800'}`}><div className="w-8 h-8 flex items-center justify-center font-bold text-slate-500 mr-3 bg-slate-950 rounded">{index + 1}</div><div className="flex-1"><div className="font-bold text-white">{collab.name} {collab.id === myPlayerId && '(Moi)'}</div><div className="text-xs text-slate-500">{collab.calls} appels</div></div><div className="text-yellow-500 font-bold font-mono text-xl">{collab.rdvs} <span className="text-xs text-yellow-700">RDV</span></div></div>))}</div>
      </div>
    );
  }

  return null;
}


