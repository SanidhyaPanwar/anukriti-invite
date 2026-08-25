import { useState, useRef, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

// Create a context so any page can control the music
export const AudioContext = createContext(null);
export const useAudio = () => useContext(AudioContext);

export function GlobalAudioProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const audioRef = useRef(null);

  // Triggered when they click "Tap to Enter" on the welcome screen
  const playAudio = () => {
    setHasInteracted(true);
    if (audioRef.current) {
      audioRef.current.volume = 0.5;
      audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.log(e));
    }
  };

  // NEW: Explicit pause function so RSVP page can pause the music
  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        pauseAudio();
      } else {
        playAudio();
      }
    }
  };

  return (
    <AudioContext.Provider value={{ isPlaying, playAudio, pauseAudio, toggleAudio }}>
      
      {/* Sitewide Audio Element */}
      <audio 
        ref={audioRef} 
        src="https://pub-1953a6673e864f3488c645252f75de98.r2.dev/Ashish%20%26%20Ayushi/Jashn-E-Bahaaraa%20(Instrumental%20-%20Flute)%20%5B-2w18bd-ZQ4%5D.mp3" 
        loop 
        preload="auto" 
      />

      {children}

      {/* Sitewide Floating Button */}
      <AnimatePresence>
        {hasInteracted && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.5 }}
            onClick={toggleAudio}
            className="fixed bottom-24 right-6 z-[99999] w-12 h-12 bg-lavender-900 border border-gold rounded-full flex items-center justify-center text-gold shadow-[0_4px_20px_rgba(212,175,55,0.4)] transition-transform hover:scale-110"          
          >
            {isPlaying ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </motion.button>
        )}
      </AnimatePresence>
    </AudioContext.Provider>
  );
}