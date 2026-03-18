import { useEffect, useMemo, useState } from 'react';
import { useRive } from '@rive-app/react-canvas';
import useIllustrations from '../hooks/useIllustrations';
import '../styles/animations.css';

const RIVE_SRC = '/fitness-buddy.riv';
const RIVE_STATE_MACHINE = 'Controller';
const riveCapableExercises = new Set([
  'jumping-jacks',
  'wall-sit',
  'push-ups',
  'crunches',
  'step-ups',
  'squats',
  'tricep-dips',
  'plank',
  'high-knees',
  'lunges',
  'push-up-rotation',
  'side-plank',
]);

const ILLUSTRATION_COLORS = {
  background: '#f5efff',
  tile: '#ffffff',
  mat: '#d9d1ff',
  skin: '#ffd9c7',
  outfitTop: '#f26d8f',
  outfitBottom: '#6d5ce5',
  hair: '#2b1b33',
};

const formatLabel = (id) => id.replace(/-/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

let riveAvailabilityPromise;
const checkRiveAvailability = () => {
  if (!riveAvailabilityPromise) {
    riveAvailabilityPromise = fetch(RIVE_SRC, { method: 'HEAD' })
      .then((res) => res.ok)
      .catch(() => false);
  }
  return riveAvailabilityPromise;
};

const HEAD = (cx, cy, r = 11) => <circle cx={cx} cy={cy} r={r} fill="var(--figure-fill)" />;
const TORSO = (x, y, w = 20, h = 38) => (
  <rect x={x} y={y} width={w} height={h} rx={w / 2} fill="var(--figure-fill)" />
);
const LIMB = (x1, y1, x2, y2, w = 10) => (
  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--figure-fill)" strokeWidth={w} strokeLinecap="round" />
);
const GROUND = (y = 158) => <ellipse cx="70" cy={y} rx="50" ry="4" fill="var(--ground-color)" />;

// SVG animation components (same as earlier build)
// ... (omitted comments for brevity)

function JumpingJacks() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND />
      {HEAD(70, 48)}
      {TORSO(60, 62, 20, 55)}
      <g className="jj-arm-l">{LIMB(62, 78, 42, 110)}</g>
      <g className="jj-arm-r">{LIMB(78, 78, 98, 110)}</g>
      <g className="jj-leg-l">{LIMB(64, 118, 58, 155)}</g>
      <g className="jj-leg-r">{LIMB(76, 118, 82, 155)}</g>
    </svg>
  );
}

function WallSit() {
  return (
    <svg viewBox="0 0 140 170">
      <rect x="100" y="20" width="6" height="140" rx="2" fill="rgba(255,255,255,0.1)" />
      <g className="wall-sit-body">
        {HEAD(80, 48)}
        {TORSO(70, 60, 20, 35)}
        {LIMB(72, 70, 60, 88)}
        {LIMB(88, 70, 96, 88)}
        {LIMB(75, 95, 55, 97, 11)}
        {LIMB(85, 95, 55, 97, 11)}
        {LIMB(55, 97, 54, 135, 10)}
        {LIMB(56, 97, 55, 135, 10)}
      </g>
      <GROUND />
    </svg>
  );
}

function PushUps() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={142} />
      <g className="pushup-body">
        {HEAD(26, 92)}
        <rect x="32" y="96" width="78" height="16" rx="8" fill="var(--figure-fill)" transform="rotate(5, 32, 100)" />
        {LIMB(38, 106, 36, 135)}
        {LIMB(46, 106, 44, 135)}
        {LIMB(100, 108, 118, 135)}
        {LIMB(108, 108, 125, 135)}
      </g>
    </svg>
  );
}

