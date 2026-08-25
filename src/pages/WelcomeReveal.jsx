import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Image as ImageIcon, MailOpen, Music } from "lucide-react";
import confetti from "canvas-confetti";
import { useAudio } from "../components/GlobalAudio";
import ganeshImg from "../assets/Vianyak.png";
import ganeshImgLight from "../assets/Vinayak-light.png";

export default function WelcomeReveal() {
  const { playAudio } = useAudio();
  const { inviteCode } = useParams();

  const [guest, setGuest] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gate, Curtains, and Reveal States
  const [hasEntered, setHasEntered] = useState(false);
  const [curtainsParted, setCurtainsParted] = useState(false);
  const [invitationOpened, setInvitationOpened] = useState(false);

  // 3-Heart Scratch States
  const [allHeartsRevealed, setAllHeartsRevealed] = useState(false);

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState({
    days: "00",
    hours: "00",
    mins: "00",
    secs: "00",
  });

  // References for Canvas elements
  const canvasRef1 = useRef(null);
  const canvasRef2 = useRef(null);
  const canvasRef3 = useRef(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;
  const WEDDING_DATE = new Date("2026-12-10T20:00:00").getTime();

  // Auto-scroll mechanism variables
  const userInteractedRef = useRef(false);
  const autoScrollTimeoutRef = useRef(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/guest/${inviteCode}`)
      .then((res) => {
        setGuest(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [inviteCode]);

  // Determine bride vs groom side ordering
  const isBrideSide = guest?.side === "bride";
  const firstCoupleName = isBrideSide ? "Anukriti" : "Digvijay";
  const secondCoupleName = isBrideSide ? "Digvijay" : "Anukriti";

  const firstBlockName = isBrideSide ? "Anukriti" : "Digvijay";
  const firstBlockParents = isBrideSide
    ? "Daughter of Mrs. Sanju & Dr. Indra Pal Singh Panwar"
    : "Son of Mrs. Santresh & Mr. Harendra Singh Poonia";

  const secondBlockName = isBrideSide ? "Digvijay" : "Anukriti";
  const secondBlockParents = isBrideSide
    ? "Son of Mrs. Santresh & Mr. Harendra Singh Poonia"
    : "Daughter of Mrs. Sanju & Dr. Indra Pal Singh Panwar";

  // Helper for Cover & Card 1: Uses titles and "& Family"
  const getCoverGuestName = () => {
    if (!guest) return "";
    // Determine the respectful title based on gender
    const title = guest.gender === "female" ? "Smt." : "Shree";

    if (guest.withFamily) {
      return `${title} ${guest.fullName} & Family`;
    }
    return `${title} ${guest.fullName}`;
  };

  // Helper for Card 3: Formats specific family member names naturally in the letter
  const getFamilyMentionString = () => {
    if (!guest) return "";
    if (guest.familyMembers && guest.familyMembers.length > 0) {
      const names = guest.familyMembers.map((m) => m.name);
      if (names.length === 1) return ` along with ${names[0]}`;
      if (names.length === 2) return ` along with ${names[0]} and ${names[1]}`;
      return ` along with ${names.slice(0, -1).join(", ")}, and ${
        names[names.length - 1]
      }`;
    }
    if (guest.withFamily) {
      return " and your family";
    }
    return "";
  };

  // COUNTDOWN TIMER LOGIC
  useEffect(() => {
    if (allHeartsRevealed) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = WEDDING_DATE - now;

        if (distance < 0) {
          clearInterval(interval);
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const mins = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({
          days: days < 10 ? `0${days}` : days,
          hours: hours < 10 ? `0${hours}` : hours,
          mins: mins < 10 ? `0${mins}` : mins,
          secs: secs < 10 ? `0${secs}` : secs,
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [allHeartsRevealed, WEDDING_DATE]);

  // FALLING PETALS CANVAS EFFECT (Strictly Background z-0)
  useEffect(() => {
    if (!hasEntered) return;
    const canvas = document.getElementById("petals-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const COLORS = ["#8b5cf6", "#d946ef", "#D4AF37", "#7e57c2", "#ffffff"];
    const COUNT = window.innerWidth < 600 ? 18 : 30;
    const petals = [];

    class Petal {
      constructor() {
        this.reset(true);
      }
      reset(initial) {
        this.x = Math.random() * canvas.width;
        this.y = initial
          ? Math.random() * canvas.height * 2 - canvas.height
          : -20;
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rot);
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.r * 0.55, this.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < COUNT; i++) petals.push(new Petal());

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      petals.forEach((p) => {
        p.update();
        p.draw();
      });
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [hasEntered]);

  // Smooth Auto-Scroll Handler
  const handleUserInteraction = () => {
    userInteractedRef.current = true;
    clearTimeout(autoScrollTimeoutRef.current);
    window.removeEventListener("wheel", handleUserInteraction);
    window.removeEventListener("touchstart", handleUserInteraction);
    window.removeEventListener("mousedown", handleUserInteraction);
  };

  const smoothScrollTo = (endY, duration) => {
    const startY = window.scrollY;
    const distanceY = endY - startY;
    let startTime = null;
    let animationFrameId;

    const animation = (currentTime) => {
      if (userInteractedRef.current) {
        cancelAnimationFrame(animationFrameId);
        return;
      }
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      let t = timeElapsed / (duration / 2);
      let run;
      if (t < 1) run = (distanceY / 2) * t * t * t + startY;
      else {
        t -= 2;
        run = (distanceY / 2) * (t * t * t + 2) + startY;
      }
      window.scrollTo(0, run);
      if (timeElapsed < duration)
        animationFrameId = requestAnimationFrame(animation);
    };
    animationFrameId = requestAnimationFrame(animation);
  };

  // AUDIO & GATE HANDLER
  const handleEnterGate = () => {
    setHasEntered(true);
    playAudio();

    setTimeout(() => {
      setCurtainsParted(true);
    }, 800);

    setTimeout(() => {
      window.addEventListener("wheel", handleUserInteraction, {
        passive: true,
      });
      window.addEventListener("touchstart", handleUserInteraction, {
        passive: true,
      });
      window.addEventListener("mousedown", handleUserInteraction, {
        passive: true,
      });
    }, 1000);

    autoScrollTimeoutRef.current = setTimeout(() => {
      if (!userInteractedRef.current) {
        const scratchSection = document.getElementById(
          "scratch-reveal-section"
        );
        if (scratchSection) {
          const targetY =
            scratchSection.getBoundingClientRect().top +
            window.scrollY +
            scratchSection.offsetHeight / 2 -
            window.innerHeight / 2;
          smoothScrollTo(targetY, 2500);
        }
      }
    }, 5000);
  };

  // HEART-SHAPED SCRATCH CARD SETUP
  const setupScratchCanvas = (node, heartIndex) => {
    if (!node || node.dataset.initialized) return;
    node.dataset.initialized = "true";

    const width = 120;
    const height = 110;
    const dpr = window.devicePixelRatio || 1;
    node.width = width * dpr;
    node.height = height * dpr;

    const ctx = node.getContext("2d", { willReadFrequently: true });
    ctx.scale(dpr, dpr);

    // Lilac & Gold luxury gradient cover
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#3b1d4a");
    gradient.addColorStop(0.5, "#7e57c2");
    gradient.addColorStop(1, "#2c1238");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "#F3E5AB";
    ctx.font = "600 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH", width / 2, height / 2 + 4);

    let isDrawing = false;

    const getPos = (e) => {
      const rect = node.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const scratchMove = (e) => {
      if (!isDrawing) return;
      if (e.cancelable && e.type.startsWith("touch")) e.preventDefault();
      const pos = getPos(e);
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
      ctx.fill();

      try {
        const imageData = ctx.getImageData(0, 0, node.width, node.height);
        let transparent = 0;
        for (let i = 3; i < imageData.data.length; i += 32) {
          if (imageData.data[i] < 128) transparent++;
        }
        if ((transparent / (imageData.data.length / 32)) * 100 > 40) {
          node.style.opacity = "0";
          setTimeout(() => {
            node.style.display = "none";
          }, 600);

          if (heartIndex === 1) canvasRef1.current = true;
          if (heartIndex === 2) canvasRef2.current = true;
          if (heartIndex === 3) canvasRef3.current = true;

          if (
            (canvasRef1.current === true || heartIndex === 1) &&
            (canvasRef2.current === true || heartIndex === 2) &&
            (canvasRef3.current === true || heartIndex === 3)
          ) {
            setAllHeartsRevealed(true);
            triggerRefinedConfetti();
          }
        }
      } catch (err) {}
    };

    node.addEventListener("mousedown", () => {
      isDrawing = true;
    });
    node.addEventListener(
      "touchstart",
      () => {
        isDrawing = true;
      },
      { passive: true }
    );
    window.addEventListener("mouseup", () => {
      isDrawing = false;
    });
    window.addEventListener("touchend", () => {
      isDrawing = false;
    });
    node.addEventListener("mousemove", scratchMove);
    node.addEventListener("touchmove", scratchMove, { passive: false });
  };

  // REFINED RESTRAINED CONFETTI BURST
  const triggerRefinedConfetti = () => {
    const end = Date.now() + 1000;
    const colors = ["#8b5cf6", "#d946ef", "#D4AF37", "#ffffff"];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 45,
        origin: { x: 0, y: 0.6 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 45,
        origin: { x: 1, y: 0.6 },
        colors,
        zIndex: 9999,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  };

  // Heart Mask SVG Style String
  const heartMaskStyle = {
    maskImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 185' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 185 C100 185, 200 125, 200 70 C200 23, 157 -10, 121.5 15 C100 31, 100 31, 100 31 C100 31, 100 31, 78.5 15 C43 -10, 0 23, 0 70 C0 125, 100 185, 100 185 Z' fill='black'/%3E%3C/svg%3E\")",
    WebkitMaskImage:
      "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 185' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M100 185 C100 185, 200 125, 200 70 C200 23, 157 -10, 121.5 15 C100 31, 100 31, 100 31 C100 31, 100 31, 78.5 15 C43 -10, 0 23, 0 70 C0 125, 100 185, 100 185 Z' fill='black'/%3E%3C/svg%3E\")",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#130915] text-[#D4AF37]">
        <p className="font-script text-5xl animate-pulse tracking-wider">
          Loading Festivities...
        </p>
      </div>
    );
  }

  if (!guest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#130915] p-4">
        <div className="bg-[#FAF8F5] p-8 rounded-3xl shadow-2xl text-center max-w-md border border-gold/40">
          <h2 className="text-xl font-serif font-semibold text-gray-900 mb-2">
            Invitation Not Found
          </h2>
          <p className="text-gray-600 text-sm">
            Please verify your unique access link from the host.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#130915] flex flex-col items-center justify-center p-4 relative select-none ${
        !curtainsParted ? "overflow-hidden" : "overflow-y-auto pb-24"
      }`}
    >
      {/* FALLING PETALS CANVAS (Strictly Background z-0) */}
      <canvas
        id="petals-canvas"
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* ENTRY GATE OVERLAY */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[10000] bg-[#130915] flex flex-col items-center justify-center cursor-pointer text-center p-6"
            onClick={handleEnterGate}
          >
            <div className="w-20 h-20 bg-lavender-950 border-2 border-gold rounded-full flex items-center justify-center mb-6 animate-pulse shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <img
                src={ganeshImgLight}
                alt="Shri Ganesh"
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-lavender-200 uppercase tracking-[0.3em] text-xs font-semibold mb-8">
              ॐ श्री गणेशाय नमः
            </p>
            <div className="px-8 py-3 bg-gradient-to-r from-lavender-900 to-lavender-950 border border-gold/40 text-gold-light rounded-full uppercase tracking-widest text-sm flex items-center gap-3 shadow-lg">
              <Music size={16} /> Tap to Enter
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VELVET CURTAINS */}
      <AnimatePresence>
        {hasEntered && !curtainsParted && (
          <motion.div
            className="fixed inset-0 z-50 flex overflow-hidden pointer-events-none"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-100%" }}
              transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-[#2c1238] border-r-4 border-gold shadow-[15px_0_30px_rgba(0,0,0,0.6)] relative bg-[radial-gradient(ellipse_at_right,_var(--tw-gradient-stops))] from-[#4b1d5e] via-[#2c1238] to-[#1a0922]"
            />
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.8, ease: [0.77, 0, 0.175, 1] }}
              className="w-1/2 h-full bg-[#2c1238] border-l-4 border-gold shadow-[-15px_0_30px_rgba(0,0,0,0.6)] relative bg-[radial-gradient(ellipse_at_left,_var(--tw-gradient-stops))] from-[#4b1d5e] via-[#2c1238] to-[#1a0922]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTENT CONTAINER */}
      <div className="relative z-10 w-full max-w-xl my-10 space-y-12">
        <AnimatePresence mode="wait">
          {!invitationOpened ? (
            /* STEP 1: COVER CARD */
            <motion.div
              key="cover"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="w-full bg-[#FAF8F5] rounded-3xl shadow-2xl border-4 border-gold/50 p-8 md:p-12 text-center relative flex flex-col items-center justify-center min-h-[450px]"
            >
              <img
                src={ganeshImg}
                alt="Shri Ganesh"
                className="h-14 w-auto object-contain mx-auto mb-3"
              />
              <span className="text-[10px] uppercase tracking-[0.4em] text-amber-800 font-bold mb-2 block">
                Wedding Invitation
              </span>

              <h1 className="font-script text-5xl md:text-6xl text-lavender-950 mb-4 font-bold">
                {firstCoupleName}{" "}
                <span className="text-amber-600 font-serif text-3xl">&</span>{" "}
                {secondCoupleName}
              </h1>

              <div className="py-3 px-6 bg-lavender-50 border border-gold/30 rounded-2xl my-3 shadow-inner w-full max-w-sm">
                <span className="text-[10px] uppercase tracking-widest text-amber-800 font-bold block mb-0.5">
                  With warmth and joy, cordially invited
                </span>
                <p className="text-xl font-bold text-gray-900 capitalize font-serif">
                  {getCoverGuestName()}
                </p>
              </div>

              <button
                onClick={() => setInvitationOpened(true)}
                className="w-full bg-gradient-to-r from-lavender-900 via-lavender-950 to-lavender-900 text-gold-light border border-gold/40 py-4 px-6 rounded-2xl font-semibold flex items-center justify-center gap-3 shadow-xl transition-all text-sm tracking-widest uppercase cursor-pointer hover:scale-[1.02] mt-4"
              >
                <MailOpen size={16} className="text-gold" /> Open Invitation
              </button>
            </motion.div>
          ) : (
            /* STEP 2: MAIN REVEAL CONTENT (3 SEPARATE CARDS) */
            <div className="space-y-8 w-full">
              {/* CARD 1: PRIMARY INVITATION DETAILS */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full bg-[#FAF8F5] rounded-3xl shadow-2xl border-4 border-gold/50 p-6 md:p-10 text-center relative"
              >
                <img
                  src={ganeshImg}
                  alt="Shri Ganesh"
                  className="h-14 w-auto object-contain mx-auto mb-2"
                />
                <p className="text-[10px] leading-relaxed text-amber-800 tracking-widest uppercase mb-4 font-medium">
                  वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ
                  <br />
                  निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा
                </p>

                <p className="font-serif italic text-sm text-gray-700 leading-relaxed mb-6 px-2">
                  With the blessings of the Almighty & our respected elders,
                  <br />
                  we joyfully request your gracious presence on the wedding
                  celebration of
                </p>

                {/* First Block */}
                <div className="my-2">
                  <span className="font-script text-5xl md:text-6xl text-lavender-950 block">
                    {firstBlockName}
                  </span>
                  <p className="font-serif text-sm font-semibold text-gray-900 mt-1">
                    {firstBlockParents}
                  </p>
                </div>

                {/* Ampersand Separator */}
                <div className="flex items-center justify-center gap-4 my-4">
                  <div className="h-[1px] w-12 bg-gold/40"></div>
                  <span className="font-script text-3xl text-gold">&</span>
                  <div className="h-[1px] w-12 bg-gold/40"></div>
                </div>

                {/* Second Block */}
                <div className="my-2">
                  <span className="font-script text-5xl md:text-6xl text-lavender-950 block">
                    {secondBlockName}
                  </span>
                  <p className="font-serif text-sm font-semibold text-gray-900 mt-1">
                    {secondBlockParents}
                  </p>
                </div>
              </motion.div>

              {/* CARD 2: SAVE THE DATE & HEART SCRATCH CARDS */}
              <motion.div
                id="scratch-reveal-section"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="w-full bg-[#FAF8F5] rounded-3xl shadow-2xl border-4 border-gold/50 p-6 md:p-10 text-center relative"
              >
                <span className="text-xs uppercase tracking-[0.3em] text-amber-800 font-bold block mb-1">
                  Save The Date
                </span>
                <h2 className="font-script text-5xl text-lavender-950 mb-2">
                  Reveal Our Big Day
                </h2>
                <p className="text-xs text-gray-500 italic mb-6">
                  Scratch the heart cards below to reveal date details
                </p>

                <div className="flex justify-center items-center gap-4 my-6">
                  {/* Heart 1: DAY */}
                  <div
                    style={heartMaskStyle}
                    className="relative w-[28vw] max-w-[120px] aspect-[1.1/1] bg-lavender-50 flex flex-col items-center justify-center shadow-lg border border-gold/30"
                  >
                    <span className="text-[9px] uppercase text-amber-800 font-bold tracking-widest">
                      DAY
                    </span>
                    <span className="text-2xl font-serif font-bold text-lavender-950">
                      10
                    </span>
                    <canvas
                      ref={(node) => setupScratchCanvas(node, 1)}
                      style={heartMaskStyle}
                      className="absolute inset-0 w-full h-full cursor-crosshair z-20 touch-none"
                    />
                  </div>

                  {/* Heart 2: MONTH */}
                  <div
                    style={heartMaskStyle}
                    className="relative w-[28vw] max-w-[120px] aspect-[1.1/1] bg-lavender-50 flex flex-col items-center justify-center shadow-lg border border-gold/30"
                  >
                    <span className="text-[9px] uppercase text-amber-800 font-bold tracking-widest">
                      MONTH
                    </span>
                    <span className="text-xl font-serif font-bold text-lavender-950">
                      Dec
                    </span>
                    <canvas
                      ref={(node) => setupScratchCanvas(node, 2)}
                      style={heartMaskStyle}
                      className="absolute inset-0 w-full h-full cursor-crosshair z-20 touch-none"
                    />
                  </div>

                  {/* Heart 3: YEAR */}
                  <div
                    style={heartMaskStyle}
                    className="relative w-[28vw] max-w-[120px] aspect-[1.1/1] bg-lavender-50 flex flex-col items-center justify-center shadow-lg border border-gold/30"
                  >
                    <span className="text-[9px] uppercase text-amber-800 font-bold tracking-widest">
                      YEAR
                    </span>
                    <span className="text-xl font-serif font-bold text-lavender-950">
                      2026
                    </span>
                    <canvas
                      ref={(node) => setupScratchCanvas(node, 3)}
                      style={heartMaskStyle}
                      className="absolute inset-0 w-full h-full cursor-crosshair z-20 touch-none"
                    />
                  </div>
                </div>

                {/* COUNTDOWN TIMER REVEALED */}
                {allHeartsRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-4"
                  >
                    <p className="font-script text-3xl text-amber-800">
                      The start of a beautiful journey...
                    </p>
                    <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
                      {[
                        { label: "DAYS", value: timeLeft.days },
                        { label: "HRS", value: timeLeft.hours },
                        { label: "MINS", value: timeLeft.mins },
                        { label: "SECS", value: timeLeft.secs },
                      ].map((item, idx) => (
                        <div
                          key={idx}
                          className="bg-white border border-gold/30 rounded-xl py-2.5 flex flex-col items-center shadow-inner"
                        >
                          <span className="text-xl font-serif font-bold text-lavender-950">
                            {item.value}
                          </span>
                          <span className="text-[9px] font-semibold text-gray-500 tracking-widest">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* CARD 3: PERSONAL INVITATION NOTE & CHERISHED MEMORIES */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full bg-[#FAF8F5] rounded-3xl shadow-2xl border-4 border-gold/50 p-6 md:p-10 text-center relative space-y-6"
              >
                {/* Personal Letter Greeting */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-amber-800 font-bold block">
                    Special Invitation For
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-lavender-950">
                    Respected {guest.gender === "female" ? "Smt." : "Shree"}{" "}
                    {guest.fullName},{" "}
                  </h3>
                </div>

                <div className="font-serif italic text-sm md:text-base text-gray-700 leading-relaxed px-4 py-4 bg-lavender-50/60 rounded-2xl border border-gold/20 shadow-inner">
                  <p>
                    When we think about our wedding day, we don't just think of
                    the celebrations; we think of the people who mean the
                    absolute world to us. Having you{getFamilyMentionString()}{" "}
                    with us to share the joy, the rituals, and the warmth of
                    this new beginning would make our happiness complete.
                  </p>
                  <p className="mt-3">
                    We can't wait to create cherished memories and celebrate
                    together!
                  </p>
                  <p className="mt-4 font-script text-2xl text-amber-800 not-italic">
                    With love, Dr. Indra Pal Singh Panwar and Family
                  </p>
                </div>

                {/* Cherished Memories Section (Only shown if photos exist) */}
                {guest.photos && guest.photos.length > 0 && (
                  <div className="p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-gold/30 mt-4">
                    <h4 className="text-xs uppercase tracking-widest text-lavender-950 font-bold mb-3 flex items-center justify-center gap-1.5">
                      <ImageIcon className="text-amber-600" size={14} />{" "}
                      Cherished Memories Together
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {guest.photos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          className="relative rounded-2xl overflow-hidden shadow-sm border border-gold/30 aspect-square"
                        >
                          <img
                            src={photoUrl}
                            alt="Memory"
                            className="w-full h-full object-cover transform hover:scale-110 transition duration-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
