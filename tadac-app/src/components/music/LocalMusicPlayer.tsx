'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useFocus } from '@/lib/focus-context';
import Panel from '@/components/ui/Panel';
import Button from '@/components/ui/Button';
import { Play, Pause, SkipForward, SkipBack, Volume2, Upload, Music, Repeat, Shuffle, Infinity as InfinityLoop } from 'lucide-react';

export default function LocalMusicPlayer() {
  const { state } = useFocus(); // Context linking phase logic natively
  
  // Track queues isolated
  const [focusFiles, setFocusFiles] = useState<File[]>([]);
  const [breakFiles, setBreakFiles] = useState<File[]>([]);
  
  // Player state
  const [activeQueue, setActiveQueue] = useState<'focus' | 'break'>('focus');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [loop, setLoop] = useState(true);
  const [shuffle, setShuffle] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Derive current logical active array
  const currentArray = activeQueue === 'focus' ? focusFiles : breakFiles;
  const currentFile = currentArray.length > 0 && currentIndex >= 0 && currentIndex < currentArray.length ? currentArray[currentIndex] : null;

  // React strictly to currentFile to mint and track the URL safely (fixes React 18 StrictMode lifecycle revocation bug)
  useEffect(() => {
    if (!currentFile || !audioRef.current) return;
    const url = URL.createObjectURL(currentFile);
    audioRef.current.src = url;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(e => {
        console.warn('Audio auto-play prevented by browser', e);
        setIsPlaying(false);
      });
    }
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentFile]); // only trigger on file change. this prevents stale blobs strictly.

  // Sync internal Volume natively
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Safely sync playback state when it changes from external sources (Pomodoro phase) 
  // explicitly preventing double-invocation if already handled natively.
  useEffect(() => {
    if (!audioRef.current || !currentFile) return;
    if (isPlaying && audioRef.current.paused) {
      audioRef.current.play().catch(e => {
         console.warn('[MusicDiagnostics] Lifecycle auto-play prevented', e);
         setIsPlaying(false);
      });
    } else if (!isPlaying && !audioRef.current.paused) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentFile]);

  const loadTrack = (idx: number, queueTarget: typeof activeQueue, forcePlay = false) => {
    const queue = queueTarget === 'focus' ? focusFiles : breakFiles;
    if (queue.length === 0) return;
    
    // Bounds wrapping
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
      while (n === currentIndex) {
        n = Math.floor(Math.random() * currentArray.length);
      }
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
      if (activeQueue !== 'focus') {
        setActiveQueue('focus');
        loadTrack(0, 'focus', true); 
      } else {
        setIsPlaying(true);
      }
    } else if (state.phase === 'break') {
      if (activeQueue !== 'break') {
        setActiveQueue('break');
        loadTrack(0, 'break', true);
      } else {
        setIsPlaying(true);
      }
    } else if (state.phase === 'paused') {
      setIsPlaying(false);
    } else if (state.phase === 'idle' || state.phase === 'completed') {
      setIsPlaying(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  // Handler for file uploads locally
  const handleUpload = (e: ChangeEvent<HTMLInputElement>, queueType: 'focus' | 'break') => {
    if (!e.target.files) return;
    const rawFiles = Array.from(e.target.files);
    console.log(`[MusicDiagnostics] Uploaded ${rawFiles.length} files to ${queueType}.`);
    
    const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'];
    const files = rawFiles.filter(f => {
      if (f.type.startsWith('audio/')) return true;
      const ext = f.name.split('.').pop()?.toLowerCase();
      const isValid = validExtensions.includes(ext || '');
      if (!isValid) console.warn(`[MusicDiagnostics] Rejected file: ${f.name} (type: ${f.type})`);
      return isValid;
    });
    
    console.log(`[MusicDiagnostics] Accepted ${files.length} valid audio files.`);
    
    if (queueType === 'focus') setFocusFiles(files);
    else setBreakFiles(files);

    // Initial preload mapping
    if (files.length > 0 && queueType === activeQueue && state.phase === 'idle') {
       setCurrentIndex(0);
       setIsPlaying(false);
    }
    
    // Crucial: reset input state so repeated file triggers do not get swallowed silently by the browser
    e.target.value = '';
  };

  // Trigger when a song naturally finishes
  const onEnded = () => {
    if (loop && !shuffle) {
      handleNext();
    } else if (shuffle) {
      handleNext();
    } else {
      if (currentIndex < currentArray.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const manualTogglePlay = () => {
    if (!currentFile || !audioRef.current) {
       console.warn(`[MusicDiagnostics] manualTogglePlay aborted. currentFile: ${!!currentFile}, audioRef: ${!!audioRef.current}`);
       return;
    }
    
    console.log(`[MusicDiagnostics] manualTogglePlay triggered. Current state isPlaying: ${isPlaying}`);
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      // Synchronously call play on the DOM element immediately tying it to the user gesture
      audioRef.current.play().then(() => {
        console.log(`[MusicDiagnostics] Successfully acquired play lock for ${currentFile.name}`);
        setIsPlaying(true);
      }).catch(e => {
        console.warn('[MusicDiagnostics] Audio auto-play prevented by browser', e);
        setIsPlaying(false);
      });
    }
  };

  return (
    <Panel padding="md" style={{ background: 'var(--bg-primary)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <Music size={18} color="var(--accent)" />
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>Local Media (Private)</h2>
      </div>

      <audio ref={audioRef} onEnded={onEnded} style={{ display: 'none' }} />

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {/* Focus Selector */}
        <div style={{ flex: 1, padding: 12, border: '1px solid var(--panel-border)', borderRadius: 8, background: activeQueue === 'focus' ? 'var(--accent)11' : 'transparent' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 700 }}>Focus Config ({focusFiles.length})</label>
          <div style={{ position: 'relative' }}>
             <Button variant="ghost" size="sm" style={{ width: '100%', gap: 6, fontSize: '0.75rem' }}>
                <Upload size={14} /> Buffer Audio
             </Button>
             <input type="file" multiple accept="audio/*" onChange={(e) => handleUpload(e, 'focus')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          </div>
        </div>

        {/* Break Selector */}
        <div style={{ flex: 1, padding: 12, border: '1px solid var(--panel-border)', borderRadius: 8, background: activeQueue === 'break' ? 'var(--info)11' : 'transparent' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 700 }}>Break Config ({breakFiles.length})</label>
          <div style={{ position: 'relative' }}>
             <Button variant="ghost" size="sm" style={{ width: '100%', gap: 6, fontSize: '0.75rem' }}>
                <Upload size={14} /> Buffer Audio
             </Button>
             <input type="file" multiple accept="audio/*" onChange={(e) => handleUpload(e, 'break')} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          </div>
        </div>
      </div>

      {/* Transport Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Track Label */}
        <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', background: 'var(--panel-bg)', padding: '6px 12px', borderRadius: 4 }}>
           {currentFile ? currentFile.name : 'No media loaded locally'}
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

        {/* Dynamic Volume Bar Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <Volume2 size={14} color="var(--text-tertiary)" />
          <input 
            type="range" 
            min="0" max="1" step="0.05" 
            value={volume} 
            onChange={e => setVolume(parseFloat(e.target.value))}
            style={{ flex: 1, height: 4, cursor: 'pointer' }}
          />
        </div>
      </div>

    </Panel>
  );
}