function Crunches() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={148} />
      {LIMB(70, 132, 100, 120, 11)}
      {LIMB(100, 120, 108, 142, 10)}
      <g className="crunch-upper">
        {HEAD(38, 92)}
        <rect x="40" y="98" width="35" height="16" rx="8" fill="var(--figure-fill)" transform="rotate(15, 70, 108)" />
        {LIMB(42, 95, 50, 85)}
        {LIMB(36, 90, 44, 80)}
      </g>
    </svg>
  );
}

function StepUps() {
  return (
    <svg viewBox="0 0 140 170">
      <rect x="55" y="125" width="50" height="22" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <g className="step-body">
        {HEAD(70, 40)}
        {TORSO(60, 54, 20, 42)}
        {LIMB(62, 65, 50, 85)}
        {LIMB(78, 65, 90, 55)}
        {LIMB(68, 96, 72, 123, 11)}
        {LIMB(72, 96, 52, 148, 10)}
      </g>
      <GROUND />
    </svg>
  );
}

function Squats() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND />
      <g className="squat-body">
        {HEAD(70, 38)}
        {TORSO(60, 50, 20, 42)}
        {LIMB(62, 65, 42, 68)}
        {LIMB(78, 65, 98, 68)}
        {LIMB(64, 92, 50, 118, 11)}
        {LIMB(50, 118, 48, 155, 10)}
        {LIMB(76, 92, 90, 118, 11)}
        {LIMB(90, 118, 92, 155, 10)}
      </g>
    </svg>
  );
}

function TricepDips() {
  return (
    <svg viewBox="0 0 140 170">
      <rect x="60" y="82" width="55" height="10" rx="4" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
      <rect x="65" y="92" width="6" height="52" rx="2" fill="rgba(255,255,255,0.06)" />
      <rect x="104" y="92" width="6" height="52" rx="2" fill="rgba(255,255,255,0.06)" />
      <g className="dip-body">
        {HEAD(55, 48)}
        {TORSO(45, 60, 20, 35)}
        {LIMB(50, 68, 66, 80)}
        {LIMB(60, 68, 72, 80)}
        {LIMB(50, 95, 28, 140, 10)}
        {LIMB(56, 95, 34, 140, 10)}
      </g>
      <GROUND />
    </svg>
  );
}

function Plank() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={138} />
      <g className="plank-body">
        {HEAD(24, 92)}
        <rect x="30" y="96" width="82" height="14" rx="7" fill="var(--figure-fill)" transform="rotate(3, 30, 100)" />
        {LIMB(34, 105, 38, 130)}
        {LIMB(38, 130, 52, 130, 8)}
        {LIMB(112, 108, 116, 130)}
      </g>
    </svg>
  );
}

function HighKnees() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND />
      {HEAD(70, 38)}
      {TORSO(60, 50, 20, 48)}
      <g className="hk-arm-l">{LIMB(62, 78, 45, 95)}</g>
      <g className="hk-arm-r">{LIMB(78, 78, 95, 62)}</g>
      <g className="hk-leg-l">{LIMB(64, 118, 60, 155, 11)}</g>
      <g className="hk-leg-r">{LIMB(76, 118, 80, 155, 11)}</g>
    </svg>
  );
}

function Lunges() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND />
      <g className="lunge-body">
        {HEAD(70, 30)}
        {TORSO(60, 42, 20, 42)}
        {LIMB(62, 55, 50, 78)}
        {LIMB(78, 55, 90, 78)}
        {LIMB(64, 84, 48, 112, 11)}
        {LIMB(48, 112, 46, 150, 10)}
        {LIMB(76, 84, 100, 115, 11)}
        {LIMB(100, 115, 112, 150, 10)}
      </g>
    </svg>
  );
}

function PushUpRotation() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={142} />
      <g className="pushrot-body">
        {HEAD(26, 90)}
        <rect x="32" y="94" width="78" height="16" rx="8" fill="var(--figure-fill)" transform="rotate(5, 32, 98)" />
        {LIMB(38, 105, 36, 135)}
        {LIMB(50, 98, 38, 65)}
        {LIMB(104, 108, 120, 135)}
        {LIMB(110, 108, 126, 135)}
      </g>
    </svg>
  );
}

