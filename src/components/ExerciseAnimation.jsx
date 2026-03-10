import '../styles/animations.css';

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
};

export default function ExerciseAnimation({ exerciseId }) {
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
