import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, Heart, Sparkles, ArrowLeft } from 'lucide-react';

export default function Timeline() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();

  const [guest, setGuest] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Canvas ref for local petals
  const canvasRef = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    axios.get(`${API_BASE}/guest/${inviteCode}`)
      .then(res => {
        const guestData = res.data;
        setGuest(guestData);
        return axios.get(`${API_BASE}/events?inviteType=${guestData.inviteType}`);
      })
      .then(res => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [inviteCode]);

  // LOCAL FALLING PETALS CANVAS EFFECT (Triggers after loading completes)
  useEffect(() => {
    if (loading) return; // Wait until loading is finished and canvas is rendered
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const resize = () => { 
      canvas.width = window.innerWidth; 
      canvas.height = window.innerHeight; 
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const COLORS = ['#8b5cf6', '#d946ef', '#D4AF37', '#7e57c2', '#ffffff'];
    const COUNT = window.innerWidth < 600 ? 18 : 30;
    const petals = [];

    class Petal {
      constructor() { this.reset(true); }
      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height * 2 - canvas.height : -20;
        this.r = 4 + Math.random() * 5;
        this.vx = (Math.random() - 0.5) * 0.6;
        this.vy = 0.5 + Math.random() * 1.0;
        this.rot = Math.random() * Math.PI * 2;
        this.drot = (Math.random() - 0.5) * 0.03;
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
        this.alpha = 0.4 + Math.random() * 0.3;
      }
      update() {
        this.x += this.vx + Math.sin(this.y * 0.01) * 0.3;
        this.y += this.vy;
        this.rot += this.drot;
        if (this.y > canvas.height + 20) this.reset(false);
      }
      draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill(); ctx.restore();
      }
    }

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach(p => { p.update(); p.draw(); });
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#130915] text-[#D4AF37]">
        <p className="font-script text-5xl animate-pulse tracking-widest">Unveiling  Festivities...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#130915] py-12 px-4 relative overflow-x-hidden select-none pb-32">
      
      {/* LOCAL FALLING PETALS CANVAS WITH REF */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      <div className="max-w-2xl mx-auto relative z-10">
        
        {/* Back Button */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/invite/${inviteCode}`)}
          className="flex items-center gap-2 text-lavender-200 font-semibold text-sm mb-8 hover:text-white transition group cursor-pointer"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition text-gold" /> 
          Back to Invitation
        </motion.button>

        {/* Cinematic Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <span className="text-xs uppercase tracking-[0.35em] text-gold font-bold flex items-center justify-center gap-2">
            <Sparkles size={14} />  Celebration Schedule <Sparkles size={14} />
          </span>
          <h1 className="font-script text-6xl md:text-7xl text-white mt-3 mb-2 drop-shadow-md">
            Anukriti <span className="text-gold">&</span> Digvijay
          </h1>
          <p className="text-sm text-lavender-200 max-w-md mx-auto leading-relaxed">
            We are honored to have you with us, <span className="font-bold text-gold-light capitalize">{guest?.fullName}</span>. Here is your personalized itinerary of joy and sacred unions.
          </p>
        </motion.div>

        {/* Vertical Timeline Journey */}
        <div className="relative border-l-2 border-gold/40 ml-4 md:ml-8 space-y-8 pl-6 md:pl-10">
          
          {events.length === 0 ? (
            <div className="bg-[#FAF8F5] p-8 rounded-3xl shadow-xl text-center border border-gold/30">
              <p className="text-gray-700 text-sm font-medium">No scheduled events found for your invite tier.</p>
            </div>
          ) : (
            events.map((evt, idx) => {
              const theme = evt.themeColor || '#8c5ab9';
              const isMainWedding = evt.eventType === 'main-wedding';

              return (
                <motion.div
                  key={evt._id}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.15 }}
                  className="relative group"
                >
                  {/* Glowing Node Dot on Timeline */}
                  <div 
                    className="absolute -left-[31px] md:-left-[47px] top-6 w-5 h-5 rounded-full border-2 border-white shadow-xl transition-transform duration-300 group-hover:scale-125 flex items-center justify-center"
                    style={{ backgroundColor: theme }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  </div>

                  {/* Event Card */}
                  <div 
                    onClick={() => navigate(`/invite/${inviteCode}/event/${evt._id}`)}
                    className="bg-[#FAF8F5] rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border-2 border-gold/30 group-hover:border-gold relative transform hover:-translate-y-1"
                  >
                    {/* Top Custom Theme Strip */}
                    <div className="h-2.5 w-full shadow-inner" style={{ backgroundColor: theme }} />

                    <div className="p-6 md:p-8">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-lavender-100 text-lavender-950 border border-lavender-200">
                          {isMainWedding ? 'Sacred Ceremony' : 'Pre-Wedding Festivity'}
                        </span>
                        {isMainWedding && (
                          <span className="flex items-center gap-1 text-xs font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                            <Heart size={12} className="fill-amber-500 text-amber-600" /> Main Event
                          </span>
                        )}
                      </div>

                      <h3 className="text-3xl font-serif font-bold text-gray-900 group-hover:text-lavender-900 transition">
                        {evt.title}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-xs md:text-sm text-gray-700 my-4 py-3 border-y border-lavender-200/80">
                        <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                          <Calendar size={16} style={{ color: theme }} /> {evt.date}
                        </span>
                        <span className="flex items-center gap-1.5 font-semibold text-gray-900">
                          <Clock size={16} style={{ color: theme }} /> {evt.time}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 flex items-start gap-2 mb-6">
                        <MapPin size={18} style={{ color: theme }} className="shrink-0 mt-0.5" /> 
                        <span className="font-semibold text-gray-900">{evt.venue}</span>
                      </p>

                      <div className="flex items-center justify-between pt-2 text-xs font-bold uppercase tracking-widest text-lavender-950 group-hover:text-amber-700 transition">
                        <span>Tap to view map & directions</span>
                        <div className="w-8 h-8 rounded-full bg-lavender-100 flex items-center justify-center group-hover:bg-lavender-950 group-hover:text-gold transition shadow-sm">
                          <ArrowRight size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}

        </div>

        {/* Footer Blessing Note */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16 text-lavender-200 text-xs italic tracking-wider font-medium"
        >
          Your presence is our greatest gift. We eagerly await to celebrate together! 🪔
        </motion.div>

      </div>
    </div>
  );
}