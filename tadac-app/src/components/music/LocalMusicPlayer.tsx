'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useFocus } from '@/lib/focus-context';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { Play, Pause, SkipForward, SkipBack, Volume2, FolderPlus, Music, Repeat, Shuffle, Infinity as InfinityLoop, FolderOpen } from 'lucide-react';
import { storeDirectoryHandle, getDirectoryHandle, clearDirectoryHandle } from '@/lib/music-db';

export type BuiltInTrack = {
  id: string;
  title: string;
  url: string;
  type: 'focus' | 'break';
};

export type PlayableTrack = 
  | { id: string; source: 'builtin'; track: BuiltInTrack }
  | { id: string; source: 'local'; file: File };

const BUILT_IN_CATALOG: BuiltInTrack[] = [];

export default function LocalMusicPlayer() {
  const { state } = useFocus();
  
  const [focusTracks, setFocusTracks] = useState<PlayableTrack[]>(
    BUILT_IN_CATALOG.filter(t => t.type === 'focus').map(t => ({ id: t.id, source: 'builtin', track: t }))
  );
  const [breakTracks, setBreakTracks] = useState<PlayableTrack[]>(
    BUILT_IN_CATALOG.filter(t => t.type === 'break').map(t => ({ id: t.id, source: 'builtin', track: t }))
  );
  const [myMusicTracks, setMyMusicTracks] = useState<PlayableTrack[]>([]);
  
  const [activeQueue, setActiveQueue] = useState<'focus' | 'break' | 'mymusic'>('focus');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loop, setLoop] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  
  const [permissionNeeded, setPermissionNeeded] = useState<'granted' | 'prompt' | 'denied'>('granted');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const pathname = usePathname();
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Hook to find the portal target ONLY on the client to avoid SSR hydration mismatches
  useEffect(() => {
    if (pathname === '/focus') {
      const target = document.getElementById('music-player-portal');
      setPortalTarget(target);
    } else {
      setPortalTarget(null);
    }
  }, [pathname]);

  const getCurrentArray = () => {
    if (activeQueue === 'focus') return focusTracks;
    if (activeQueue === 'break') return breakTracks;
    return myMusicTracks;
  };

  const currentArray = getCurrentArray();
  const currentTrack = currentArray.length > 0 && currentIndex >= 0 && currentIndex < currentArray.length ? currentArray[currentIndex] : null;

  // Track ObjectURL Blob safety
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    
    let url: string;
    if (currentTrack.source === 'local') {
      url = URL.createObjectURL(currentTrack.file);
    } else {
      url = currentTrack.track.url;
    }
    
    audioRef.current.src = url;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.warn('Audio auto-play prevented by browser', e);
        setIsPlaying(false);
      });
    }
    return () => {
      if (currentTrack.source === 'local') {
        URL.revokeObjectURL(url);
      }
    };
  }, [currentTrack]);

  // Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Pomodoro synchronization
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(e => {
         console.warn('[MusicDiagnostics] Lifecycle auto-play prevented', e);
         setIsPlaying(false);
      });
    } else if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  const loadTrack = (idx: number, queueTarget: typeof activeQueue, forcePlay = false) => {
    setActiveQueue(queueTarget);

    const queue = queueTarget === 'focus' ? focusTracks : queueTarget === 'break' ? breakTracks : myMusicTracks;
    if (queue.length === 0) {
      if (forcePlay) setIsPlaying(false);
      return;
    }
    
    let safeIdx = idx;
    if (safeIdx >= queue.length) safeIdx = 0;
    if (safeIdx < 0) safeIdx = queue.length - 1;

    setCurrentIndex(safeIdx);
    if (forcePlay) setIsPlaying(true);
  };

  const handleNext = () => {
    if (currentArray.length === 0) return;
    if (shuffle && currentArray.length > 1) {
      let n = currentIndex;
      while (n === currentIndex) n = Math.floor(Math.random() * currentArray.length);
      loadTrack(n, activeQueue, isPlaying);
    } else {
      loadTrack(currentIndex + 1, activeQueue, isPlaying);
    }
  };

  const handlePrev = () => {
    loadTrack(currentIndex - 1, activeQueue, isPlaying);
  };

  // Intercept the canonical lifecycle safely
  useEffect(() => {
    if (state.phase === 'running') {
      // If activeQueue is already mymusic, keep it! It acts as a focus substitute.
      if (activeQueue !== 'focus' && activeQueue !== 'mymusic') {
        loadTrack(0, 'focus', true); 
      } else {
        setIsPlaying(true);
      }
    } else if (state.phase === 'break') {
      if (activeQueue !== 'break') {
        loadTrack(0, 'break', true);
      } else {
        setIsPlaying(true);
      }
    } else if (state.phase === 'paused' || state.phase === 'idle' || state.phase === 'completed') {
      setIsPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // File System Access API
  const loadDirectory = async (handle: FileSystemDirectoryHandle) => {
    try {
      const files: PlayableTrack[] = [];
      // @ts-ignore
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile();
          if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(file.name)) {
            files.push({ id: file.name, source: 'local', file });
          }
        }
      }
      setMyMusicTracks(files);
      setPermissionNeeded('granted');
    } catch (e) {
      console.warn("Failed to read directory", e);
    }
  };

  // Restore on mount
  useEffect(() => {
    getDirectoryHandle().then(handle => {
      if (!handle) return;
      // @ts-ignore
      handle.queryPermission({ mode: 'read' }).then(state => {
        if (state === 'granted') {
           loadDirectory(handle);
        } else {
           setPermissionNeeded('prompt');
        }
      });
    });
  }, []);

  const handlePickFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const directoryHandle = await window.showDirectoryPicker();
        await storeDirectoryHandle(directoryHandle);
        await loadDirectory(directoryHandle);
      }
    } catch (e) {
       console.log('User cancelled or API missing', e);
    }
  };

  const handleReconnect = async () => {
    const handle = await getDirectoryHandle();
    if (!handle) return;
    try {
      // @ts-ignore
      const state = await handle.requestPermission({ mode: 'read' });
      if (state === 'granted') {
         loadDirectory(handle);
      } else {
         clearDirectoryHandle();
         setPermissionNeeded('granted');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFallbackUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const rawFiles = Array.from(e.target.files);
    const files: PlayableTrack[] = rawFiles
       .filter(f => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac|aac)$/i.test(f.name))
       .map(f => ({ id: f.name, source: 'local', file: f }));
    setMyMusicTracks(files);
    e.target.value = '';
  };

  const onEnded = () => {
    if (loop && !shuffle) handleNext();
    else if (shuffle) handleNext();
    else {
      if (currentIndex < currentArray.length - 1) handleNext();
      else setIsPlaying(false);
    }
  };

  const manualTogglePlay = () => {
    if (!currentTrack || !audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const hasAccessAPI = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  const engine = <audio ref={audioRef} onEnded={onEnded} style={{ display: 'none' }} />;

  const ui = (
    <Panel padding="md" style={{ background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Music size={18} color="var(--accent)" />
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Music Library</h2>
      </div>

      {/* Engine is kept globally stable beside the Portal */}

      {/* Library Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, maxHeight: 180, overflowY: 'auto' }}>
        
        {/* Built-in Focus */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>FOCUS</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {focusTracks.length === 0 ? <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Empty</div> : focusTracks.map((t, idx) => (
               <div key={t.id} onClick={() => loadTrack(idx, 'focus', true)} style={{ padding: '6px 8px', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer', background: activeQueue === 'focus' && currentIndex === idx ? 'var(--accent)22' : 'var(--panel-bg)', color: activeQueue === 'focus' && currentIndex === idx ? 'var(--accent)' : 'var(--text-secondary)' }}>
                 ▶ {t.source === 'builtin' ? t.track.title : t.file.name}
               </div>
            ))}
          </div>
        </div>

        {/* Built-in Break */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>BREAK</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {breakTracks.length === 0 ? <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Empty</div> : breakTracks.map((t, idx) => (
               <div key={t.id} onClick={() => loadTrack(idx, 'break', true)} style={{ padding: '6px 8px', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer', background: activeQueue === 'break' && currentIndex === idx ? 'var(--info)22' : 'var(--panel-bg)', color: activeQueue === 'break' && currentIndex === idx ? 'var(--info)' : 'var(--text-secondary)' }}>
                 ▶ {t.source === 'builtin' ? t.track.title : t.file.name}
               </div>
            ))}
          </div>
        </div>
      </div>

      {/* My Music local queue */}
      <div style={{ borderTop: '1px solid var(--panel-border)', paddingTop: 12 }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' }}>MY MUSIC</label>
        
        {permissionNeeded === 'prompt' ? (
          <Button variant="ghost" size="sm" onClick={handleReconnect} style={{ width: '100%', marginBottom: 8 }}>
            Reconnect Music Folder
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            {hasAccessAPI ? (
              <Button variant="ghost" size="sm" onClick={handlePickFolder} style={{ flex: 1, gap: 6, fontSize: '0.75rem' }}>
                <FolderPlus size={14} /> Add Folder
              </Button>
            ) : (
              <div style={{ position: 'relative', flex: 1 }}>
                <Button variant="ghost" size="sm" style={{ width: '100%', gap: 6, fontSize: '0.75rem' }}>
                  <FolderOpen size={14} /> Add Files
                </Button>
                <input type="file" multiple accept="audio/*" onChange={handleFallbackUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 100, overflowY: 'auto' }}>
          {myMusicTracks.length === 0 && permissionNeeded === 'granted' ? <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', padding: '0 8px' }}>No local tracks</div> : myMusicTracks.map((t, idx) => (
              <div key={t.id + idx} onClick={() => loadTrack(idx, 'mymusic', true)} style={{ padding: '6px 8px', borderRadius: 6, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: activeQueue === 'mymusic' && currentIndex === idx ? 'var(--accent)22' : 'var(--panel-bg)', color: activeQueue === 'mymusic' && currentIndex === idx ? 'var(--accent)' : 'var(--text-secondary)' }}>
                ▶ {t.source === 'local' ? t.file.name : ''}
              </div>
          ))}
        </div>
      </div>

      {/* Transport Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, padding: 12, background: 'var(--panel-bg)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
           {currentTrack ? (currentTrack.source === 'builtin' ? currentTrack.track.title : currentTrack.file.name) : 'No media loaded'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
           <Button variant="ghost" size="sm" onClick={() => setShuffle(!shuffle)} style={{ color: shuffle ? 'var(--accent)' : 'var(--text-tertiary)' }}>
             <Shuffle size={16} />
           </Button>
           <Button variant="ghost" size="sm" onClick={handlePrev}>
             <SkipBack size={20} />
           </Button>
           <Button variant="primary" style={{ width: 44, height: 44, borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={manualTogglePlay}>
             {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
           </Button>
           <Button variant="ghost" size="sm" onClick={handleNext}>
             <SkipForward size={20} />
           </Button>
           <Button variant="ghost" size="sm" onClick={() => setLoop(!loop)} style={{ color: loop ? 'var(--accent)' : 'var(--text-tertiary)' }}>
             <InfinityLoop size={16} />
           </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Volume2 size={14} color="var(--text-tertiary)" />
          <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} style={{ flex: 1, height: 4, cursor: 'pointer' }} />
        </div>
      </div>

    </Panel>
  );

  return (
    <>
      {/* Global stable engine node avoids React tearing down HTMLAudioElement across tree shape changes */}
      {engine}
      {pathname === '/focus' && portalTarget ? createPortal(ui, portalTarget) : null}
    </>
  );
}
