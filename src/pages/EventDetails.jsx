import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowLeft, Navigation, Sparkles, Shirt, Info, Image as ImageIcon, Download } from 'lucide-react';

export default function EventDetails() {
  const { inviteCode, eventId } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Canvas ref for local petals
  const canvasRef = useRef(null);

  const API_BASE = 'https://anukriti-invite-1.onrender.com/api';

  useEffect(() => {
    axios.get(`${API_BASE}/events?inviteType=complete`)
      .then(res => {
        const found = res.data.find(e => e._id === eventId);
        setEvent(found);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [eventId]);

  // LOCAL FALLING PETALS CANVAS EFFECT
  useEffect(() => {
    if (loading) return;
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

  // Helper to parse event date and time strings into Google Calendar format (YYYYMMDDTHHmmssZ)
  const getGoogleCalendarDates = (dateStr, timeStr) => {
    try {
      const cleanTimeMatch = timeStr ? timeStr.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i) : null;
      const timeToUse = cleanTimeMatch ? cleanTimeMatch[1] : '12:00 PM';
      
      const combined = `${dateStr} ${timeToUse}`;
      const startDate = new Date(combined);
      
      if (isNaN(startDate.getTime())) return '';
      
      // Default duration: 3 hours for the celebration event
      const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000);
      
      const formatGCalDate = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      return `${formatGCalDate(startDate)}/${formatGCalDate(endDate)}`;
    } catch (e) {
      return '';
    }
  };

  // Helper to generate and download .ics file for Apple/Outlook Calendars
  const downloadIcsFile = () => {
    if (!event) return;
    const icsData = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title} - Anukriti & Digvijay Wedding`,
      `DESCRIPTION:${event.description || 'Wedding Festivity'}`,
      `LOCATION:${event.venue}, ${event.address || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#130915] text-[#D4AF37]">
        <p className="font-script text-5xl animate-pulse tracking-widest">Preparing Event Details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#130915] p-4">
        <div className="bg-[#FAF8F5] p-8 rounded-3xl shadow-2xl text-center max-w-md border border-gold/40">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">Event Not Found</h2>
          <button onClick={() => navigate(-1)} className="mt-4 text-lavender-900 hover:underline text-sm font-bold cursor-pointer">
            &larr; Return to Timeline
          </button>
        </div>
      </div>
    );
  }

  const accentColor = event.themeColor || '#8c5ab9';
  const gCalDates = getGoogleCalendarDates(event.date, event.time);

  return (
    <div className="min-h-screen bg-[#130915] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden select-none pb-24">
      
      {/* LOCAL FALLING PETALS CANVAS WITH REF */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      <div className="max-w-lg w-full relative z-10 space-y-6">
        
        {/* Back Button */}
        <motion.button 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(`/invite/${inviteCode}/timeline`)}
          className="flex items-center gap-2 text-lavender-200 font-semibold text-sm hover:text-white transition group cursor-pointer"
        >
          <ArrowLeft size={16} className="transform group-hover:-translate-x-1 transition text-gold" /> Back to Timeline
        </motion.button>

        {/* Main Cinematic Card */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="bg-[#FAF8F5] rounded-3xl shadow-2xl overflow-hidden border-4 border-gold/50 shadow-gold/20"
        >
          
          {/* Header Banner Tinted with Event Theme Color */}
          <div className="p-8 text-white relative overflow-hidden" style={{ backgroundColor: accentColor }}>
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold-light font-bold flex items-center gap-1.5 mb-2">
              <Sparkles size={14} /> Celebration Particulars
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mt-1 drop-shadow-md text-white">{event.title}</h1>
          </div>

          <div className="p-6 md:p-8 space-y-6">
            
            {/* Date & Time Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-lavender-50/90 p-4 rounded-2xl border border-lavender-200">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-gold/30" style={{ color: accentColor }}>
                  <Calendar size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Date</span>
                  <span className="font-bold text-gray-900 text-sm">{event.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center border border-gold/30" style={{ color: accentColor }}>
                  <Clock size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Time</span>
                  <span className="font-bold text-gray-900 text-sm">{event.time}</span>
                </div>
              </div>
            </div>

            {/* Venue & Maps Action */}
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-white shadow-lg flex items-center justify-center shrink-0 mt-0.5 border border-gold/30" style={{ color: accentColor }}>
                  <MapPin size={22} />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">Venue Location</span>
                  <h3 className="font-bold text-gray-900 text-base mt-0.5 leading-snug">{event.venue}</h3>
                  {event.address && <p className="text-xs text-gray-600 mt-0.5">{event.address}</p>}
                </div>
              </div>

              {event.locationLink && (
                <motion.a 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={event.locationLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full text-white py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2.5 shadow-lg transition-all tracking-widest text-xs uppercase border border-white/30 cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <Navigation size={16} /> Open Venue in Google Maps
                </motion.a>
              )}
            </div>

            {/* Suggested Attire & Color Palette */}
            {(event.dressCode || (event.colorPalette && event.colorPalette.length > 0)) && (
              <div className="bg-lavender-50/70 p-4 rounded-2xl border border-gold/30 space-y-3">
                <div className="flex items-center gap-2 text-lavender-950 font-bold text-xs uppercase tracking-wider">
                  <Shirt size={16} className="text-amber-700" /> 
                  {event.dressCode && event.colorPalette?.length > 0 
                    ? 'Suggested Attire & Theme Colors' 
                    : event.dressCode 
                      ? 'Suggested Attire' 
                      : 'Theme Colors'}
                </div>
                {event.dressCode && (
                  <p className="text-xs text-gray-700 font-medium">{event.dressCode}</p>
                )}
                {event.colorPalette && event.colorPalette.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Palette:</span>
                    <div className="flex gap-2">
                      {event.colorPalette.map((colorHex, idx) => (
                        <div 
                          key={idx} 
                          className="w-6 h-6 rounded-full border border-gold/50 shadow-inner" 
                          style={{ backgroundColor: colorHex }} 
                          title={colorHex}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add to Calendar Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button 
                onClick={downloadIcsFile}
                className="py-3 px-4 bg-white border border-gold/40 text-lavender-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:bg-lavender-50 transition cursor-pointer"
              >
                <Download size={14} className="text-amber-700" /> iCal / Outlook
              </button>
              <a 
                href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title + ' - Anukriti & Digvijay Wedding')}${gCalDates ? `&dates=${gCalDates}` : ''}&location=${encodeURIComponent(event.address ? `${event.venue}, ${event.address}` : event.venue)}&details=${encodeURIComponent(
                  `🗓️ Date: ${event.date}\n⏰ Start Time: ${event.time}\n\n${event.description || 'Wedding Festivity'}\n\n📍 Venue: ${event.venue}\n📍 Address: ${event.address || 'See location link'}\n🗺️ Google Maps: ${event.locationLink || 'N/A'}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 bg-white border border-gold/40 text-lavender-950 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:bg-lavender-50 transition cursor-pointer"
              >
                <Calendar size={14} className="text-amber-700" /> Google Calendar
              </a>
            </div>

            {/* Logistics & Family Guidelines */}
            {event.guidelines && (
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Info size={14} className="text-amber-700" /> Important Logistics
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">{event.guidelines}</p>
              </div>
            )}

            {/* Note from Family */}
            {event.description && (
              <div className="pt-2 border-t border-lavender-200">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-amber-800 font-bold mb-1.5">Note from the Family</h4>
                <p className="text-gray-800 text-xs leading-relaxed italic bg-white p-3.5 rounded-2xl border border-lavender-200 shadow-inner font-medium">
                  "{event.description}"
                </p>
              </div>
            )}

            {/* Venue Photos / Mood Board Preview */}
            {event.venuePhotos && event.venuePhotos.length > 0 && (
              <div className="pt-2 border-t border-lavender-200">
                <h4 className="text-[10px] uppercase tracking-[0.2em] text-lavender-950 font-bold mb-2.5 flex items-center gap-1.5">
                  <ImageIcon size={14} className="text-amber-700" /> Venue Mood Board
                </h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {event.venuePhotos.map((photoUrl, idx) => (
                    <div key={idx} className="rounded-2xl overflow-hidden border border-gold/30 aspect-video shadow-sm">
                      <img src={photoUrl} alt="Venue Preview" className="w-full h-full object-cover transform hover:scale-105 transition duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </motion.div>

        {/* Footer Note */}
        <div className="text-center mt-6 text-lavender-200 text-xs tracking-wider italic font-medium">
          Anukriti & Digvijay Wedding Festivities 🪔
        </div>

      </div>
    </div>
  );
}