function SidePlank() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={148} />
      <g className="sidepl-body">
        {HEAD(38, 62)}
        <rect x="38" y="72" width="16" height="58" rx="8" fill="var(--figure-fill)" transform="rotate(-25, 55, 100)" />
        {LIMB(48, 88, 58, 140)}
        {LIMB(42, 82, 24, 52)}
        {LIMB(80, 128, 105, 140, 10)}
        {LIMB(85, 132, 110, 142, 10)}
      </g>
      <GROUND />
    </svg>
  );
}

function CatCowFlow() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={150} />
      <g className="catcow-body">
        {HEAD(42, 90)}
        <rect x="52" y="86" width="42" height="20" rx="12" fill="var(--figure-fill)" />
        {LIMB(58, 106, 58, 140, 10)}
        {LIMB(82, 106, 82, 140, 10)}
        {LIMB(94, 96, 112, 124, 9)}
      </g>
    </svg>
  );
}

function DownwardDog() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={150} />
      <g className="downdog-body">
        {HEAD(38, 92)}
        <path d="M40 96 L90 60 L118 96" fill="none" stroke="var(--figure-fill)" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        {LIMB(48, 100, 38, 138, 9)}
        {LIMB(110, 100, 120, 138, 9)}
      </g>
    </svg>
  );
}

function WarriorTwo() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND />
      <g className="warrior-body">
        {HEAD(70, 34)}
        {TORSO(60, 46, 20, 42)}
        <line x1="30" y1="70" x2="110" y2="70" stroke="var(--figure-fill)" strokeWidth="10" strokeLinecap="round" />
        {LIMB(64, 88, 34, 130, 11)}
        {LIMB(76, 88, 106, 130, 11)}
      </g>
    </svg>
  );
}

function ChildPose() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={150} />
      <g className="childpose-body">
        <ellipse cx="70" cy="118" rx="40" ry="24" fill="var(--figure-fill)" />
        {HEAD(70, 92, 14)}
        {LIMB(40, 122, 30, 142, 8)}
        {LIMB(100, 122, 110, 142, 8)}
      </g>
    </svg>
  );
}

function SeatedForwardFold() {
  return (
    <svg viewBox="0 0 140 170">
      <GROUND y={150} />
      <g className="forwardfold-body">
        {HEAD(52, 82)}
        <rect x="50" y="90" width="50" height="16" rx="8" fill="var(--figure-fill)" transform="rotate(-8, 80, 98)" />
        {LIMB(98, 102, 118, 128, 9)}
        {LIMB(100, 108, 124, 140, 9)}
        {LIMB(58, 100, 42, 126, 8)}
      </g>
    </svg>
  );
}

function JumpingJackIllustration({ variant }) {
  const armsUp = variant === 'open';
  const legsWide = variant === 'open';
  return (
    <svg viewBox="0 0 120 120" className="illustration-svg">
      <rect x="10" y="92" width="100" height="10" rx="5" fill={ILLUSTRATION_COLORS.mat} />
      <circle cx="60" cy="32" r="12" fill={ILLUSTRATION_COLORS.skin} />
      <rect x="52" y="44" width="16" height="34" rx="8" fill={ILLUSTRATION_COLORS.outfitTop} />
      <rect x="52" y="74" width="16" height="22" rx="6" fill={ILLUSTRATION_COLORS.outfitBottom} />
      <path d={armsUp ? 'M52 54 L34 32' : 'M52 54 L38 74'} stroke={ILLUSTRATION_COLORS.outfitTop} strokeWidth="8" strokeLinecap="round" />
      <path d={armsUp ? 'M68 54 L86 32' : 'M68 54 L82 74'} stroke={ILLUSTRATION_COLORS.outfitTop} strokeWidth="8" strokeLinecap="round" />
      <path d={legsWide ? 'M56 96 L36 116' : 'M56 96 L50 118'} stroke={ILLUSTRATION_COLORS.outfitBottom} strokeWidth="10" strokeLinecap="round" />
      <path d={legsWide ? 'M64 96 L84 116' : 'M64 96 L70 118'} stroke={ILLUSTRATION_COLORS.outfitBottom} strokeWidth="10" strokeLinecap="round" />
      <circle cx="56" cy="28" r="4" fill={ILLUSTRATION_COLORS.hair} />
      <circle cx="64" cy="28" r="4" fill={ILLUSTRATION_COLORS.hair} />
    </svg>
  );
}

