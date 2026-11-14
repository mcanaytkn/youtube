import React, {CSSProperties} from "react";
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
} from "remotion";
import {loadFont as loadInter} from "@remotion/google-fonts/Inter";
import {loadFont as loadPlayfair} from "@remotion/google-fonts/PlayfairDisplay";

/* ================================================================== */
/*  SETTINGS                                                           */
/* ================================================================== */
export const FPS = 30;
const VOICEOVER: string | null = null; // e.g. "voiceover.mp3" (put in /public)
const MUSIC: string | null = null; // e.g. "ambient.mp3"

const inter = loadInter("normal", {weights: ["400", "500", "600"], subsets: ["latin"]});
const playfair = loadPlayfair("normal", {weights: ["600", "700"], subsets: ["latin"]});
const SANS = inter.fontFamily;
const SERIF = playfair.fontFamily;

const C = {
  bg: "#070910",
  ink: "#f4f1ea",
  mute: "#a3abba",
  amber: "#f2b45e",
  teal: "#6fe3d2",
  rose: "#ff6f86",
  violet: "#9b8cff",
};

const H = (size: number, color: string = C.ink): CSSProperties => ({
  fontFamily: SERIF, fontSize: size, fontWeight: 700, lineHeight: 1.14, letterSpacing: -0.5, margin: 0, color,
});
const T = (size: number, color: string = C.mute): CSSProperties => ({
  fontFamily: SANS, fontSize: size, lineHeight: 1.4, fontWeight: 500, margin: 0, color,
});

const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;
const ease = Easing.bezier(0.16, 1, 0.3, 1);
const prog = (f: number, s: number, d = 24) => interpolate(f, [s, s + d], [0, 1], {...clamp, easing: ease});
const pop = (f: number, at: number) =>
  spring({frame: Math.max(0, f - at), fps: FPS, config: {damping: 11, stiffness: 120, mass: 0.7}});

/* ================================================================== */
/*  PRIMITIVES                                                         */
/* ================================================================== */
const Reveal: React.FC<{
  at?: number;
  dir?: "up" | "down" | "left" | "right" | "zoom" | "none";
  style?: CSSProperties;
  children: React.ReactNode;
}> = ({at = 0, dir = "up", style, children}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, 30);
  const t =
    dir === "up" ? `translateY(${(1 - p) * 40}px)`
    : dir === "down" ? `translateY(${-(1 - p) * 40}px)`
    : dir === "left" ? `translateX(${-(1 - p) * 50}px)`
    : dir === "right" ? `translateX(${(1 - p) * 50}px)`
    : dir === "zoom" ? `scale(${0.88 + 0.12 * p})`
    : "none";
  return <div style={{opacity: p, transform: t, ...style}}>{children}</div>;
};

const PhaseInner: React.FC<{len: number; children: React.ReactNode}> = ({len, children}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 14, len - 14, len], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: o, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 34}}>
      {children}
    </AbsoluteFill>
  );
};
const Phase: React.FC<{from: number; to: number; children: React.ReactNode}> = ({from, to, children}) => (
  <Sequence from={from} durationInFrames={to - from} layout="none">
    <PhaseInner len={to - from}>{children}</PhaseInner>
  </Sequence>
);

const Panel: React.FC<{accent?: string; style?: CSSProperties; children?: React.ReactNode}> = ({accent, style, children}) => (
  <div
    style={{
      background: "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
      border: `1px solid ${accent ? accent + "66" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 28,
      padding: 34,
      boxShadow: `0 30px 80px rgba(0,0,0,0.45)${accent ? `, 0 0 60px ${accent}1a` : ""}`,
      ...style,
    }}
  >
    {children}
  </div>
);

const Row: React.FC<{gap?: number; style?: CSSProperties; children: React.ReactNode}> = ({gap = 40, style, children}) => (
  <div style={{display: "flex", gap, alignItems: "center", justifyContent: "center", ...style}}>{children}</div>
);

const Pill: React.FC<{color: string; children: React.ReactNode}> = ({color, children}) => (
  <span style={{display: "inline-block", fontFamily: SANS, fontSize: 26, fontWeight: 600, color, border: `1px solid ${color}88`, background: `${color}14`, padding: "9px 20px", borderRadius: 999}}>
    {children}
  </span>
);

const Struck: React.FC<{at: number; color?: string; children: React.ReactNode}> = ({at, color = C.rose, children}) => {
  const f = useCurrentFrame();
  return (
    <span style={{position: "relative", display: "inline-block", opacity: interpolate(f, [at, at + 24], [1, 0.45], clamp)}}>
      {children}
      <span style={{position: "absolute", left: -4, top: "54%", height: 5, width: `${prog(f, at, 24) * 105}%`, background: color, borderRadius: 3}} />
    </span>
  );
};

/** Animated keyword */
const Fx: React.FC<{
  t: "pop" | "shake" | "shrink" | "glow" | "drop" | "underline" | "pulse";
  at?: number;
  color?: string;
  children: React.ReactNode;
}> = ({t, at = 0, color = C.amber, children}) => {
  const f = useCurrentFrame();
  const l = Math.max(0, f - at);
  const sp = pop(f, at);
  const base: CSSProperties = {display: "inline-block", color, position: "relative"};
  let st: CSSProperties = base;
  if (t === "pop") st = {...base, opacity: Math.min(1, sp * 3), transform: `scale(${0.4 + 0.6 * sp})`};
  if (t === "drop") st = {...base, opacity: Math.min(1, sp * 3), transform: `translateY(${(1 - sp) * -80}px)`};
  if (t === "shake") st = {...base, transform: `translateX(${l % 90 < 26 ? Math.sin(l * 1.3) * 7 : 0}px)`};
  if (t === "shrink") st = {...base, transform: `scale(${interpolate(l, [0, 100], [1.2, 0.72], {...clamp, easing: Easing.inOut(Easing.cubic)})})`};
  if (t === "glow") st = {...base, textShadow: `0 0 ${24 + Math.sin(l / 9) * 14}px ${color}aa`};
  if (t === "pulse") st = {...base, transform: `scale(${1 + Math.sin(l / 8) * 0.05})`};
  return (
    <span style={st}>
      {children}
      {t === "underline" && (
        <span style={{position: "absolute", left: 0, bottom: -6, height: 6, borderRadius: 3, background: color, width: `${prog(f, at, 26) * 100}%`}} />
      )}
    </span>
  );
};

const Typed: React.FC<{text: string; at?: number; speed?: number; style?: CSSProperties}> = ({text, at = 0, speed = 0.9, style}) => {
  const f = useCurrentFrame();
  const n = Math.max(0, Math.min(text.length, Math.floor((f - at) * speed)));
  return (
    <span style={style}>
      {text.slice(0, n)}
      <span style={{opacity: f % 30 < 15 ? 1 : 0}}>|</span>
    </span>
  );
};

const Draw: React.FC<{d: string; at: number; dur?: number; color: string; w?: number}> = ({d, at, dur = 40, color, w = 8}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1} strokeDashoffset={1 - p} />;
};

const Track: React.FC<{label: string; sub?: string; at: number; to: number; color: string; dur?: number}> = ({label, sub, at, to, color, dur = 120}) => {
  const f = useCurrentFrame();
  const w = interpolate(f, [at, at + dur], [0, to], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <div style={{width: "100%"}}>
      <div style={{display: "flex", alignItems: "baseline", gap: 18, marginBottom: 12}}>
        <div style={T(36, C.ink)}>{label}</div>
        {sub && <div style={T(26)}>{sub}</div>}
      </div>
      <div style={{height: 28, borderRadius: 14, background: "rgba(255,255,255,0.08)", overflow: "hidden"}}>
        <div style={{width: `${w}%`, height: "100%", borderRadius: 14, background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 28px ${color}88`}} />
      </div>
    </div>
  );
};

/* ================================================================== */
/*  ILLUSTRATIONS                                                      */
/* ================================================================== */
const Mirror: React.FC = () => {
  const f = useCurrentFrame();
  const sx = ((f % 160) / 160) * 520 - 120;
  const arch = "M30 520 V190 C30 90 110 30 190 30 C270 30 350 90 350 190 V520 Z";
  return (
    <svg width={380} height={540} viewBox="0 0 380 540">
      <defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2b3350" />
          <stop offset="1" stopColor="#10131e" />
        </linearGradient>
        <clipPath id="mc"><path d={arch} /></clipPath>
      </defs>
      <path d={arch} fill="url(#mg)" stroke={C.amber} strokeWidth={10} />
      <g clipPath="url(#mc)">
        <circle cx={190} cy={250} r={46} fill="rgba(255,255,255,.2)" />
        <path d="M95 540 C95 390 140 335 190 335 C240 335 285 390 285 540 Z" fill="rgba(255,255,255,.2)" />
        <rect x={sx} y={0} width={70} height={540} fill="#fff" opacity={0.1} transform="rotate(20 190 270)" />
      </g>
    </svg>
  );
};

const AlarmClock: React.FC = () => {
  const f = useCurrentFrame();
  const rot = f % 60 < 30 ? Math.sin(f * 1.5) * 6 : 0;
  const ring = (f % 30) / 30;
  return (
    <svg width={260} height={260} viewBox="0 0 200 200">
      <g transform={`rotate(${rot} 100 110)`}>
        <circle cx={48} cy={42} r={24} fill={C.amber} />
        <circle cx={152} cy={42} r={24} fill={C.amber} />
        <circle cx={100} cy={110} r={68} fill="#181c29" stroke={C.amber} strokeWidth={8} />
        <line x1={100} y1={110} x2={100} y2={64} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <line x1={100} y1={110} x2={132} y2={126} stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
        <circle cx={100} cy={110} r={6} fill={C.amber} />
        <line x1={60} y1={170} x2={46} y2={190} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
        <line x1={140} y1={170} x2={154} y2={190} stroke={C.amber} strokeWidth={7} strokeLinecap="round" />
      </g>
      {[0, 1].map((i) => {
        const k = (ring + i * 0.5) % 1;
        return <circle key={i} cx={100} cy={110} r={82 + k * 34} fill="none" stroke={C.rose} strokeOpacity={1 - k} strokeWidth={3} />;
      })}
    </svg>
  );
};

const Moon: React.FC<{size?: number}> = ({size = 200}) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <defs>
      <mask id="mm">
        <rect width={100} height={100} fill="white" />
        <circle cx={68} cy={38} r={34} fill="black" />
      </mask>
    </defs>
    <circle cx={50} cy={50} r={38} fill="#f4efe0" mask="url(#mm)" />
  </svg>
);

const Stars: React.FC = () => {
  const f = useCurrentFrame();
  const pts = [[80, 60], [260, 140], [420, 40], [560, 180], [700, 70], [860, 150], [980, 50], [150, 260], [620, 300], [900, 280]];
  return (
    <svg width={1100} height={340} viewBox="0 0 1100 340" style={{position: "absolute", inset: 0}}>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3 + (i % 3)} fill={C.ink} opacity={0.35 + 0.35 * Math.sin(f / 12 + i)} />
      ))}
    </svg>
  );
};

