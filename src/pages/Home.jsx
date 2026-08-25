import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Crown, Ticket } from 'lucide-react';

export default function Home() {
  const [inviteCode, setInviteCode] = useState('');
  const navigate = useNavigate();

  const handleOpenInvite = (e) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      navigate(`/invite/${inviteCode.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-lavender-950 via-lavender-900 to-lavender-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      
      {/* --- FLOATING FESTIVE BACKGROUND PARTICLES --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              y: '105vh', 
              x: `${Math.random() * 100}vw`, 
              scale: Math.random() * 0.6 + 0.4,
              opacity: Math.random() * 0.7 + 0.3 
            }}
            animate={{ 
              y: '-10vh', 
              x: `+=${(Math.random() - 0.5) * 100}px`,
              rotate: 360 
            }}
            transition={{ 
              duration: Math.random() * 8 + 6, 
              repeat: Infinity, 
              ease: 'linear',
              delay: Math.random() * 5 
            }}
            className="absolute text-gold/30 text-sm md:text-xl"
          >
            {i % 3 === 0 ? '✨' : i % 3 === 1 ? '🌸' : '🔸'}
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md bg-[#2c1238] backdrop-blur-md rounded-3xl shadow-2xl border border-gold/40 p-8 md:p-10 text-center relative z-10"
      >
        {/*  Crest */}
        <div className="mx-auto w-16 h-16 rounded-full bg-lavender-950 border-2 border-gold flex items-center justify-center text-2xl shadow-xl mb-4">
          🪔
        </div>

        <span className="text-xs uppercase tracking-[0.3em] text-gold-light font-bold block mb-2">Welcome to the</span>
        <h1 className="font-script text-5xl md:text-6xl text-white mb-8 drop-shadow-md">
           Wedding
        </h1>

        {/* --- GUEST ACCESS SECTION --- */}
        <div className="bg-[#FAF8F5] rounded-2xl p-6 shadow-inner border-2 border-gold/50 relative overflow-hidden mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold via-amber-300 to-gold" />
          
          <h2 className="text-sm uppercase tracking-widest text-amber-900 font-bold flex items-center justify-center gap-2 mb-4">
            <Ticket size={16} /> Guest Access
          </h2>
          
          <form onSubmit={handleOpenInvite} className="space-y-4">
            <div>
              <input 
                type="text" 
                placeholder="Enter your unique Invite ID" 
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-white border border-lavender-200 text-center text-lavender-950 font-semibold py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-gold/60 focus:border-gold/60 transition shadow-sm placeholder-gray-400"
                required
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full bg-gradient-to-r from-lavender-900 via-lavender-950 to-lavender-900 text-gold-light border border-gold/40 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all tracking-widest text-xs uppercase"
            >
              Open Invitation <ArrowRight size={16} className="text-gold" />
            </motion.button>
          </form>
        </div>

        {/* --- ADMIN ACCESS SECTION --- */}
        <div className="pt-6 border-t border-gold/20">
          <button 
            onClick={() => navigate('/admin')}
            className="group flex items-center justify-center gap-2 w-full text-lavender-300 hover:text-gold transition-colors text-xs uppercase tracking-widest font-semibold"
          >
            <Crown size={14} className="group-hover:text-gold transition-colors" />
            Admin Portal Login
          </button>
        </div>

      </motion.div>
    </div>
  );
}