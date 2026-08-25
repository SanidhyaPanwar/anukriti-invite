import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Edit3, Send } from 'lucide-react';

export default function RSVP() {
  const { inviteCode } = useParams();
  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Track if they have already submitted
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);

  // Form States
  const [attending, setAttending] = useState('yes');
  const [emotionalGuess, setEmotionalGuess] = useState('');
  const [weddingMood, setWeddingMood] = useState('');
  const [note, setNote] = useState('');

  const API_BASE = 'http://localhost:5001/api';

  useEffect(() => {
    axios.get(`${API_BASE}/guest/${inviteCode}`)
      .then(res => {
        const data = res.data;
        setGuest(data);
        
        // If they already submitted an RSVP, pre-fill states and lock view
        if (data.rsvpStatus && data.rsvpStatus !== 'pending') {
          setAttending(data.rsvpStatus === 'attending' ? 'yes' : 'no');
          setEmotionalGuess(data.emotionalGuess || '');
          setWeddingMood(data.weddingMood || '');
          setNote(data.guestNote || '');
          setIsAlreadySubmitted(true);
        }
        
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [inviteCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const payload = {
      attending: attending === 'yes',
      emotional_guess: emotionalGuess,
      wedding_mood: weddingMood,
      note: note,
    };

    try {
      await axios.post(`${API_BASE}/guest/${inviteCode}/rsvp`, payload);
      setIsAlreadySubmitted(true);
      setShowModal(true);
    } catch (error) {
      console.error("Failed to submit RSVP", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#130915] flex items-center justify-center font-script text-3xl text-gold">Loading...</div>;
  if (!guest) return <div className="min-h-screen bg-[#130915] flex items-center justify-center text-white">Invitation not found.</div>;

  return (
    <div className="min-h-screen bg-[#130915] p-6 pb-24 text-center font-serif flex flex-col items-center select-none overflow-x-hidden">
      
      {/* HEADER SECTION */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mt-8 mb-10 w-full max-w-lg">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-bold block mb-2">Join the Celebration</span>
        <h1 className="font-script text-6xl text-lavender-200 mb-4 drop-shadow-md">Celebrate With Us</h1>
        <p className="text-gray-400 italic text-sm">
          {isAlreadySubmitted 
            ? `Thank you for responding, ${guest.fullName.split(' ')[0]}! Here is your recorded RSVP.`
            : `A few fun questions before the big day, ${guest.fullName.split(' ')[0]}!`}
        </p>
      </motion.div>

      {/* ALREADY SUBMITTED: READ-ONLY SUMMARY VIEW */}
      {isAlreadySubmitted && !showModal ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg bg-[#FAF8F5] rounded-3xl p-8 border-2 border-gold/40 shadow-2xl space-y-6 text-left">
          
          <div className="flex justify-between items-center border-b border-gold/20 pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-amber-800 font-bold block">Status</span>
              <h3 className="text-2xl font-bold text-lavender-950 capitalize">
                {attending === 'yes' ? '✨ Joyfully Attending' : '🥀 Regretfully Declined'}
              </h3>
            </div>
            <button 
              onClick={() => setIsAlreadySubmitted(false)}
              className="bg-lavender-900 text-gold-light px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-bold flex items-center gap-1.5 shadow hover:scale-105 transition"
            >
              <Edit3 size={14} /> Edit Response
            </button>
          </div>

          {attending === 'yes' && (
            <div className="space-y-4 text-sm text-gray-700">
              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-inner">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">First Tear Guess</span>
                <p className="font-bold text-gray-900 text-base">{emotionalGuess || 'Not specified'}</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-inner">
                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold block">Wedding Mood</span>
                <p className="font-bold text-gray-900 text-base">{weddingMood || 'Not specified'}</p>
              </div>

              {note && (
                <div className="bg-amber-50/80 p-4 rounded-2xl border border-amber-200 shadow-inner">
                  <span className="text-[10px] uppercase tracking-widest text-amber-800 font-bold block">Your Note</span>
                  <p className="italic text-gray-800 text-sm mt-1">"{note}"</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-center text-gray-500 italic pt-2">You can update your response anytime by clicking "Edit Response" above.</p>
        </motion.div>
      ) : (

        /* FORM SECTION (Shown if not submitted yet, or if they clicked "Edit") */
        <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
          
          {/* ATTENDANCE CARD */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#FAF8F5] rounded-3xl p-6 border-2 border-gold/40 shadow-xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-lavender-950 mb-4">Will you be joining us?</h2>
            <div className="flex gap-4 w-full">
              <label className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${attending === 'yes' ? 'bg-lavender-900 border-lavender-900 text-white shadow-md transform scale-105' : 'bg-transparent border-gray-300 text-gray-500'}`}>
                <input type="radio" name="attending" value="yes" checked={attending === 'yes'} onChange={(e) => setAttending(e.target.value)} className="hidden" />
                Joyfully Accept
              </label>
              <label className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 ${attending === 'no' ? 'bg-amber-800 border-amber-800 text-white shadow-md transform scale-105' : 'bg-transparent border-gray-300 text-gray-500'}`}>
                <input type="radio" name="attending" value="no" checked={attending === 'no'} onChange={(e) => setAttending(e.target.value)} className="hidden" />
                Regretfully Decline
              </label>
            </div>
          </motion.div>

          {/* FUN QUESTIONS (Disabled if declining) */}
          <div className={`space-y-6 transition-opacity duration-500 ${attending === 'no' ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
            
            {/* WHO CRIES FIRST? */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#FAF8F5] rounded-3xl p-6 border-2 border-gold/40 shadow-xl">
              <h2 className="text-xl font-bold text-lavender-950">Make a Guess</h2>
              <p className="text-sm text-gray-500 italic mb-6">Who will get emotional first?</p>
              
              <div className="flex justify-center gap-6">
                {[
                  { id: 'Anukriti', letter: 'A' },
                  { id: 'Digvijay', letter: 'D' },
                  { id: 'Both', letter: 'B' }
                ].map((opt) => (
                  <label key={opt.id} className="flex flex-col items-center gap-2 cursor-pointer group">
                    <input type="radio" name="emotionalGuess" value={opt.id} checked={emotionalGuess === opt.id} onChange={(e) => setEmotionalGuess(e.target.value)} className="hidden" />
                    <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center font-script text-3xl transition-all duration-300 ${emotionalGuess === opt.id ? 'bg-lavender-900 border-lavender-900 text-white shadow-[0_4px_15px_rgba(75,29,94,0.4)] scale-110' : 'bg-transparent border-gray-300 text-lavender-900 group-hover:border-lavender-400'}`}>
                      {opt.letter}
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">{opt.id}</span>
                  </label>
                ))}
              </div>
            </motion.div>

            {/* WEDDING MOOD PILLS */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#FAF8F5] rounded-3xl p-6 border-2 border-gold/40 shadow-xl">
              <h2 className="text-xl font-bold text-lavender-950">Your Wedding Mood</h2>
              <p className="text-sm text-gray-500 italic mb-4">I'm primarily coming for...</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'Food', label: 'The Food 🍛' },
                  { id: 'Dance', label: 'Team Dance 💃' },
                  { id: 'Love', label: 'The Love ❤️' },
                  { id: 'All', label: 'All of It ✨' }
                ].map((mood) => (
                  <label key={mood.id} className={`p-3 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-all ${weddingMood === mood.id ? 'bg-lavender-900 border-lavender-900 text-white shadow-md' : 'bg-transparent border-gray-300 text-gray-600 hover:border-lavender-400'}`}>
                    <input type="radio" name="weddingMood" value={mood.id} checked={weddingMood === mood.id} onChange={(e) => setWeddingMood(e.target.value)} className="hidden" />
                    {mood.label}
                  </label>
                ))}
              </div>
            </motion.div>

            {/* MESSAGE BOX */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#FAF8F5] rounded-3xl p-6 border-2 border-gold/40 shadow-xl">
              <h2 className="text-xl font-bold text-lavender-950">Leave Us a Note</h2>
              <p className="text-sm text-gray-500 italic mb-4">Share a wish, memory, or advice for forever.</p>
              <textarea 
                value={note} onChange={(e) => setNote(e.target.value)}
                rows="3"
                className="w-full bg-white border border-gray-300 rounded-xl p-4 text-gray-800 outline-none focus:border-lavender-900 focus:ring-2 focus:ring-lavender-900/20 transition-all resize-none shadow-inner"
                placeholder="Write something from the heart..."
              />
            </motion.div>
          </div>

          {/* SUBMIT BUTTON */}
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            type="submit" disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-gold-light via-gold to-gold-light text-lavender-950 py-4 px-8 rounded-full font-bold uppercase tracking-widest text-sm shadow-[0_5px_20px_rgba(212,175,55,0.3)] transition-all flex justify-center items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? <span className="animate-pulse">Updating Response...</span> : <>Update & Submit RSVP</>}
          </motion.button>
        </form>
      )}

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#130915]/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FAF8F5] rounded-3xl max-w-sm w-full p-8 text-center border border-gold shadow-2xl relative"
            >
              <div className="w-16 h-16 bg-lavender-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-lavender-200">
                <Check size={32} className="text-lavender-900" />
              </div>
              <h3 className="font-script text-4xl text-lavender-950 mb-2">RSVP Saved!</h3>
              <p className="text-gray-600 font-medium italic mb-8">
                {attending === 'yes' ? "We have updated your response. Can't wait to celebrate!" : "We have recorded your response. You will be missed!"}
              </p>
              <button 
                onClick={() => setShowModal(false)}
                className="w-full bg-lavender-900 text-white rounded-full py-3 text-xs uppercase tracking-widest font-bold cursor-pointer"
              >
                View Summary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}