const Elephant: React.FC<{rider?: boolean; sink?: number; scale?: number; glow?: boolean}> = ({rider = false, sink = 0, scale = 1, glow = false}) => {
  const f = useCurrentFrame();
  const br = Math.sin(f / 20) * 3;
  const bob = Math.sin(f / 14) * 4;
  return (
    <svg width={620 * scale} height={460 * scale} viewBox="0 0 620 460" style={{overflow: "visible"}}>
      <defs>
        <linearGradient id="eleG" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6480" />
          <stop offset="1" stopColor="#2a3045" />
        </linearGradient>
        <radialGradient id="riderG">
          <stop offset="0" stopColor={C.amber} stopOpacity={0.5} />
          <stop offset="1" stopColor={C.amber} stopOpacity={0} />
        </radialGradient>
      </defs>
      {glow && <ellipse cx={300} cy={260} rx={300} ry={220} fill={C.teal} opacity={0.08 + 0.05 * Math.sin(f / 14)} />}
      <ellipse cx={300} cy={425} rx={250} ry={16} fill="rgba(0,0,0,.45)" />
      <g transform={`translate(0 ${sink})`}>
        {[170, 250, 350, 420].map((x) => (
          <rect key={x} x={x} y={290} width={52} height={125} rx={22} fill="#3a4259" />
        ))}
        <path d="M122 235 C88 255 95 305 114 335" stroke="#3a4259" strokeWidth={10} fill="none" strokeLinecap="round" />
        <g transform={`translate(0 ${br})`}>
          <rect x={120} y={170} width={330} height={170} rx={85} fill="url(#eleG)" />
          <circle cx={470} cy={225} r={80} fill="url(#eleG)" />
          <path d="M520 250 C585 270 590 340 552 392" stroke="#4a5470" strokeWidth={40} strokeLinecap="round" fill="none" />
          <ellipse cx={425} cy={225} rx={42} ry={62} fill="#465069" stroke="rgba(255,255,255,.12)" />
          <path d="M500 282 C528 292 543 306 546 324" stroke="#f1e8d4" strokeWidth={9} fill="none" strokeLinecap="round" />
          <circle cx={498} cy={205} r={6} fill={C.ink} />
        </g>
      </g>
      {rider && (
        <g transform={`translate(0 ${bob + br})`}>
          <circle cx={300} cy={130} r={70} fill="url(#riderG)" />
          <rect x={282} y={128} width={36} height={50} rx={16} fill={C.amber} />
          <circle cx={300} cy={106} r={20} fill={C.amber} />
        </g>
      )}
    </svg>
  );
};

const Couch: React.FC<{worn?: boolean}> = ({worn}) => {
  const f = useCurrentFrame();
  const col = worn ? "#7a5a3c" : "#4a7d8c";
  const dark = worn ? "#5a4029" : "#356170";
  return (
    <svg width={470} height={300} viewBox="0 0 470 300">
      <ellipse cx={235} cy={278} rx={200} ry={14} fill="rgba(0,0,0,.45)" />
      <rect x={70} y={40} width={330} height={130} rx={46} fill={dark} />
      <rect x={20} y={100} width={82} height={150} rx={34} fill={col} />
      <rect x={368} y={100} width={82} height={150} rx={34} fill={col} />
      {worn ? (
        <path d="M92 150 Q235 235 378 150 L378 222 L92 222 Z" fill={col} />
      ) : (
        <rect x={92} y={150} width={286} height={72} rx={16} fill={col} />
      )}
      <rect x={60} y={248} width={16} height={28} rx={6} fill="#222" />
      <rect x={394} y={248} width={16} height={28} rx={6} fill="#222" />
      {worn && (
        <path d="M300 180 l10 -10 l-20 -10 l20 -10 l-20 -10 l10 -8" stroke={C.amber} strokeWidth={5} fill="none" strokeLinecap="round" transform={`translate(0 ${Math.sin(f / 10) * 2})`} />
      )}
      {!worn && (
        <text x={235} y={135} textAnchor="middle" fontFamily={SERIF} fontSize={76} fill={C.violet} opacity={0.5 + 0.4 * Math.sin(f / 10)}>?</text>
      )}
    </svg>
  );
};

const Person: React.FC<{color: string; dashed?: boolean; size?: number}> = ({color, dashed, size = 1}) => {
  const fill = dashed ? "none" : color + "33";
  const dash = dashed ? "10 12" : undefined;
  return (
    <svg width={220 * size} height={300 * size} viewBox="0 0 220 300">
      <circle cx={110} cy={75} r={52} fill={fill} stroke={color} strokeWidth={5} strokeDasharray={dash} />
      <path d="M30 290 C30 180 70 140 110 140 C150 140 190 180 190 290 Z" fill={fill} stroke={color} strokeWidth={5} strokeDasharray={dash} />
    </svg>
  );
};

const GuardDoor: React.FC = () => {
  const f = useCurrentFrame();
  const glow = 0.45 + Math.sin(f / 20) * 0.1;
  return (
    <svg width={560} height={560} viewBox="0 0 620 560">
      <defs>
        <radialGradient id="dg" cx="50%" cy="50%">
          <stop offset="0" stopColor={C.amber} stopOpacity={glow} />
          <stop offset="1" stopColor={C.amber} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={400} cy={270} r={260} fill="url(#dg)" />
      <path d="M280 540 V200 C280 130 330 90 400 90 C470 90 520 130 520 200 V540 Z" fill="#ffe0a3" stroke="#2a2f3d" strokeWidth={8} />
      <g transform="translate(400 0)">
        <circle cx={0} cy={235} r={46} fill="#141824" stroke={C.rose} strokeWidth={4} />
        <path d="M-95 540 C-95 390 -55 325 0 325 C55 325 95 390 95 540 Z" fill="#141824" stroke={C.rose} strokeWidth={4} />
        <path d="M-70 410 L70 450 M-70 450 L70 410" stroke={C.rose} strokeWidth={10} strokeLinecap="round" opacity={0.8} />
      </g>
    </svg>
  );
};

const DoorOpen: React.FC<{open: number}> = ({open}) => {
  const f = useCurrentFrame();
  const rays = [];
  for (let i = -5; i <= 5; i++) {
    rays.push(<line key={i} x1={260} y1={300} x2={260 + i * 70} y2={-120} stroke={C.amber} strokeWidth={26} strokeOpacity={open * (0.08 + 0.04 * Math.sin(f / 15 + i))} />);
  }
  return (
    <svg width={520} height={620} viewBox="0 0 520 620" style={{overflow: "visible"}}>
      <defs>
        <radialGradient id="dgl" cx="50%" cy="45%">
          <stop offset="0" stopColor="#fff2cc" stopOpacity={0.4 + 0.6 * open} />
          <stop offset="1" stopColor={C.amber} stopOpacity={0.2 + 0.5 * open} />
        </radialGradient>
      </defs>
      {rays}
      <path d="M90 600 V220 C90 130 170 70 260 70 C350 70 430 130 430 220 V600 Z" fill="url(#dgl)" stroke="#2a2f3d" strokeWidth={10} />
      <path d={`M90 600 V220 C90 130 170 70 260 70 L260 70 L${90 + 340 * (1 - open)} 70 V600 Z`} fill="#1a1e29" stroke="#0d1017" strokeWidth={4} opacity={0.96} />
    </svg>
  );
};

const Compass: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const l = Math.max(0, f - at);
  const ang = 35 + 260 * Math.exp(-l / 28) * Math.cos(l / 6);
  return (
    <svg width={240} height={240} viewBox="0 0 200 200">
      <circle cx={100} cy={100} r={88} fill="#141824" stroke={C.amber} strokeWidth={6} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={100} y1={22} x2={100} y2={36} stroke={C.mute} strokeWidth={4} transform={`rotate(${a} 100 100)`} />
      ))}
      <g transform={`rotate(${ang} 100 100)`}>
        <path d="M100 26 L113 100 L100 110 L87 100 Z" fill={C.amber} />
        <path d="M100 174 L113 100 L100 110 L87 100 Z" fill="#4a5470" />
      </g>
      <circle cx={100} cy={100} r={8} fill={C.ink} />
    </svg>
  );
};

const ScaleSvg: React.FC<{tilt: number; l: string; r: string}> = ({tilt, l, r}) => {
  const a = (tilt * Math.PI) / 180;
  const cx = 170, cy = 70, h = 120;
  const lx = cx - h * Math.cos(a), ly = cy - h * Math.sin(a);
  const rx = cx + h * Math.cos(a), ry = cy + h * Math.sin(a);
  const Pan = (x: number, y: number, label: string, color: string) => (
    <g>
      <line x1={x} y1={y} x2={x - 46} y2={y + 80} stroke={C.mute} strokeWidth={3} />
      <line x1={x} y1={y} x2={x + 46} y2={y + 80} stroke={C.mute} strokeWidth={3} />
      <path d={`M${x - 58} ${y + 80} H${x + 58} Q${x + 50} ${y + 112} ${x} ${y + 112} Q${x - 50} ${y + 112} ${x - 58} ${y + 80} Z`} fill={color + "44"} stroke={color} strokeWidth={4} />
      <text x={x} y={y + 150} textAnchor="middle" fontFamily={SANS} fontSize={28} fontWeight={600} fill={color}>{label}</text>
    </g>
  );
  return (
    <svg width={380} height={360} viewBox="0 0 340 320" style={{overflow: "visible"}}>
      <path d="M170 70 L170 270" stroke="#3b4259" strokeWidth={10} />
      <path d="M110 292 L170 250 L230 292 Z" fill="#3b4259" />
      <line x1={lx} y1={ly} x2={rx} y2={ry} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={12} fill={C.teal} />
      {Pan(lx, ly, l, C.amber)}
      {Pan(rx, ry, r, C.teal)}
    </svg>
  );
};

const Gauge: React.FC<{v: number; color: string; left?: string; right?: string; size?: number}> = ({v, color, left, right, size = 1}) => (
  <svg width={300 * size} height={220 * size} viewBox="0 0 300 220">
    <path d="M30 160 A120 120 0 0 1 270 160" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={22} strokeLinecap="round" />
    <path d="M30 160 A120 120 0 0 1 270 160" pathLength={1} fill="none" stroke={color} strokeWidth={22} strokeLinecap="round" strokeDasharray={1} strokeDashoffset={1 - v} />
    <g transform={`rotate(${-90 + 180 * v} 150 160)`}>
      <path d="M150 52 L158 160 L142 160 Z" fill={C.ink} />
    </g>
    <circle cx={150} cy={160} r={14} fill={C.ink} />
    {left && <text x={30} y={200} textAnchor="middle" fontFamily={SANS} fontSize={24} fontWeight={600} fill={C.mute}>{left}</text>}
    {right && <text x={270} y={200} textAnchor="middle" fontFamily={SANS} fontSize={24} fontWeight={600} fill={C.mute}>{right}</text>}
  </svg>
);

const Glass: React.FC<{level: number}> = ({level}) => {
  const path = "M40 40 L220 40 L196 350 Q195 360 185 360 L75 360 Q65 360 64 350 Z";
  return (
    <svg width={260} height={380} viewBox="0 0 260 380">
      <defs><clipPath id="gc"><path d={path} /></clipPath></defs>
      <path d={path} fill="rgba(255,255,255,.05)" />
      <rect x={0} y={360 - 320 * level} width={260} height={320 * level + 20} fill={C.teal} opacity={0.55} clipPath="url(#gc)" />
      <path d={path} fill="none" stroke="rgba(255,255,255,.55)" strokeWidth={6} strokeLinejoin="round" />
    </svg>
  );
};

