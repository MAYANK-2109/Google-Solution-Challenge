import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Lock } from 'lucide-react';
import { useEffect, useRef } from 'react';

const HeroSection = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Google-color particles
    const COLORS = ['rgba(66,133,244,', 'rgba(234,67,53,', 'rgba(251,188,4,', 'rgba(52,168,83,'];
    const particles = Array.from({ length: 55 }, (_, i) => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.4 + 0.1,
      color: COLORS[i % COLORS.length],
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(66,133,244,${0.06 * (1 - dist / 90)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-brand-bg transition-colors duration-300">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />

      {/* Gradient orbs */}
      <div className="absolute top-1/3 left-1/4 w-[450px] h-[450px] bg-[#4285F4]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#34A853]/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-28 pb-20 flex flex-col lg:flex-row items-center gap-16">
        {/* Left */}
        <div className="flex-1 text-center lg:text-left">
          {/* Google badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4285F4]/10 border border-[#4285F4]/20 rounded-full text-[#4285F4] text-sm font-semibold mb-8 animate-fade-in-up">
            <span className="text-base">🏆</span>
            Google Solution Challenge 2025 · Safety Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] animate-fade-in-up text-brand-text">
            Every traveler<br />
            deserves a{' '}
            <span className="text-[#38bdf8]">SAHELI</span>.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-brand-muted max-w-xl mx-auto lg:mx-0 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            SAHELI is a real-time emergency response platform that monitors traveler biometrics, triggers AI-powered incident analysis, and connects people to security teams instantly.
          </p>

          {/* Meaning of SAHELI */}
          <p className="mt-3 text-sm text-[#4285F4]/90 font-medium italic animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <span className="font-bold not-italic">SAHELI</span> — meaning <em>"companion"</em> in Hindi. Because safety should never feel alone.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#4285F4] hover:bg-[#3367d6] text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 text-base active:scale-95">
              Get Started Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-brand-border hover:border-[#4285F4]/40 text-brand-muted hover:text-[#4285F4] font-semibold rounded-2xl transition-all duration-300 text-base">
              <Lock size={16} />
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center gap-6 justify-center lg:justify-start animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            {[
              { label: 'Real-Time AI Analysis', dot: 'bg-[#4285F4]' },
              { label: 'IoT Biometrics', dot: 'bg-[#34A853]' },
              { label: 'BLE Smartwatch', dot: 'bg-[#FBBC04]' },
              { label: 'End-to-End Encrypted', dot: 'bg-[#EA4335]' },
            ].map(({ label, dot }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs font-medium text-brand-muted">
                <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Animated shield */}
        <div className="relative flex-shrink-0 flex items-center justify-center w-72 h-72 lg:w-96 lg:h-96 animate-float">
          <div className="absolute inset-0 rounded-full border border-[#4285F4]/10 animate-spin-slow" />
          <div className="absolute inset-4 rounded-full border border-[#34A853]/10 animate-spin-slow" style={{ animationDirection: 'reverse' }} />
          <div className="absolute inset-8 rounded-full bg-[#4285F4]/5 animate-ping-slow" />
          <div className="absolute inset-16 rounded-full bg-[#34A853]/5 animate-ping-slow" style={{ animationDelay: '1s' }} />
          <div className="relative w-36 h-36 bg-gradient-to-br from-[#4285F4] to-[#34A853] rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
            <Shield size={72} className="text-white" />
          </div>
          {/* Stat chips */}
          {[
            { label: 'Response Time', value: '< 30s', bg: 'bg-[#34A853]/10 border-[#34A853]/30', txt: 'text-[#34A853]', pos: '-top-4 -right-4' },
            { label: 'AI Powered',    value: 'Gemini', bg: 'bg-[#4285F4]/10 border-[#4285F4]/30', txt: 'text-[#4285F4]', pos: '-bottom-4 -left-4' },
            { label: 'BLE Ready',     value: '✓ Watch', bg: 'bg-[#FBBC04]/10 border-[#FBBC04]/30', txt: 'text-[#FBBC04]', pos: 'top-1/2 -left-12 -translate-y-1/2' },
          ].map(({ label, value, bg, txt, pos }) => (
            <div key={label} className={`absolute ${pos} ${bg} border backdrop-blur-sm rounded-xl px-3 py-2 min-w-[90px] shadow-lg`}>
              <p className={`text-sm font-black ${txt}`}>{value}</p>
              <p className="text-[10px] text-brand-muted">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-bg to-transparent" />
    </section>
  );
};

export default HeroSection;
