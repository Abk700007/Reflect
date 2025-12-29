import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { Howl } from 'howler'
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- 1. TYPES ---
interface ReflectionData {
  reflection: string;
  state: string;
  hexColor: string;
}

// --- 2. SOUND ENGINE ---
const soundEngine = {
  ambient: new Howl({ src: ['/ambient.mp3'], loop: true, volume: 0.5, html5: true }),
  shimmer: new Howl({ src: ['/shimmer.mp3'], volume: 0.5 }),
}

// --- SNOW GENERATOR ---
const generateSnow = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    const size = Math.random() * 3 + 1;
    const left = Math.random() * 100;
    const duration = Math.random() * 15 + 10;
    const delay = Math.random() * -20;
    const opacity = Math.random() * 0.3 + 0.1;
    const drift = Math.random() * 100 - 50;

    return (
      <div
        key={i}
        className="snow-particle"
        style={{
          left: `${left}%`,
          width: `${size}px`,
          height: `${size}px`,
          animationDuration: `${duration}s`,
          animationDelay: `${delay}s`,
          '--particle-opacity': opacity,
          '--drift-x': `${drift}px`,
        } as React.CSSProperties}
      />
    );
  });
};

// --- 3. ORB COMPONENT ---
const Orb = ({ status, color, x, y }: { status: string, color: string, x: any, y: any }) => {
  return (
    <motion.div
      className="absolute top-1/2 left-1/2 pointer-events-none z-0"
      style={{ 
        x, y,
        translateX: "-50%", translateY: "-50%",
        width: '600px', height: '600px', 
        filter: 'blur(100px)', mixBlendMode: 'screen' 
      }}
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: status === 'idle' ? 0.4 : status === 'thinking' ? 0.8 : 0.6,
        scale: status === 'thinking' ? [1, 2.2, 0.6, 1] : [1, 1.1, 1], 
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`
      }}
      transition={{ 
        duration: status === 'thinking' ? 8.5 : 8, 
        times: status === 'thinking' ? [0, 0.45, 0.9, 1] : undefined,
        repeat: status === 'thinking' ? 0 : Infinity, 
        ease: "easeInOut" 
      }}
    />
  );
};

// --- 4. ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.08, delayChildren: 0.2 } 
  },
  exit: { opacity: 0, filter: "blur(10px)", transition: { duration: 1 } }
}

const wordVariants = {
  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
  visible: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { duration: 0.8, ease: "easeOut" } 
  }
}

function App() {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'thinking' | 'reflected'>('idle')
  const [breathText, setBreathText] = useState('Listening...') 
  const [result, setResult] = useState<ReflectionData | null>(null)
  const [orbColor, setOrbColor] = useState('#6366f1') 
  const [hasInteracted, setHasInteracted] = useState(false)

  const snowParticles = useMemo(() => generateSnow(50), []); 

  // --- PARALLAX & PHYSICS ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const orbX = useTransform(smoothX, [-1, 1], [30, -30]);
  const orbY = useTransform(smoothY, [-1, 1], [30, -30]);
  const snowX = useTransform(smoothX, [-1, 1], [50, -50]);
  const snowY = useTransform(smoothY, [-1, 1], [50, -50]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const startAudio = () => {
    if (!hasInteracted) {
      soundEngine.ambient.play();
      soundEngine.ambient.fade(0, 0.5, 3000);
      setHasInteracted(true);
    }
  }

  const handleReflect = async () => {
    if (!text.trim()) return;
    
    startAudio();
    setStatus('thinking');
    
    setBreathText("Inhale...");
    setTimeout(() => setBreathText("Exhale..."), 4000); 
    setTimeout(() => setBreathText("Receiving..."), 8000); 

    const startTime = Date.now(); 

    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash-lite",
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ]
      });

      const prompt = `
        You are a mystical mirror. Analyze this text: "${text}".
        Identify the core emotion.
        CRITICAL INSTRUCTION: Return ONLY a raw JSON object.
        JSON Structure:
        {
          "reflection": "A poetic, comforting, 12-word insight.",
          "state": "A 2-3 word abstract title",
          "hexColor": "A hex code (Muted/Pastel). Example: #60a5fa"
        }
      `;

      const result = await model.generateContent(prompt);
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const resultData = JSON.parse(responseText);

      const elapsed = Date.now() - startTime;
      const minDuration = 8500; 
      const delay = Math.max(500, minDuration - elapsed);

      setTimeout(() => {
        soundEngine.shimmer.play();
        setResult(resultData);
        setOrbColor(resultData.hexColor);
        setStatus('reflected');
      }, delay);

    } catch (error: any) {
      setTimeout(() => {
        setResult({
          reflection: "The void whispers back, but the connection is faint.",
          state: "Silent Echo",
          hexColor: "#9ca3af"
        });
        setOrbColor("#9ca3af");
        setStatus('reflected');
      }, 8500);
    }
  };

  const handleReset = () => {
    setText('');
    setStatus('idle');
    setOrbColor('#6366f1');
    setTimeout(() => {
      setResult(null);
    }, 1000);
  }

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden" onClick={startAudio}>
      
      {/* 1. THE ATMOSPHERE LAYER (Dynamic Background Bleed) */}
      <motion.div 
        className="absolute inset-0 z-[-1]"
        animate={{ 
          background: `radial-gradient(120% 120% at 50% 50%, ${orbColor}15 0%, #050505 100%)`
        }}
        transition={{ duration: 4 }}
      />

      <div className="noise-overlay" />
      
      {/* 2. PARALLAX SNOW */}
      <motion.div className="snow-container" style={{ x: snowX, y: snowY }}>
        {snowParticles}
      </motion.div>

      {/* 3. PARALLAX ORB */}
      <Orb status={status} color={orbColor} x={orbX} y={orbY} />

      <div className="relative w-full max-w-4xl px-8 z-10">
        <AnimatePresence mode="wait">
          
          {/* STATE 1: INPUT */}
          {status === 'idle' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: "blur(15px)", transition: { duration: 1 } }}
              transition={{ duration: 1.5 }}
              className="flex flex-col items-center justify-center w-full min-h-[60vh] gap-12"
            >
              <motion.h1 
                animate={{ opacity: text ? 0 : 1, filter: text ? "blur(10px)" : "blur(0px)" }}
                transition={{ duration: 0.8 }}
                className="font-serif text-5xl md:text-7xl tracking-[0.2em] pointer-events-none text-center
                           bg-gradient-to-b from-white via-gray-300 to-gray-600 bg-clip-text text-transparent
                           drop-shadow-lg"
              >
                REFLECT
              </motion.h1>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What is weighing on you?"
                className="w-full h-40 md:h-60 bg-transparent text-center font-serif text-3xl md:text-5xl 
                           text-white/90 placeholder:text-white/20 focus:outline-none resize-none 
                           caret-glow leading-relaxed z-10"
                spellCheck="false"
              />

              <div className="h-12 flex items-center justify-center">
                <AnimatePresence>
                  {text.trim().length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                      transition={{ duration: 0.8 }}
                      onClick={handleReflect}
                      className="group relative px-8 py-3 rounded-full overflow-hidden transition-all hover:scale-105 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-white/5 backdrop-blur-md border border-white/10 rounded-full group-hover:bg-white/10 transition-all" />
                      <div className="absolute -inset-3 bg-gradient-to-r from-amber-500/0 via-amber-500/30 to-purple-500/0 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <span className="relative font-sans text-xs tracking-[0.3em] uppercase text-white/60 group-hover:text-white transition-colors">
                        Reflect
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* STATE 2: BREATHING */}
          {status === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.p 
                key={breathText} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.8 }}
                className="font-serif text-2xl text-white/50 italic tracking-widest"
              >
                {breathText}
              </motion.p>
            </motion.div>
          )}

          {/* STATE 3: REFLECTION */}
          {status === 'reflected' && result && (
            <motion.div
              key="result"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-center space-y-16"
            >
              <div className="font-serif text-3xl md:text-5xl leading-tight text-white drop-shadow-2xl flex flex-wrap justify-center gap-x-3 gap-y-1">
                {result.reflection.split(" ").map((word, i) => (
                  <motion.span 
                     key={`${i}-${word}`} 
                     variants={wordVariants}
                     // TACTILE WORDS (HOVER GLOW)
                     whileHover={{ 
                       scale: 1.1, 
                       textShadow: `0 0 10px ${result.hexColor}`,
                       y: -5 
                     }}
                     className="inline-block cursor-default"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>

              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 2, duration: 2 }}
                className="flex flex-col items-center gap-6"
              >
                <p 
                  className="text-xs tracking-[0.5em] uppercase opacity-80"
                  style={{ color: result.hexColor, textShadow: `0 0 25px ${result.hexColor}` }}
                >
                  {result.state}
                </p>

                {/* RESTORED: SINGLE GOLDEN BUTTON */}
                <button
                  onClick={handleReset}
                  className="mt-8 text-white/20 hover:text-orange-400 transition-colors duration-500 text-xs tracking-widest uppercase"
                >
                  Reflect Again
                </button>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

export default App