const Feed: React.FC = () => {
  const f = useCurrentFrame();
  const cols = [C.violet, C.rose, C.amber, C.teal, "#6aa0ff", "#c78bff"];
  const y = -((f * 16) % 1320);
  return (
    <div style={{width: 300, height: 540, borderRadius: 48, border: "8px solid #2a2f3d", background: "#0c0f17", overflow: "hidden", position: "relative"}}>
      <div style={{transform: `translateY(${y}px)`, padding: 14}}>
        {cols.concat(cols).map((c, i) => (
          <div key={i} style={{height: 200, marginBottom: 20, borderRadius: 24, background: `linear-gradient(150deg, ${c}, #1a1e2b)`, display: "flex", alignItems: "center", justifyContent: "center"}}>
            <svg width={60} height={60} viewBox="0 0 60 60">
              <circle cx={30} cy={30} r={28} fill="rgba(0,0,0,.35)" />
              <path d="M24 17 L44 30 L24 43 Z" fill="#fff" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

const Icon: React.FC<{kind: string; color: string}> = ({kind, color}) => (
  <svg width={64} height={64} viewBox="0 0 64 64" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
    {kind === "up" && (
      <g>
        <circle cx={32} cy={36} r={12} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <line key={a} x1={32} y1={10} x2={32} y2={18} transform={`rotate(${a} 32 36)`} />
        ))}
      </g>
    )}
    {kind === "gym" && (
      <g>
        <line x1={14} y1={32} x2={50} y2={32} />
        <rect x={8} y={20} width={8} height={24} rx={3} />
        <rect x={48} y={20} width={8} height={24} rx={3} />
        <rect x={16} y={24} width={5} height={16} rx={2} />
        <rect x={43} y={24} width={5} height={16} rx={2} />
      </g>
    )}
    {kind === "journal" && (
      <g>
        <rect x={14} y={8} width={36} height={48} rx={5} />
        <line x1={22} y1={22} x2={42} y2={22} />
        <line x1={22} y1={32} x2={42} y2={32} />
        <line x1={22} y1={42} x2={34} y2={42} />
      </g>
    )}
    {kind === "english" && (
      <g>
        <path d="M10 14 H54 V40 H30 L18 52 V40 H10 Z" />
        <path d="M24 33 L32 19 L40 33 M27 28 H37" />
      </g>
    )}
  </svg>
);

/* ================================================================== */
/*  VISUALS (one per chapter)                                          */
/* ================================================================== */

/* ---------- 1 · THE LOOP ---------- */
const DayChart: React.FC = () => {
  const f = useCurrentFrame();
  const dots = [[160, 150], [480, 120], [800, 150], [1120, 400]];
  return (
    <svg width={1300} height={470} viewBox="0 0 1300 520">
      <line x1={60} y1={400} x2={1240} y2={400} stroke={C.amber} strokeWidth={3} strokeDasharray="10 12" opacity={0.7} />
      <text x={70} y={380} fontFamily={SANS} fontSize={28} fill={C.amber}>Where you started</text>
      <Draw d="M160 150 C260 130 380 110 480 120 C580 130 700 160 800 150" at={20} dur={110} color={C.teal} w={9} />
      <Draw d="M800 150 C940 142 1000 400 1120 400" at={240} dur={60} color={C.rose} w={9} />
      {dots.map((p, i) => {
        const at = i < 3 ? 30 + i * 45 : 290;
        const s = pop(f, at);
        const c = i < 3 ? C.teal : C.rose;
        return (
          <g key={i}>
            {i === 3 && <circle cx={p[0]} cy={p[1]} r={26 + 14 * Math.sin(f / 8)} fill="none" stroke={C.rose} strokeOpacity={0.5} strokeWidth={3} />}
            <circle cx={p[0]} cy={p[1]} r={16 * s} fill={c} />
            <text x={p[0]} y={480} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={600} fill={i < 3 ? C.ink : C.rose}>Day {i + 1}</text>
          </g>
        );
      })}
    </svg>
  );
};

const V1: React.FC = () => (
  <>
    <Phase from={0} to={300}>
      <Row gap={90}>
        <Reveal dir="zoom"><Mirror /></Reveal>
        <Reveal at={30} dir="left">
          <div style={{...H(80), maxWidth: 820}}>
            “I’m <Fx t="glow" at={70}>worth it</Fx>,<br />
            I <Fx t="pop" at={130} color={C.teal}>can do this</Fx>.”
          </div>
        </Reveal>
      </Row>
    </Phase>
    <Phase from={300} to={660}>
      <Reveal><div style={H(58)}>It lasts <Fx t="pop" at={30} color={C.teal}>three days</Fx>. By <Fx t="drop" at={250} color={C.rose}>day four</Fx>…</div></Reveal>
      <DayChart />
    </Phase>
    <Phase from={660} to={880}>
      <Row gap={60}>
        <Reveal dir="zoom">
          <Panel accent={C.rose} style={{textAlign: "center", width: 700}}>
            <AlarmClock />
            <div style={H(50)}>The alarm goes off, you <Fx t="shake" color={C.rose} at={20}>snooze</Fx> it.</div>
          </Panel>
        </Reveal>
        <Reveal at={40} dir="zoom">
          <Panel accent={C.amber} style={{width: 700, height: 470, display: "flex", flexDirection: "column", justifyContent: "center", gap: 28}}>
            {[0.8, 0.6, 0.7].map((w, i) => (
              <div key={i} style={{display: "flex", alignItems: "center", gap: 20}}>
                <div style={{width: 40, height: 40, borderRadius: 10, border: `3px solid ${C.mute}`}} />
                <div style={{height: 18, width: `${w * 100}%`, borderRadius: 9, background: "rgba(255,255,255,.14)"}} />
              </div>
            ))}
            <div style={H(46)}>You make a <Fx t="underline" at={30}>plan</Fx>, you <Fx t="shrink" color={C.rose} at={60}>don’t follow it</Fx>.</div>
          </Panel>
        </Reveal>
      </Row>
    </Phase>
    <Phase from={880} to={1080}>
      <div style={{position: "relative", width: 1100, height: 520, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24}}>
        <Stars />
        <Reveal dir="zoom"><Moon size={190} /></Reveal>
        <div style={{...H(66), textAlign: "center", zIndex: 1}}>
          <Typed text="“What’s wrong with me?”" at={30} speed={0.8} />
        </div>
      </div>
    </Phase>
  </>
);

/* ---------- 2 · WRONG PLACE ---------- */
const Magnifier: React.FC = () => {
  const f = useCurrentFrame();
  const x = 150 + Math.sin(f / 25) * 130;
  return (
    <svg width={460} height={140} viewBox="0 0 460 140">
      {[80, 230, 380].map((cx) => (
        <circle key={cx} cx={cx} cy={70} r={8} fill={C.mute} opacity={0.4} />
      ))}
      <g transform={`translate(${x} 0)`}>
        <circle cx={70} cy={60} r={36} fill="rgba(111,227,210,.1)" stroke={C.amber} strokeWidth={7} />
        <line x1={96} y1={86} x2={130} y2={120} stroke={C.amber} strokeWidth={10} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const NerveBody: React.FC = () => {
  const f = useCurrentFrame();
  const off = -(f * 0.6);
  const st = "rgba(255,255,255,.3)";
  const branches = [0, 1, 2, 3];
  return (
    <svg width={360} height={460} viewBox="0 0 360 460">
      <circle cx={180} cy={70} r={52} fill="rgba(255,255,255,.07)" stroke={st} strokeWidth={3} />
      <path d="M50 450 C50 270 100 190 180 190 C260 190 310 270 310 450 Z" fill="rgba(255,255,255,.07)" stroke={st} strokeWidth={3} />
      <path d="M180 122 L180 400" stroke={C.teal} strokeWidth={5} strokeDasharray="10 12" strokeDashoffset={off} />
      {branches.map((i) => (
        <g key={i}>
          <path d={`M180 ${225 + i * 48} C ${135 - i * 4} ${232 + i * 48} 105 ${250 + i * 48} 95 ${282 + i * 48}`} fill="none" stroke={C.teal} strokeWidth={3} strokeDasharray="8 10" strokeDashoffset={off} opacity={0.8} />
          <path d={`M180 ${225 + i * 48} C ${225 + i * 4} ${232 + i * 48} 255 ${250 + i * 48} 265 ${282 + i * 48}`} fill="none" stroke={C.teal} strokeWidth={3} strokeDasharray="8 10" strokeDashoffset={off} opacity={0.8} />
        </g>
      ))}
      <circle cx={180} cy={262} r={20 + 4 * Math.sin(f / 6)} fill={C.rose} opacity={0.85} />
    </svg>
  );
};

const V2: React.FC = () => (
  <>
    <Phase from={0} to={260}>
      <Reveal><div style={H(92)}><Fx t="drop" color={C.teal}>Nothing</Fx> is wrong with you.</div></Reveal>
      <Reveal at={70}><div style={T(44, C.ink)}>You’re just looking for the problem in the <Fx t="underline" at={110}>wrong place</Fx>.</div></Reveal>
      <Reveal at={50} dir="none"><Magnifier /></Reveal>
    </Phase>
    <Phase from={260} to={560}>
      <Row gap={80}>
        <Reveal dir="right">
          <Panel style={{width: 620, height: 440, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20, opacity: 0.85}}>
            <div style={T(28)}>Self-worth isn’t…</div>
            <div style={H(54)}><Struck at={90}>a nice sentence you tell yourself</Struck></div>
          </Panel>
        </Reveal>
        <Reveal at={80} dir="zoom"><NerveBody /></Reveal>
        <Reveal at={120} dir="left">
          <Panel accent={C.teal} style={{width: 420, height: 440, display: "flex", flexDirection: "column", justifyContent: "center", gap: 16}}>
            <div style={T(28, C.teal)}>It’s a</div>
            <div style={H(76, C.teal)}><Fx t="glow" color={C.teal} at={130}>feeling</Fx></div>
            <div style={T(28)}>your body and your nervous system carry</div>
          </Panel>
        </Reveal>
      </Row>
    </Phase>
    <Phase from={560} to={800}>
      <Reveal><div style={{...H(70), textAlign: "center", fontStyle: "italic"}}>“My effort isn’t <Fx t="pulse" color={C.rose} at={40}>wasted</Fx>,</div></Reveal>
      <Reveal at={70}><div style={{...H(70), textAlign: "center", fontStyle: "italic"}}>what I’m doing is <Fx t="underline" color={C.teal} at={110}>worth doing</Fx>.”</div></Reveal>
    </Phase>
    <Phase from={800} to={1020}>
      <Row gap={90}>
        <Reveal dir="zoom">
          <Panel style={{width: 640, textAlign: "center"}}>
            <div style={{height: 280, borderRadius: 22, background: "linear-gradient(150deg,#2b3350,#12151f)", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width={110} height={110} viewBox="0 0 60 60"><circle cx={30} cy={30} r={28} fill="rgba(255,255,255,.12)" /><path d="M24 17 L44 30 L24 43 Z" fill="#fff" /></svg>
            </div>
            <div style={{...H(44), marginTop: 22}}><Struck at={60}>affirmation video</Struck></div>
          </Panel>
        </Reveal>
        <Reveal at={80} dir="zoom">
          <Panel accent={C.amber} style={{width: 640, textAlign: "center"}}>
            <svg width={560} height={260} viewBox="0 0 560 260">
              <circle cx={280} cy={130} r={90} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={5} strokeDasharray="8 12" />
              <circle cx={280} cy={220} r={14} fill={C.rose} />
              <circle cx={280 - 90 * Math.sin(((useCurrentFrame() - 100) / 80) * Math.PI * 2)} cy={130 + 90 * Math.cos(((useCurrentFrame() - 100) / 80) * Math.PI * 2)} r={10} fill={C.amber} />
              <circle cx={90} cy={110} r={28} fill={C.amber} />
              <g transform="translate(436 80) scale(0.6)"><circle cx={50} cy={50} r={38} fill="#f4efe0" /><circle cx={68} cy={38} r={34} fill="#161a28" /></g>
              <text x={90} y={170} textAnchor="middle" fontFamily={SANS} fontSize={26} fill={C.mute}>morning</text>
              <text x={470} y={170} textAnchor="middle" fontFamily={SANS} fontSize={26} fill={C.mute}>night</text>
            </svg>
            <div style={H(46)}>the <Fx t="pulse" color={C.rose} at={100}>same spot</Fx></div>
          </Panel>
        </Reveal>
      </Row>
    </Phase>
  </>
);

/* ---------- 3 · THE ELEPHANT ---------- */
const V3: React.FC = () => (
  <>
    <Phase from={0} to={760}>
      <Row gap={50}>
        <Reveal dir="zoom"><Elephant rider /></Reveal>
        <div style={{width: 660, display: "flex", flexDirection: "column", gap: 26}}>
          <Reveal at={40} dir="left">
            <Panel accent={C.amber}>
              <div style={T(26, C.amber)}>On top: small, logical</div>
              <div style={H(58)}>The <Fx t="pop" at={60}>planner</Fx></div>
              <div style={{...T(32, C.ink), marginTop: 8}}>“tomorrow I’ll wake up early”</div>
            </Panel>
          </Reveal>
          <Reveal at={260} dir="left">
            <Panel accent={C.teal}>
              <div style={T(26, C.teal)}>Underneath: a giant elephant</div>
              <div style={H(54)}>Your <Fx t="glow" color={C.teal} at={290}>nervous system</Fx></div>
              <div style={{display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16}}>
                <Pill color={C.teal}>It gets scared</Pill>
                <Pill color={C.teal}>It loves its habits</Pill>
                <Pill color={C.teal}>Under pressure, it does whatever it wants</Pill>
              </div>
            </Panel>
          </Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={760} to={1180}>
      <div style={{width: 1400, display: "flex", flexDirection: "column", gap: 44}}>
        <Reveal><div style={H(58)}>All the energy goes to the <Fx t="pop" at={30}>little one</Fx> on top.</div></Reveal>
        <Reveal at={40}><Track label="The planner" sub="books · videos · better plans" at={60} to={100} dur={200} color={C.amber} /></Reveal>
        <Reveal at={80}><Track label="The elephant" sub="doesn’t move an inch" at={100} to={1.5} dur={20} color={C.rose} /></Reveal>
      </div>
    </Phase>
    <Phase from={1180} to={1500}>
      <Row gap={60}>
        <Reveal dir="zoom"><Elephant scale={0.85} glow /></Reveal>
        <div>
          <Reveal><div style={H(74)}>The problem was never <Fx t="shrink" color={C.rose} at={30}>up there</Fx>.</div></Reveal>
          <Reveal at={90}><div style={{...H(88), marginTop: 18}}>It’s the <Fx t="glow" color={C.teal} at={120}>elephant</Fx>.</div></Reveal>
        </div>
      </Row>
    </Phase>
  </>
);

/* ---------- 4 · THE OLD COUCH ---------- */
const Prediction: React.FC = () => {
  const f = useCurrentFrame();
  const n = interpolate(f, [0, 90], [0, 1], clamp);
  return (
    <svg width={1100} height={180} viewBox="0 0 1100 180">
      <path d="M0 90 C70 10 130 10 200 90 S330 170 400 90 S530 10 600 90" pathLength={1} stroke={C.teal} strokeWidth={6} fill="none" strokeDasharray={1} strokeDashoffset={1 - n} strokeLinecap="round" />
      <path d="M600 90 S670 170 740 90 S870 10 940 90 S1010 170 1080 90" fill="none" stroke={C.teal} strokeWidth={6} strokeDasharray="4 16" strokeLinecap="round" opacity={interpolate(f, [80, 120], [0, 1], clamp)} />
    </svg>
  );
};

const V4: React.FC = () => (
  <>
    <Phase from={0} to={200}>
      <Reveal><div style={{...H(76), textAlign: "center"}}>Your brain is a <Fx t="glow" color={C.teal} at={20}>prediction machine</Fx>.</div></Reveal>
      <Prediction />
    </Phase>
    <Phase from={200} to={700}>
      <Row gap={70}>
        <Reveal dir="right">
          <Panel accent={C.amber} style={{textAlign: "center"}}>
            <Couch worn />
            <div style={H(46)}>The <Fx t="pop" at={30}>old couch</Fx></div>
            <div style={{...T(30), marginTop: 10}}>It’s sagging, a spring is poking you.</div>
            <div style={{marginTop: 16}}><Pill color={C.amber}>You know exactly where it sinks</Pill></div>
          </Panel>
        </Reveal>
        <Reveal at={180} dir="left">
          <Panel accent={C.violet} style={{textAlign: "center"}}>
            <Couch />
            <div style={H(46)}>A brand new one</div>
            <div style={{...T(30), marginTop: 10}}>Nicer, sure, but <Fx t="pulse" color={C.violet} at={200}>unknown</Fx>.</div>
            <div style={{marginTop: 16}}><Pill color={C.violet}>Your back will hurt that first week</Pill></div>
          </Panel>
        </Reveal>
      </Row>
    </Phase>
    <Phase from={700} to={1120}>
      <Reveal><div style={H(60)}>Your brain looks at your <Fx t="underline" at={30}>identity</Fx> the same way.</div></Reveal>
      <Row gap={90}>
        <Reveal at={40} dir="right">
          <Panel accent={C.amber} style={{textAlign: "center"}}>
            <Person color={C.amber} size={0.8} />
            <div style={{...T(32, C.ink), lineHeight: 1.7}}>procrastinates<br />can’t say no<br />doubts everything</div>
            <div style={{marginTop: 14}}><Pill color={C.amber}>Uncomfortable, but familiar</Pill></div>
          </Panel>
        </Reveal>
        <Reveal at={160} dir="left">
          <Panel accent={C.violet} style={{textAlign: "center"}}>
            <Person color={C.violet} dashed size={0.8} />
            <div style={H(60, C.violet)}>Unknown.</div>
            <div style={{marginTop: 18, height: 44}} />
          </Panel>
        </Reveal>
      </Row>
    </Phase>
    <Phase from={1120} to={1440}>
      <Row gap={50}>
        <Reveal dir="zoom"><div style={H(110, C.violet)}>“unknown”</div></Reveal>
        <Reveal at={50}><div style={H(100, C.mute)}>→</div></Reveal>
        <Reveal at={90} dir="zoom"><div style={H(110, C.rose)}>“<Fx t="shake" color={C.rose} at={110}>danger</Fx>.”</div></Reveal>
      </Row>
    </Phase>
  </>
);

/* ---------- 5 · THE GUARD ---------- */
const Ecg: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const amp = interpolate(f, [at, at + 240], [0.2, 1], clamp);
  let d = "";
  for (let x = 0; x <= 1500; x += 6) {
    const t = ((((x - f * 10) % 300) + 300) % 300);
    let y = 0;
    if (t >= 100 && t < 112) y = -((t - 100) / 12) * 90 * amp;
    else if (t >= 112 && t < 130) y = -90 * amp + ((t - 112) / 18) * 150 * amp;
    else if (t >= 130 && t < 150) y = 60 * amp * (1 - (t - 130) / 20);
    d += (x === 0 ? "M" : "L") + x + " " + (110 + y) + " ";
  }
  return (
    <svg width={1500} height={220} viewBox="0 0 1500 220" style={{filter: `drop-shadow(0 0 12px ${C.rose}99)`}}>
      <path d={d} fill="none" stroke={C.rose} strokeWidth={5} strokeLinejoin="round" />
    </svg>
  );
};

const Trigger: React.FC<{text: string; at: number}> = ({text, at}) => {
  const f = useCurrentFrame();
  const k = ((f - at) % 40) / 40;
  return (
    <Reveal at={at} dir="up">
      <Panel accent={C.rose} style={{width: 340, padding: 26, display: "flex", alignItems: "center", gap: 18}}>
        <svg width={44} height={44} viewBox="0 0 44 44">
          <circle cx={22} cy={22} r={9} fill={C.rose} />
          <circle cx={22} cy={22} r={9 + 12 * Math.max(0, k)} fill="none" stroke={C.rose} strokeOpacity={1 - Math.max(0, k)} strokeWidth={3} />
        </svg>
        <div style={T(30, C.ink)}>{text}</div>
      </Panel>
    </Reveal>
  );
};

const Burst: React.FC = () => {
  const f = useCurrentFrame();
  let pts = "";
  for (let i = 0; i < 24; i++) {
    const r = (i % 2 === 0 ? 70 : 42) + Math.sin(f / 5 + i) * 4;
    const a = (i / 24) * Math.PI * 2;
    pts += `${90 + r * Math.cos(a)},${90 + r * Math.sin(a)} `;
  }
  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <polygon points={pts} fill={C.rose} opacity={0.85} />
    </svg>
  );
};

const ShrinkCircle: React.FC = () => {
  const f = useCurrentFrame();
  const r = interpolate(f, [60, 160], [70, 26], clamp);
  return (
    <svg width={180} height={180} viewBox="0 0 180 180">
      <circle cx={90} cy={90} r={76} fill="none" stroke="rgba(255,255,255,.2)" strokeDasharray="6 10" strokeWidth={3} />
      <circle cx={90} cy={90} r={r} fill={C.violet} />
    </svg>
  );
};

const SinkElephant: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{width: 260, height: 190, overflow: "hidden", position: "relative"}}>
      <Elephant scale={0.42} sink={interpolate(f, [100, 220], [0, 60], clamp)} />
      <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 46, background: "linear-gradient(180deg, transparent, #1a1e2b 70%)"}} />
    </div>
  );
};