function PushUpIllustration({ variant }) {
  const lowered = variant === 'low';
  return (
    <svg viewBox="0 0 120 120" className="illustration-svg">
      <rect x="12" y="94" width="96" height="8" rx="4" fill={ILLUSTRATION_COLORS.mat} />
      <circle cx="28" cy={lowered ? 72 : 64} r="10" fill={ILLUSTRATION_COLORS.skin} />
      <rect x="36" y={lowered ? 78 : 70} width="60" height="12" rx="6" fill={ILLUSTRATION_COLORS.outfitTop} />
      <rect x="36" y={lowered ? 86 : 78} width="60" height="10" rx="5" fill={ILLUSTRATION_COLORS.outfitBottom} />
      <path d={lowered ? 'M36 84 L26 96' : 'M36 76 L26 86'} stroke={ILLUSTRATION_COLORS.outfitTop} strokeWidth="8" strokeLinecap="round" />
      <path d={lowered ? 'M96 84 L108 96' : 'M96 76 L108 86'} stroke={ILLUSTRATION_COLORS.outfitTop} strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
}

function CatCowIllustration({ variant }) {
  const isCow = variant === 'cow';
  return (
    <svg viewBox="0 0 120 120" className="illustration-svg">
      <rect x="14" y="94" width="92" height="10" rx="5" fill={ILLUSTRATION_COLORS.mat} />
      <circle cx="34" cy={isCow ? 66 : 60} r="11" fill={ILLUSTRATION_COLORS.skin} />
      <rect x="42" y="68" width="52" height="16" rx="8" fill={ILLUSTRATION_COLORS.outfitTop} transform={isCow ? 'rotate(-6 68 76)' : 'rotate(12 68 76)'} />
      <rect x="44" y="80" width="48" height="12" rx="6" fill={ILLUSTRATION_COLORS.outfitBottom} />
      <path d="M46 80 L46 98" stroke={ILLUSTRATION_COLORS.outfitBottom} strokeWidth="10" strokeLinecap="round" />
      <path d="M88 80 L88 98" stroke={ILLUSTRATION_COLORS.outfitBottom} strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

function IllustrationStrip({ title, frames }) {
  return (
    <div className="illustration-card">
      <div className="illustration-header">
        <p>Movement breakdown</p>
        <h3>{title}</h3>
      </div>
      <div className="illustration-frames">
        {frames.map((Frame, idx) => (
          <div className="illustration-frame" key={idx}>
            <span className="step-label">0{idx + 1}</span>
            {Frame}
          </div>
        ))}
      </div>
    </div>
  );
}

const illustrationSets = {
  'jumping-jacks': () => ({
    title: 'Jumping Jacks',
    frames: [
      <JumpingJackIllustration variant="closed" key="jj-1" />,
      <JumpingJackIllustration variant="open" key="jj-2" />,
    ],
  }),
  'push-ups': () => ({
    title: 'Push-Ups',
    frames: [
      <PushUpIllustration variant="high" key="pu-1" />,
      <PushUpIllustration variant="low" key="pu-2" />,
    ],
  }),
  'cat-cow': () => ({
    title: 'Cat-Cow Flow',
    frames: [
      <CatCowIllustration variant="cat" key="cc-1" />,
      <CatCowIllustration variant="cow" key="cc-2" />,
    ],
  }),
};

const animations = {
  'jumping-jacks': JumpingJacks,
  'wall-sit': WallSit,
  'push-ups': PushUps,
  crunches: Crunches,
  'step-ups': StepUps,
  squats: Squats,
  'tricep-dips': TricepDips,
  plank: Plank,
  'high-knees': HighKnees,
  lunges: Lunges,
  'push-up-rotation': PushUpRotation,
  'side-plank': SidePlank,
  'cat-cow': CatCowFlow,
  'downward-dog': DownwardDog,
  'warrior-ii': WarriorTwo,
  'childs-pose': ChildPose,
  'seated-forward-fold': SeatedForwardFold,
};

function RiveExercise({ exerciseId }) {
  const riveOptions = useMemo(
    () => ({
      src: RIVE_SRC,
      artboard: exerciseId,
      stateMachines: RIVE_STATE_MACHINE,
      autoplay: true,
    }),
    [exerciseId],
  );

  const { RiveComponent, renderError } = useRive(riveOptions, {
    shouldResizeCanvasToContainer: true,
  });

  if (renderError) {
    return <div className="exercise-animation placeholder">⚠️</div>;
  }
  if (!RiveComponent) {
    return <div className="exercise-animation placeholder">⏳</div>;
  }

  return <RiveComponent role="img" aria-label={`${exerciseId} animation`} />;
}

const IMG_BASE = import.meta.env.VITE_API_BASE || 'https://labanos.dk';

function DbIllustration({ exerciseId }) {
  const { frames } = useIllustrations(exerciseId);

  if (!frames || frames.length === 0) return null;

  return (
    <div className="db-illustration">
      <div className="db-illustration-frames">
        {frames.map((frame, idx) => {
          const v = frame.updated_at ? new Date(frame.updated_at).getTime() : '';
          return (
            <div className="db-illustration-frame" key={idx}>
              <img
                src={`${IMG_BASE}/image.php?exercise_id=${encodeURIComponent(exerciseId)}&frame=${frame.frame_number}&v=${v}`}
                alt={`${exerciseId} frame ${frame.frame_number}`}
                loading="lazy"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExerciseAnimation({ exerciseId }) {
  const [riveReady, setRiveReady] = useState(null);
  const { frames: dbFrames, loading: dbLoading } = useIllustrations(exerciseId);

  useEffect(() => {
    let mounted = true;
    checkRiveAvailability().then((hasFile) => {
      if (mounted) setRiveReady(hasFile);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Priority 1: DB illustrations (from Gemini / Nano Banana)
  if (dbFrames && dbFrames.length > 0) {
    return (
      <div className="exercise-illustration">
        <DbIllustration exerciseId={exerciseId} />
      </div>
    );
  }

  // While loading DB illustrations, show a brief placeholder
  if (dbLoading) {
    return <div className="exercise-animation placeholder">⏳</div>;
  }

  // Priority 2: Hardcoded illustration strips (prototype)
  const illustration = illustrationSets[exerciseId]?.();
  if (illustration) {
    return (
      <div className="exercise-illustration">
        <IllustrationStrip title={illustration.title ?? formatLabel(exerciseId)} frames={illustration.frames} />
      </div>
    );
  }

  // Priority 3: Rive
  const canUseRive = riveReady && riveCapableExercises.has(exerciseId);
  if (canUseRive) {
    return (
      <div className="exercise-animation rive">
        <RiveExercise exerciseId={exerciseId} />
      </div>
    );
  }

  // Priority 4: Procedural SVG animations
  const AnimComponent = animations[exerciseId];
  if (!AnimComponent) {
    return <div className="exercise-animation placeholder">🏃‍♂️</div>;
  }

  return (
    <div className="exercise-animation">
      <AnimComponent />
    </div>
  );
}