const V5: React.FC = () => (
  <>
    <Phase from={0} to={540}>
      <Reveal>
        <div style={H(60)}>“I’m going to change.” <span style={{color: C.mute}}>→</span> <Fx t="shake" color={C.rose} at={90}>“my identity is under threat.”</Fx></div>
      </Reveal>
      <Reveal at={60} dir="none"><Ecg at={60} /></Reveal>
      <Row gap={22}>
        <Trigger text="Setting a boundary" at={150} />
        <Trigger text="Having that hard conversation" at={210} />
        <Trigger text="Keeping a promise" at={270} />
        <Trigger text="Getting up in the morning" at={330} />
      </Row>
    </Phase>
    <Phase from={540} to={800}>
      <Reveal dir="zoom"><div style={{...H(96), textAlign: "center"}}>“<Fx t="pop" color={C.amber} at={20}>not today</Fx>, tomorrow”</div></Reveal>
      <Reveal at={100}><div style={H(60)}>That’s not <Fx t="shrink" color={C.mute} at={120}>laziness</Fx>. That’s <Fx t="glow" color={C.rose} at={150}>self-sabotage</Fx>.</div></Reveal>
    </Phase>
    <Phase from={800} to={1200}>
      <Row gap={60}>
        <Reveal dir="zoom"><GuardDoor /></Reveal>
        <div style={{maxWidth: 800}}>
          <Reveal at={40} dir="left"><div style={H(92)}>“<Fx t="pop" color={C.rose} at={60}>Are you sure?</Fx>”</div></Reveal>
          <Reveal at={150} dir="left"><div style={{...T(42, C.ink), marginTop: 24}}>That guard is your <Fx t="underline" at={180}>old identity</Fx>.</div></Reveal>
          <Reveal at={240} dir="left"><div style={{...T(42), marginTop: 10}}>It doesn’t want to die.</div></Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={1200} to={1500}>
      <Reveal><div style={H(56)}>If you don’t know that…</div></Reveal>
      <Row gap={36}>
        <Reveal at={40} dir="up">
          <Panel accent={C.rose} style={{width: 440, textAlign: "center"}}><Burst /><div style={H(40)}>You get angry at yourself</div></Panel>
        </Reveal>
        <Reveal at={90}><div style={H(70, C.mute)}>→</div></Reveal>
        <Reveal at={120} dir="up">
          <Panel accent={C.violet} style={{width: 440, textAlign: "center"}}><ShrinkCircle /><div style={H(40)}>You feel smaller</div></Panel>
        </Reveal>
        <Reveal at={170}><div style={H(70, C.mute)}>→</div></Reveal>
        <Reveal at={200} dir="up">
          <Panel accent={C.teal} style={{width: 440, textAlign: "center"}}><SinkElephant /><div style={H(40)}>The elephant digs in <Fx t="pulse" color={C.rose} at={230}>even deeper</Fx></div></Panel>
        </Reveal>
      </Row>
    </Phase>
  </>
);

/* ---------- 6 · THE FRIEND ---------- */
const HABITS = [
  {k: "up", t: "Up at five"},
  {k: "gym", t: "Gym"},
  {k: "journal", t: "Journaling"},
  {k: "english", t: "English lessons"},
];

const HabitRow: React.FC<{k: string; t: string; at: number; fail?: boolean}> = ({k, t, at, fail}) => (
  <Reveal at={at} dir="right" style={{width: 640}}>
    <Panel accent={fail ? C.rose : C.teal} style={{padding: "18px 28px", display: "flex", alignItems: "center", gap: 22}}>
      <Icon kind={k} color={fail ? C.mute : C.teal} />
      <div style={{...H(44), flex: 1}}>{fail ? <Struck at={at + 24}>{t}</Struck> : t}</div>
      {!fail && (
        <svg width={44} height={44} viewBox="0 0 36 36"><Draw d="M6 19 L15 28 L31 8" at={at + 20} dur={16} color={C.teal} w={5} /></svg>
      )}
    </Panel>
  </Reveal>
);

const DayDot: React.FC<{at: number}> = ({at}) => (
  <div style={{width: 74, height: 74, borderRadius: 37, border: `2px solid ${C.teal}88`, background: `${C.teal}18`, display: "flex", alignItems: "center", justifyContent: "center"}}>
    <svg width={38} height={38} viewBox="0 0 36 36"><Draw d="M6 19 L15 28 L31 8" at={at} dur={14} color={C.teal} w={5} /></svg>
  </div>
);

const V6: React.FC = () => {
  const f = useCurrentFrame();
  const level = interpolate(f, [60, 220], [0, 0.85], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const days = [];
  for (let i = 0; i < 14; i++) days.push(<DayDot key={i} at={600 + i * 8} />);
  return (
    <>
      <Phase from={0} to={360}>
        <Reveal><div style={H(60)}>A <Fx t="pop" at={20}>brand new life</Fx> every <Fx t="glow" color={C.teal} at={50}>Monday</Fx></div></Reveal>
        <div style={{display: "flex", flexWrap: "wrap", gap: 22, width: 1340, justifyContent: "center"}}>
          {HABITS.map((h, i) => <HabitRow key={h.k} k={h.k} t={h.t} at={60 + i * 50} />)}
        </div>
      </Phase>
      <Phase from={360} to={600}>
        <Reveal><div style={H(60)}>By <Fx t="drop" color={C.rose} at={20}>Wednesday</Fx>, it all collapsed.</div></Reveal>
        <div style={{display: "flex", flexWrap: "wrap", gap: 22, width: 1340, justifyContent: "center"}}>
          {HABITS.map((h, i) => <HabitRow key={h.k} k={h.k} t={h.t} at={0 + i * 6} fail />)}
        </div>
        <Reveal at={110}><div style={H(62, C.rose)}>“I have no <Fx t="shake" color={C.rose} at={130}>willpower</Fx>.”</div></Reveal>
      </Phase>
      <Phase from={600} to={820}>
        <Reveal><div style={{...H(70), textAlign: "center"}}>“You have willpower,</div></Reveal>
        <Reveal at={50}><div style={{...H(70), textAlign: "center"}}>you just <Fx t="underline" color={C.teal} at={90}>ignore the elephant</Fx>.”</div></Reveal>
      </Phase>
      <Phase from={820} to={1140}>
        <Row gap={90}>
          <Reveal dir="zoom"><Glass level={level} /></Reveal>
          <div style={{width: 820}}>
            <Reveal at={20} dir="left"><div style={H(56)}>We dropped five things and picked <Fx t="pop" at={50}>one</Fx>.</div></Reveal>
            <Reveal at={90} dir="left"><div style={{...H(48, C.teal), marginTop: 14}}>Drink a glass of water when you wake up.</div></Reveal>
          </div>
        </Row>
      </Phase>
    </>
  );
};

/* ---------- 7 · THE BODY ---------- */
const Chem: React.FC<{name: string; word: string; color: string; at: number; children: React.ReactNode}> = ({name, word, color, at, children}) => (
  <Reveal at={at} dir="up">
    <Panel accent={color} style={{width: 500, height: 560, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", textAlign: "center"}}>
      <div style={{height: 300, display: "flex", alignItems: "center", justifyContent: "center"}}>{children}</div>
      <div style={T(32, color)}>{name}</div>
      <div style={H(70, color)}><Fx t="pop" color={color} at={at + 40}>{word}</Fx></div>
    </Panel>
  </Reveal>
);

const V7: React.FC = () => {
  const f = useCurrentFrame();
  const l3 = Math.max(0, f - 400);
  const gv = interpolate(l3, [0, 70], [0.05, 0.85], {...clamp, easing: Easing.out(Easing.cubic)});
  const l2 = Math.max(0, f - 220);
  const tilt = 20 * Math.exp(-l2 / 30) * Math.cos(l2 / 7);
  return (
    <Phase from={0} to={900}>
      <Row gap={34} style={{alignItems: "stretch"}}>
        <Chem name="Dopamine" word="Direction" color={C.amber} at={20}><Compass at={40} /></Chem>
        <Chem name="Serotonin" word="Balance" color={C.teal} at={200}>
          <div style={{transform: "scale(0.72)"}}><ScaleSvg tilt={tilt} l="" r="" /></div>
        </Chem>
        <Chem name="Noradrenaline" word="Readiness" color={C.violet} at={380}><Gauge v={gv} color={C.violet} /></Chem>
      </Row>
    </Phase>
  );
};

/* ---------- 8 · DOPAMINE ---------- */
const Target: React.FC = () => {
  const f = useCurrentFrame();
  const l = Math.max(0, f - 40);
  const tx = interpolate(l, [0, 22], [-520, 0], {...clamp, easing: Easing.in(Easing.cubic)});
  const wob = l > 22 ? Math.sin((l - 22) * 1.2) * 4 * Math.exp(-(l - 22) / 14) : 0;
  const cx = 320, cy = 200;
  return (
    <svg width={700} height={400} viewBox="0 0 700 400" style={{overflow: "visible"}}>
      {[170, 125, 80, 36].map((r, i) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill={i % 2 === 0 ? "rgba(242,180,94,.14)" : "rgba(242,180,94,.3)"} stroke={C.amber} strokeWidth={3} />
      ))}
      <g transform={`translate(${cx + tx} ${cy + wob})`}>
        <line x1={-230} y1={0} x2={0} y2={0} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
        <path d="M0 0 L-26 -14 L-26 14 Z" fill={C.amber} />
        <path d="M-230 0 L-262 -20 M-230 0 L-262 20 M-250 0 L-282 -20 M-250 0 L-282 20" stroke={C.rose} strokeWidth={6} strokeLinecap="round" />
      </g>
    </svg>
  );
};

const Battery: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={260} height={380} viewBox="0 0 260 380">
      <rect x={90} y={10} width={80} height={26} rx={8} fill="#3b4259" />
      <rect x={30} y={36} width={200} height={330} rx={34} fill="none" stroke={C.mute} strokeWidth={8} />
      <rect x={46} y={300 - 4 * Math.sin(f / 10)} width={168} height={50} rx={14} fill={C.rose} opacity={0.5 + 0.3 * Math.sin(f / 10)} />
    </svg>
  );
};

const NoteRow: React.FC<{at: number; w: number}> = ({at, w}) => (
  <div style={{display: "flex", alignItems: "center", gap: 22, padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,.12)"}}>
    <svg width={44} height={44} viewBox="0 0 36 36"><Draw d="M6 19 L15 28 L31 8" at={at} dur={14} color={C.teal} w={5} /></svg>
    <div style={{height: 16, width: `${w}%`, borderRadius: 8, background: "rgba(255,255,255,.16)"}} />
  </div>
);

const ShrinkBar: React.FC<{label: string; from: number; to: number; at: number; color: string; sub?: string}> = ({label, from, to, at, color, sub}) => {
  const f = useCurrentFrame();
  const v = interpolate(f, [at, at + 90], [from, to], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <div style={{width: "100%"}}>
      <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12}}>
        <div style={T(36, C.ink)}>{label}{sub ? <span style={{...T(26), marginLeft: 16}}>{sub}</span> : null}</div>
        <div style={H(50, color)}>{Math.round(v)} min</div>
      </div>
      <div style={{height: 30, borderRadius: 15, background: "rgba(255,255,255,.08)", overflow: "hidden"}}>
        <div style={{width: `${(v / 30) * 100}%`, height: "100%", borderRadius: 15, background: `linear-gradient(90deg, ${color}66, ${color})`, boxShadow: `0 0 26px ${color}88`}} />
      </div>
    </div>
  );
};

const Breath: React.FC = () => {
  const f = useCurrentFrame();
  const r = 90 + 40 * Math.sin(f / 30);
  return (
    <svg width={320} height={320} viewBox="0 0 320 320">
      {[1.5, 1.25, 1].map((m, i) => (
        <circle key={i} cx={160} cy={160} r={r * m * 0.8} fill={C.teal} opacity={0.08 + i * 0.1} />
      ))}
    </svg>
  );
};

const V8: React.FC = () => (
  <>
    <Phase from={0} to={290}>
      <Row gap={60}>
        <Reveal dir="zoom"><Target /></Reveal>
        <div>
          <Reveal at={20} dir="left"><div style={H(66)}>Something is <Fx t="glow" at={60}>worth chasing</Fx>.</div></Reveal>
          <Reveal at={110} dir="left"><div style={{...H(56, C.ink), marginTop: 22}}>Not just pleasure. <Fx t="pop" color={C.teal} at={150}>Direction.</Fx></div></Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={290} to={560}>
      <Row gap={80}>
        <Reveal dir="zoom"><Battery /></Reveal>
        <div style={{width: 900, display: "flex", flexDirection: "column", gap: 34}}>
          <Reveal at={10}><div style={H(60)}>Everything feels <Fx t="drop" color={C.rose} at={20}>heavy</Fx> and <Fx t="drop" color={C.rose} at={50}>pointless</Fx>.</div></Reveal>
          <Reveal at={80}><Track label="Planning" sub="you journal, you think, you talk about it" at={100} to={100} dur={80} color={C.amber} /></Reveal>
          <Reveal at={120}><Track label="Doing it" at={150} to={1.5} dur={10} color={C.rose} /></Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={560} to={860}>
      <div style={{width: 1400, display: "flex", flexDirection: "column", gap: 40}}>
        <Reveal><div style={H(58)}><Fx t="shrink" color={C.amber} at={20}>Shrink the task</Fx> until skipping it feels harder than doing it.</div></Reveal>
        <Reveal at={50}><ShrinkBar label="Journaling" sub="half an hour →" from={30} to={5} at={90} color={C.amber} /></Reveal>
        <Reveal at={100}>
          <div style={{display: "flex", alignItems: "center", gap: 24}}>
            <svg width={80} height={80} viewBox="0 0 80 80" fill="none" stroke={C.teal} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round"><path d="M10 40 L40 14 L70 40 V68 H10 Z" /><rect x={32} y={44} width={16} height={24} /></svg>
            <div style={{flex: 1}}><ShrinkBar label="Gym" sub="at home →" from={10} to={10} at={0} color={C.teal} /></div>
          </div>
        </Reveal>
      </div>
    </Phase>
    <Phase from={860} to={1160}>
      <Row gap={70}>
        <Reveal dir="right">
          <Panel accent={C.amber} style={{width: 620}}>
            <NoteRow at={50} w={78} />
            <NoteRow at={90} w={58} />
            <NoteRow at={130} w={70} />
            <NoteRow at={170} w={48} />
          </Panel>
        </Reveal>
        <div style={{maxWidth: 800}}>
          <Reveal at={20} dir="left"><div style={H(64)}>Your brain believes <Fx t="glow" color={C.teal} at={50}>evidence</Fx>,</div></Reveal>
          <Reveal at={60} dir="left"><div style={{...H(64, C.mute), marginTop: 8}}>not <Struck at={100}>sentences</Struck>.</div></Reveal>
          <Reveal at={190} dir="zoom"><div style={{...H(60, C.amber), marginTop: 36}}>“<Fx t="pop" at={210}>I’m proud of that.</Fx>”</div></Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={1160} to={1480}>
      <Row gap={90}>
        <Reveal dir="zoom"><Feed /></Reveal>
        <div style={{width: 800}}>
          <Reveal at={10} dir="left"><div style={H(66)}>Look at how much <Fx t="pulse" color={C.violet} at={30}>novelty</Fx> you’re swallowing.</div></Reveal>
          <Reveal at={80} dir="left"><div style={{...T(44, C.ink), marginTop: 20}}>Video after video, app after app.</div></Reveal>
          <Reveal at={150} dir="left" style={{marginTop: 34}}><Track label="Slow, real progress" at={170} to={14} dur={140} color={C.teal} /></Reveal>
        </div>
      </Row>
    </Phase>
    <Phase from={1480} to={1740}>
      <Row gap={80}>
        <Reveal dir="zoom">
          <Panel accent={C.violet} style={{width: 640, textAlign: "center"}}>
            <div style={{width: 260, height: 380, margin: "0 auto", borderRadius: 44, border: "8px solid #2a2f3d", background: "#05060a", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Moon size={150} />
            </div>
            <div style={{...H(44), marginTop: 22}}>Cut the screen time, <Fx t="underline" color={C.violet} at={40}>especially at night</Fx>.</div>
          </Panel>
        </Reveal>
        <Reveal at={60} dir="zoom">
          <Panel accent={C.teal} style={{width: 640, textAlign: "center"}}>
            <Breath />
            <div style={H(44)}>When you get bored, <Fx t="pop" color={C.teal} at={100}>don’t run</Fx>.</div>
            <div style={{...T(34), marginTop: 10}}>Sit in it for a bit.</div>
          </Panel>
        </Reveal>
      </Row>
    </Phase>
  </>
);

/* ---------- 9 · SEROTONIN ---------- */
const Funnel: React.FC = () => {
  const f = useCurrentFrame();
  const dots = [];
  for (let i = 0; i < 18; i++) {
    const t = (f * 0.012 + i / 18) % 1;
    const x0 = 60 + ((i * 137) % 480) + Math.sin(f / 15 + i) * 14;
    const lane = i % 2 === 0 ? 170 : 430;
    const k = Math.min(1, Math.max(0, (t - 0.45) / 0.2));
    dots.push(<circle key={i} cx={x0 + (lane - x0) * k} cy={20 + t * 440} r={10} fill={i % 2 === 0 ? C.teal : C.amber} opacity={0.9} />);
  }
  return (
    <svg width={600} height={470} viewBox="0 0 600 470">
      <rect x={20} y={6} width={560} height={240} rx={22} fill="none" stroke="rgba(255,255,255,.2)" strokeDasharray="8 12" strokeWidth={3} />
      <rect x={130} y={246} width={80} height={220} fill="rgba(111,227,210,.08)" stroke={C.teal} strokeWidth={3} />
      <rect x={390} y={246} width={80} height={220} fill="rgba(242,180,94,.08)" stroke={C.amber} strokeWidth={3} />
      {dots}
    </svg>
  );
};

const V9: React.FC = () => {
  const f = useCurrentFrame();
  const l = Math.max(0, f - 120);
  const tilt = f < 120 ? 20 : 20 * Math.exp(-l / 30) * Math.cos(l / 7);
  return (
    <>
      <Phase from={0} to={330}>
        <Row gap={80}>
          <Reveal dir="zoom"><ScaleSvg tilt={tilt} l="sleep" r="routine" /></Reveal>
          <div style={{maxWidth: 820}}>
            <Reveal at={10} dir="left"><div style={H(56)}>You fall apart under stress?</div></Reveal>
            <Reveal at={80} dir="left"><div style={{...H(60, C.ink), marginTop: 18}}>Often it’s <Fx t="pop" color={C.amber} at={120}>sleep</Fx> and <Fx t="pop" color={C.teal} at={150}>routine</Fx>.</div></Reveal>
          </div>
        </Row>
      </Phase>
      <Phase from={330} to={960}>
        <Reveal><div style={H(58)}>When stress hits, cut your options down to <Fx t="pop" at={30}>two</Fx>.</div></Reveal>
        <Row gap={70}>
          <Reveal dir="zoom"><Funnel /></Reveal>
          <div style={{width: 760, display: "flex", flexDirection: "column", gap: 22}}>
            <Reveal at={100} dir="left"><Panel accent={C.teal}><div style={H(42)}>Do the thing you need to do</div></Panel></Reveal>
            <Reveal at={170} dir="left"><Panel accent={C.amber}><div style={H(42)}>Just take a walk</div></Panel></Reveal>
            <Reveal at={240} dir="left"><Panel accent={C.rose} style={{opacity: 0.85}}><div style={H(42, C.mute)}><Struck at={290}>Escaping into a screen</Struck></div></Panel></Reveal>
          </div>
        </Row>
        <Reveal at={360}><div style={H(56, C.teal)}>The <Fx t="underline" color={C.teal} at={390}>fewer the options</Fx>, the easier discipline gets.</div></Reveal>
      </Phase>
    </>
  );
};

/* ---------- 10 · NORADRENALINE ---------- */
const Stairs: React.FC = () => {
  const f = useCurrentFrame();
  const steps = [
    {l: ["A cold shower"], at: 40},
    {l: ["A brisk walk"], at: 140},
    {l: ["The phone call", "you’ve been avoiding"], at: 240},
  ];
  const climb = (i: number) => interpolate(f, [steps[i].at + 40, steps[i].at + 70], [0, 1], clamp);
  const lift = steps.reduce((acc, _, i) => Math.max(acc, climb(i)), 0);
  const px = interpolate(f, [60, 130, 160, 230, 260, 320], [200, 200, 520, 520, 860, 860], clamp);
  const py = interpolate(f, [60, 130, 160, 230, 260, 320], [310, 310, 220, 220, 130, 130], clamp);
  const y = py - 22 - 8 * Math.sin(f / 6) - 12 * lift;
  return (
    <svg width={1150} height={420} viewBox="0 0 1150 420">
      {steps.map((s, i) => {
        const h = 120 + i * 90;
        const p = prog(f, s.at, 26);
        return (
          <g key={i} opacity={p}>
            <rect x={40 + i * 340} y={400 - h * p} width={320} height={h * p} rx={14} fill={C.violet} fillOpacity={0.2} stroke={C.violet} strokeWidth={3} />
            {s.l.map((t, j) => (
              <text key={j} x={200 + i * 340} y={400 - h + 46 + j * 32} textAnchor="middle" fontFamily={SANS} fontSize={28} fontWeight={600} fill={C.ink}>{t}</text>
            ))}
          </g>
        );
      })}
      <circle cx={px} cy={y} r={18} fill={C.amber} />
      <circle cx={px} cy={y} r={34 + 12 * lift} fill={C.amber} opacity={0.2} />
    </svg>
  );
};

const Battery2: React.FC<{charge: number}> = ({charge}) => (
  <svg width={280} height={200} viewBox="0 0 280 200">
    <rect x={20} y={40} width={220} height={120} rx={24} fill="none" stroke={C.mute} strokeWidth={8} />
    <rect x={244} y={80} width={18} height={40} rx={6} fill={C.mute} />
    <rect x={34} y={54} width={192 * charge} height={92} rx={14} fill={charge < 0.4 ? C.rose : C.teal} />
  </svg>
);

const V10: React.FC = () => {
  const f = useCurrentFrame();
  const ch = interpolate(f, [60, 200], [0.12, 0.9], clamp);
  return (
    <>
      <Phase from={0} to={560}>
        <Reveal><div style={H(60)}>Get used to <Fx t="glow" color={C.violet} at={30}>small, controlled discomfort</Fx>.</div></Reveal>
        <Reveal at={10} dir="none"><Stairs /></Reveal>
        <Reveal at={340}><div style={T(40, C.ink)}>Small things you <Fx t="underline" color={C.violet} at={370}>choose yourself</Fx>.</div></Reveal>
      </Phase>
      <Phase from={560} to={1020}>
        <Row gap={50} style={{alignItems: "stretch"}}>
          <Reveal at={10} dir="right">
            <Panel accent={C.amber} style={{width: 700, height: 460, textAlign: "center"}}>
              <div style={T(28)}>Already exhausted and wired all the time?</div>
              <Battery2 charge={ch} />
              <div style={H(56)}>Don’t push harder, <Fx t="pop" color={C.teal} at={90}>rest first</Fx>.</div>
            </Panel>
          </Reveal>
          <Reveal at={180} dir="left">
            <Panel accent={C.rose} style={{width: 700, height: 460, textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center", gap: 20}}>
              <div style={T(28)}>Heavy tiredness or a low mood for a long time?</div>
              <svg width={110} height={110} viewBox="0 0 110 110" style={{margin: "0 auto"}}>
                <circle cx={55} cy={55} r={46} fill="none" stroke={C.rose} strokeWidth={5} />
                <path d="M55 30 V80 M30 55 H80" stroke={C.rose} strokeWidth={9} strokeLinecap="round" />
              </svg>
              <div style={H(52)}>Please <Fx t="glow" color={C.rose} at={230}>talk to a professional</Fx>.</div>
              <div style={T(30)}>This video is not a treatment.</div>
            </Panel>
          </Reveal>
        </Row>
      </Phase>
    </>
  );
};

/* ---------- 11 · IS IT WORKING ---------- */
const PinMap: React.FC = () => {
  const f = useCurrentFrame();
  const k = (f % 50) / 50;
  return (
    <svg width={1200} height={360} viewBox="0 0 1200 360">
      <path d="M60 280 C260 280 300 80 520 130 S800 300 1140 80" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth={6} strokeDasharray="4 18" strokeLinecap="round" />
      <Draw d="M60 280 C260 280 300 80 520 130" at={10} dur={60} color={C.amber} w={8} />
      <g transform={`translate(520 ${130 - 10 * (1 - pop(f, 70))})`} opacity={pop(f, 70)}>
        <circle cx={0} cy={0} r={14 + 30 * k} fill="none" stroke={C.amber} strokeOpacity={1 - k} strokeWidth={3} />
        <path d="M0 -20 C-30 -20 -30 -66 0 -66 C30 -66 30 -20 0 -20 Z" fill={C.amber} transform="translate(0 -10)" />
        <circle cx={0} cy={-62} r={9} fill="#161a28" />
      </g>
    </svg>
  );
};

const V11: React.FC = () => {
  const f = useCurrentFrame();
  const v = interpolate(f, [90, 220], [0.9, 0.08], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const gc = v > 0.5 ? C.amber : C.teal;
  return (
    <>
      <Phase from={0} to={300}>
        <div style={{width: 1400, display: "flex", flexDirection: "column", gap: 44}}>
          <Reveal><div style={H(64)}><Fx t="pop" color={C.teal} at={20}>Actions</Fx> change your body faster than <Fx t="shrink" color={C.mute} at={40}>thoughts</Fx> do.</div></Reveal>
          <Reveal at={40}><Track label="Thoughts" at={60} to={30} dur={220} color={C.mute} /></Reveal>
          <Reveal at={70}><Track label="Actions" at={90} to={100} dur={90} color={C.teal} /></Reveal>
        </div>
      </Phase>
      <Phase from={300} to={600}>
        <Row gap={80}>
          <Reveal dir="zoom"><Gauge v={v} color={gc} left="silly" right="reasonable" size={1.7} /></Reveal>
          <div style={{maxWidth: 760}}>
            <Reveal at={10} dir="left"><div style={T(34)}>How do you know it’s working?</div></Reveal>
            <Reveal at={40} dir="left"><div style={{...H(64), marginTop: 14}}>Your old <Fx t="shake" color={C.rose} at={70}>excuses</Fx> start to sound <Fx t="pop" color={C.teal} at={200}>silly</Fx>.</div></Reveal>
          </div>
        </Row>
      </Phase>
      <Phase from={600} to={840}>
        <PinMap />
        <Reveal at={80}><div style={H(66)}>It just tells you <Fx t="glow" at={110}>where you are</Fx>.</div></Reveal>
      </Phase>
    </>
  );
};

/* ---------- 12 · THE RIGHT DOOR ---------- */
const SmallSteps: React.FC = () => {
  const f = useCurrentFrame();
  const n = 8;
  return (
    <svg width={760} height={440} viewBox="0 0 760 440">
      {Array.from({length: n}).map((_, i) => {
        const p = prog(f, 60 + i * 24, 20);
        const h = (60 + i * 36) * p;
        return <rect key={i} x={10 + i * 90} y={420 - h} width={80} height={h} rx={10} fill={C.teal} fillOpacity={0.25} stroke={C.teal} strokeWidth={3} />;
      })}
      <g transform="translate(560 -10) scale(0.5)" opacity={prog(f, 250, 30)}>
        <circle cx={110} cy={75} r={52} fill={C.amber + "55"} stroke={C.amber} strokeWidth={6} />
        <path d="M30 290 C30 180 70 140 110 140 C150 140 190 180 190 290 Z" fill={C.amber + "55"} stroke={C.amber} strokeWidth={6} />
      </g>
    </svg>
  );
};

const V12: React.FC = () => {
  const f = useCurrentFrame();
  const open = interpolate(f, [30, 200], [0.1, 0.8], {...clamp, easing: Easing.inOut(Easing.cubic)});
  return (
    <>
      <Phase from={0} to={430}>
        <Row gap={70}>
          <div style={{maxWidth: 780}}>
            <Reveal><div style={H(56, C.mute)}><Struck at={70}>“I’m worthy”</Struck> × 1000</div></Reveal>
            <Reveal at={110}><div style={{...H(64), marginTop: 26}}>Earned by becoming someone you <Fx t="glow" color={C.amber} at={150}>respect and admire</Fx>.</div></Reveal>
            <Reveal at={240}><div style={{...T(40, C.ink), marginTop: 22}}>In <Fx t="underline" color={C.teal} at={260}>small steps</Fx>. Over and over.</div></Reveal>
          </div>
          <Reveal at={20} dir="zoom"><SmallSteps /></Reveal>
        </Row>
      </Phase>
      <Phase from={430} to={860}>
        <Row gap={80}>
          <Reveal dir="zoom"><DoorOpen open={open} /></Reveal>
          <div style={{maxWidth: 800}}>
            <Reveal at={40} dir="left"><div style={H(56, C.mute)}>That discomfort isn’t a sign you’re on the <Fx t="shrink" color={C.rose} at={80}>wrong road</Fx>.</div></Reveal>
            <Reveal at={190} dir="left"><div style={{...H(76), marginTop: 22}}>It’s a sign you’re standing at the <Fx t="glow" at={230}>right door</Fx>.</div></Reveal>
          </div>
        </Row>
      </Phase>
      <Phase from={860} to={1260}>
        <Reveal><div style={H(64)}>So do <Fx t="pop" color={C.teal} at={20}>one thing</Fx> today.</div></Reveal>
        <Row gap={24} style={{alignItems: "stretch"}}>
          {[
            "Make a promise so small you can’t fail at it.",
            "Keep it.",
            "Write it down.",
            "Tell yourself, “I did it.”",
          ].map((t, i) => (
            <Reveal key={t} at={50 + i * 55} dir="up">
              <Panel accent={i === 3 ? C.teal : C.amber} style={{width: 370, height: 250, display: "flex", flexDirection: "column", justifyContent: "space-between"}}>
                <div style={H(60, i === 3 ? C.teal : C.amber)}>{i < 3 ? String(i + 1) : ""}
                  {i === 3 && (
                    <svg width={64} height={64} viewBox="0 0 36 36"><Draw d="M6 19 L15 28 L31 8" at={50 + i * 55 + 20} dur={20} color={C.teal} w={4} /></svg>
                  )}
                </div>
                <div style={H(36)}>{t}</div>
              </Panel>
            </Reveal>
          ))}
        </Row>
        <Reveal at={330}><div style={{...H(48, C.amber), textAlign: "center"}}>See you in the next video.</div></Reveal>
      </Phase>
    </>
  );
};

/* ================================================================== */
/*  SCENES + SCRIPT                                                    */
/*  {{word}} = amber keyword,  {{!word}} = rose keyword               */
/* ================================================================== */
type SceneDef = {id: string; seconds: number; lines: string[]; Visual: React.FC};

const SCENES: SceneDef[] = [
  {
    id: "hook", seconds: 36, Visual: V1,
    lines: [
      "You stand in front of the mirror and say, “I’m {{worth it}}, I can do this.”",
      "It lasts {{three days}}. By {{!day four}}, you’re right back where you started.",
      "The alarm goes off, you {{!snooze}} it. You make a plan, you {{!don’t follow}} it.",
      "And at night, lying in bed, you ask yourself the same question again: “{{!What’s wrong with me?}}”",
    ],
  },
  {
    id: "feeling", seconds: 34, Visual: V2,
    lines: [
      "Listen. {{Nothing is wrong}} with you. You’re just looking for the problem in the {{wrong place}}.",
      "{{Self-worth}} isn’t a nice sentence you tell yourself. It’s a {{feeling}}.",
      "Something your {{body}} and your {{nervous system}} carry: “My effort isn’t wasted, what I’m doing is worth doing.”",
      "And no affirmation video on earth can hand you that feeling.",
      "I spent years reading motivational quotes in the morning and ending up in the {{same spot}} by night.",
    ],
  },
  {
    id: "elephant", seconds: 50, Visual: V3,
    lines: [
      "Let me give you a picture. There are {{two characters}} inside your head.",
      "On top sits a small, logical one. The {{planner}}, the one saying “tomorrow I’ll wake up early.”",
      "Underneath is a giant {{elephant}}. That’s your {{nervous system}}. It gets scared, it loves its habits, and under pressure it does whatever it wants.",
      "Most of us pour all our energy into the little one on top. We feed it books, videos, better plans.",
      "And the elephant? Doesn’t move an inch. Because the problem was never up there. It’s the {{elephant}}.",
    ],
  },
  {
    id: "couch", seconds: 48, Visual: V4,
    lines: [
      "So why won’t the elephant move? Because your brain is a {{prediction machine}}.",
      "It loves what it {{knows}}, even when what it knows is bad for you.",
      "Think about an {{old couch}} you’ve had for years. It’s sagging, a spring is poking you. But you know exactly where it sinks.",
      "A brand new one? Nicer, sure, but {{unknown}}. Your back will hurt that first week.",
      "Your brain looks at your {{identity}} the same way. The you that procrastinates, can’t say no, doubts everything. Uncomfortable, but familiar.",
      "The new you? Unknown. And your brain reads “unknown” as “{{!danger}}.”",
    ],
  },
  {
    id: "guard", seconds: 50, Visual: V5,
    lines: [
      "So the second you say “I’m going to change,” your body translates it as “my {{identity}} is under {{!threat}}.”",
      "Setting a boundary, having that hard conversation, keeping a promise, getting up in the morning. They look small, but inside, an {{!alarm}} goes off.",
      "Suddenly “not today, tomorrow” sounds like the smartest sentence you’ve ever heard.",
      "That’s not laziness. That’s {{!self-sabotage}}. It happens right at the threshold.",
      "Like a {{guard}} at a door saying, “Are you sure?” That guard is your {{old identity}}. It doesn’t want to die.",
      "If you don’t know that, you get angry at yourself, you feel smaller, and the elephant digs in {{!even deeper}}.",
    ],
  },
  {
    id: "friend", seconds: 38, Visual: V6,
    lines: [
      "I had a friend who started a {{brand new life}} every Monday. Up at five, gym, journaling, English lessons.",
      "By {{!Wednesday}}, it all collapsed. She’d say, “I have no willpower.”",
      "I told her, “You have willpower, you just ignore the {{elephant}}.”",
      "So we dropped five things and picked {{one}}. Drink a glass of water when you wake up.",
      "She laughed at it. But {{two weeks later}}, for the first time, she could say, “{{I kept my word.}}”",
    ],
  },
  {
    id: "body", seconds: 30, Visual: V7,
    lines: [
      "Now let’s talk about the body a little. I’m simplifying this a lot, and I’m not a doctor.",
      "Three brain chemicals scientists talk about a lot: {{dopamine}}, {{serotonin}}, and {{noradrenaline}}.",
      "Think of them roughly as {{direction}}, {{balance}}, and {{readiness}}.",
    ],
  },
  {
    id: "dopamine", seconds: 58, Visual: V8,
    lines: [
      "{{Dopamine}} is what tells you something is worth chasing. It’s not just pleasure, it’s {{direction}}.",
      "When it’s low, everything feels {{!heavy and pointless}}. Planning replaces action.",
      "So what do you do? {{Shrink the task}} until skipping it feels harder than doing it.",
      "Can’t journal for half an hour? Write for {{five minutes}}. Can’t get to the gym? Move for {{ten minutes}} at home.",
      "And write down everything you do. Your brain believes {{evidence}}, not sentences.",
      "Every promise you keep, put it in your notebook and say, “{{I’m proud of that.}}”",
      "Look at how much {{novelty}} you’re swallowing every day. Video after video, app after app.",
      "Cut the screen time, especially at night. And when you get bored, {{don’t run}}. Sit in it for a bit.",
    ],
  },
  {
    id: "serotonin", seconds: 32, Visual: V9,
    lines: [
      "{{Serotonin}} has to do with {{balance}} and impulse control. If you fall apart under stress, a lot of the time it’s {{sleep}} and {{routine}}.",
      "So when stress hits, cut your options down. Give yourself {{two}}: do the thing you need to do, or just take a walk.",
      "Escaping into a screen is not option number three. The {{fewer the options}}, the easier discipline gets.",
    ],
  },
  {
    id: "noradrenaline", seconds: 34, Visual: V10,
    lines: [
      "{{Noradrenaline}} is about being ready. If you run from every hard thing, get used to {{small, controlled discomfort}}.",
      "A cold shower, a brisk walk, finally making that phone call you’ve been avoiding. Small things you {{choose yourself}}.",
      "But if you’re already exhausted and wired all the time, don’t push harder, {{rest first}}.",
      "And if you’ve had heavy tiredness or a low mood for a long time, please {{talk to a professional}}. This video is not a treatment.",
    ],
  },
  {
    id: "working", seconds: 28, Visual: V11,
    lines: [
      "Remember, {{actions}} change your body faster than {{thoughts}} do.",
      "How do you know it’s working? When your old {{excuses}} start to sound {{silly}}.",
      "If your old habits still feel like home, your old identity isn’t dead yet. That’s fine. It just tells you {{where you are}}.",
    ],
  },
  {
    id: "door", seconds: 42, Visual: V12,
    lines: [
      "Self-worth isn’t earned by telling yourself “I’m worthy” a thousand times. It’s earned by becoming someone you {{respect and admire}}.",
      "Over and over, in {{small steps}}, showing your body, “look, this new me is {{safe}} too.”",
      "That discomfort isn’t a sign you’re on the wrong road. It’s a sign you’re standing at the {{right door}}.",
      "So do one thing today. Make a promise so small you can’t fail at it. Keep it. Write it down. Tell yourself, “{{I did it.}}”",
      "See you in the next video with a version of you who {{trusts their own word}}.",
    ],
  },
];

export const TOTAL_FRAMES = SCENES.reduce((a, s) => a + s.seconds * FPS, 0); // 14400 = 8:00

/* ================================================================== */
/*  SAHNE RENKLERİ · İSİMLER · ÖZET CÜMLELER                           */
/* ================================================================== */
const TINT: Record<string, string> = {
  hook: C.violet, feeling: C.teal, elephant: C.teal, couch: C.amber,
  guard: C.rose, friend: C.amber, body: C.violet, dopamine: C.amber,
  serotonin: C.teal, noradrenaline: C.violet, working: C.teal, door: C.amber,
};

const NAMES: Record<string, string> = {
  hook: "The Loop", feeling: "The Wrong Place", elephant: "The Elephant",
  couch: "The Old Couch", guard: "The Guard", friend: "The Friend",
  body: "The Body", dopamine: "Dopamine", serotonin: "Serotonin",
  noradrenaline: "Noradrenaline", working: "Is It Working?", door: "The Right Door",
};

// at = sahne içindeki saniye. Özet cümle 8 sn ekranda kalır.
const ANCHORS: Record<string, {text: string; at: number}> = {
  hook: {text: "Same loop. Same question.", at: 32},
  feeling: {text: "Worth is a feeling, not a sentence.", at: 24},
  elephant: {text: "The problem is the elephant.", at: 45},
  couch: {text: "Your brain prefers familiar over better.", at: 42},
  guard: {text: "Resistance is protection, not laziness.", at: 42},
  friend: {text: "Pick one. Keep your word.", at: 36},
  body: {text: "Direction · Balance · Readiness", at: 19},
  dopamine: {text: "Shrink it. Prove it. Protect it.", at: 57},
  serotonin: {text: "Fewer options, easier discipline.", at: 25},
  noradrenaline: {text: "Small discomfort, chosen by you.", at: 30},
  working: {text: "Old excuses start to sound silly.", at: 21},
  door: {text: "Discomfort means you're at the right door.", at: 22},
};

const MASCOT = ["couch", "guard", "friend", "dopamine", "serotonin", "noradrenaline", "working", "door"];

/* ================================================================== */
/*  KATMANLAR                                                          */
/* ================================================================== */
const Particles: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {Array.from({length: 26}).map((_, i) => {
        const sp = 0.25 + (i % 5) * 0.12;
        const x = ((i * 197) % 1920) + Math.sin(f / 60 + i) * 24;
        const y = 1080 - ((f * sp + i * 83) % 1160);
        const r = 2 + (i % 3);
        return (
          <div key={i} style={{position: "absolute", left: x, top: y, width: r * 2, height: r * 2, borderRadius: r, background: C.ink, opacity: 0.08 + 0.1 * ((i % 4) / 4)}} />
        );
      })}
    </AbsoluteFill>
  );
};

const Background: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const x1 = 25 + Math.sin(t / 9) * 12;
  const y1 = 30 + Math.cos(t / 11) * 10;
  const x2 = 78 + Math.cos(t / 10) * 10;
  const y2 = 72 + Math.sin(t / 8) * 10;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 700px at ${x1}% ${y1}%, rgba(155,140,255,0.16), transparent 60%), radial-gradient(1000px 800px at ${x2}% ${y2}%, rgba(242,180,94,0.12), transparent 60%)`}} />
      <Particles />
      <AbsoluteFill style={{background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.65) 100%)"}} />
      <svg width="100%" height="100%" style={{position: "absolute", inset: 0, opacity: 0.07, mixBlendMode: "overlay"}}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={Math.floor(f / 2) % 40} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

const SceneTint: React.FC<{color: string; dur: number}> = ({color, dur}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, 30, dur - 30, dur], [0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o, background: `radial-gradient(1100px 700px at 50% 55%, ${color}22, transparent 65%)`}} />;
};

const GhostNumber: React.FC<{n: number}> = ({n}) => {
  const f = useCurrentFrame();
  const p = prog(f, 0, 40);
  return (
    <div style={{position: "absolute", right: 90, bottom: 110, fontFamily: SERIF, fontWeight: 700, fontSize: 420, lineHeight: 1, color: C.ink, opacity: 0.035 * p, transform: `translateY(${(1 - p) * 40}px)`}}>
      {String(n).padStart(2, "0")}
    </div>
  );
};

const SceneTitle: React.FC<{n: number; name: string; color: string}> = ({n, name, color}) => {
  const f = useCurrentFrame();
  const p = prog(f, 6, 26);
  const o = interpolate(f, [0, 10, 90, 115], [0, 1, 1, 0], clamp);
  return (
    <div style={{position: "absolute", left: 60, top: 30, opacity: o, transform: `translateX(${(1 - p) * -30}px)`, display: "flex", alignItems: "center", gap: 16}}>
      <div style={{width: 5, height: 40, borderRadius: 3, background: color, boxShadow: `0 0 16px ${color}`}} />
      <div>
        
        <div style={{fontFamily: SANS, fontSize: 30, fontWeight: 600, letterSpacing: 1.5, color: C.ink, textTransform: "uppercase"}}>{name}</div>
      </div>
    </div>
  );
};

const Mascot: React.FC<{color: string}> = ({color}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [20, 50], [0, 0.7], clamp);
  return (
    <div style={{position: "absolute", right: 60, top: 22, opacity: o, transform: `translateY(${Math.sin(f / 20) * 3}px)`, filter: `drop-shadow(0 0 14px ${color}66)`}}>
      <Elephant scale={0.2} />
    </div>
  );
};

const Anchor: React.FC<{text: string; at: number; color: string}> = ({text, at, color}) => {
  const f = useCurrentFrame();
  const s = at * FPS;
  const p = prog(f, s, 26);
  const out = interpolate(f, [s + 210, s + 240], [1, 0], clamp);
  return (
    <div style={{position: "absolute", left: 0, right: 0, bottom: 38, display: "flex", justifyContent: "center", opacity: p * out, transform: `translateY(${(1 - p) * 20}px)`}}>
      <div style={{display: "flex", alignItems: "center", gap: 16, padding: "14px 36px", borderRadius: 999, background: "rgba(6,8,13,0.62)", border: `1px solid ${color}88`, boxShadow: `0 0 44px ${color}33`}}>
        <div style={{width: 12, height: 12, borderRadius: 6, background: color, boxShadow: `0 0 14px ${color}`}} />
        <div style={{fontFamily: SANS, fontSize: 34, fontWeight: 600, color: C.ink, letterSpacing: 0.3}}>{text}</div>
      </div>
    </div>
  );
};

const Sweep: React.FC<{color: string}> = ({color}) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [0, 26], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
  const o = interpolate(f, [0, 6, 26], [0, 0.55, 0], clamp);
  return (
    <div style={{position: "absolute", top: 0, bottom: 0, left: `${-20 + p * 130}%`, width: "20%", opacity: o, background: `linear-gradient(90deg, transparent, ${color}66, transparent)`, transform: "skewX(-14deg)"}} />
  );
};

const ChapterRail: React.FC = () => {
  const f = useCurrentFrame();
  let start = 0;
  let cur = 0;
  SCENES.forEach((s, i) => {
    if (f >= start) cur = i;
    start += s.seconds * FPS;
  });
  return (
    <div style={{position: "absolute", top: 34, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 10}}>
      {SCENES.map((s, i) => (
        <div key={s.id} style={{width: i === cur ? 46 : 16, height: 6, borderRadius: 3, background: i <= cur ? TINT[s.id] : "rgba(255,255,255,0.14)", opacity: i === cur ? 1 : 0.7}} />
      ))}
    </div>
  );
};

const ProgressBar: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: 5, background: "rgba(255,255,255,0.06)"}}>
      <div style={{width: `${(f / TOTAL_FRAMES) * 100}%`, height: "100%", background: `linear-gra"dient(90deg, ${C.violet}, ${C.amber})`}} />
    </div>
  );
};

/* ================================================================== */
/*  SAHNE KABUĞU (altyazısız, görsel alan büyütüldü)                   */
/* ================================================================== */
const SceneShell: React.FC<{def: SceneDef; index: number}> = ({def, index}) => {
  const f = useCurrentFrame();
  const dur = def.seconds * FPS;
  const fade = interpolate(f, [0, 18, dur - 18, dur], [0, 1, 1, 0], clamp);
  const push = interpolate(f, [0, dur], [1.04, 1.08], clamp);
  const V = def.Visual;
  const tint = TINT[def.id];
  const anchor = ANCHORS[def.id];
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{opacity: fade}}>
        <SceneTint color={tint} dur={dur} />
       
        <div style={{position: "absolute", left: 140, right: 140, top: 90, bottom: 130, transform: `scale(${push})`}}>
          <AbsoluteFill>
            <V />
          </AbsoluteFill>
        </div>
        <SceneTitle n={index + 1} name={NAMES[def.id]} color={tint} />
       
        {anchor && <Anchor text={anchor.text} at={anchor.at} color={tint} />}
      </AbsoluteFill>
      <Sweep color={tint} />
    </AbsoluteFill>
  );
};

/* ================================================================== */
/*  MAIN                                                               */
/* ================================================================== */
export const MainVideo: React.FC = () => {
  let start = 0;
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <Background />
      {SCENES.map((s, i) => {
        const from = start;
        start += s.seconds * FPS;
        return (
          <Sequence key={s.id} from={from} durationInFrames={s.seconds * FPS}>
            <SceneShell def={s} index={i} />
          </Sequence>
        );
      })}
  
      {VOICEOVER && <Audio src={staticFile(VOICEOVER)} />}
      {MUSIC && <Audio src={staticFile(MUSIC)} volume={0.12} loop />}
    </AbsoluteFill>
  );
};