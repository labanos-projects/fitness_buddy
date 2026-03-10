import '../styles/animations.css';

function JumpingJacks() {
  return (
    <svg viewBox="0 0 140 170">
      {/* Head */}
      <circle cx="70" cy="50" r="15" className="figure-head" />
      {/* Torso */}
      <line x1="70" y1="65" x2="70" y2="115" className="figure-body" />
      {/* Arms - animated */}
      <path d="M50 75 L70 95" className="figure-body jj-arm-l" />
      <path d="M90 75 L70 95" className="figure-body jj-arm-r" />
      {/* Legs - animated */}
      <path d="M60 115 L70 150" className="figure-body jj-leg-l" />
      <path d="M80 115 L70 150" className="figure-body jj-leg-r" />
    </svg>
  );
}

function WallSit() {
  return (
    <svg viewBox="0 0 140 170">
      {/* Wall */}
      <line x1="110" y1="20" x2="110" y2="160" stroke="var(--text-muted)" strokeWidth="3" strokeDasharray="6,4" />
      <g className="wall-sit-figure">
        <circle cx="80" cy="50" r="15" className="figure-head" />
        {/* Back against wall */}
        <line x1="80" y1="65" x2="80" y2="100" className="figure-body" />
        {/* Thighs horizontal */}
        <line x1="80" y1="100" x2="55" y2="100" className="figure-body" />
        {/* Shins vertical */}
        <line x1="55" y1="100" x2="55" y2="135" className="figure-body" />
        {/* Arms down */}
        <line x1="80" y1="75" x2="95" y2="95" className="figure-body" />
        <line x1="80" y1="75" x2="65" y2="90" className="figure-body" />
      </g>
    </svg>
  );
}

function PushUps() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="pushup-figure">
        {/* Head */}
        <circle cx="30" cy="95" r="12" className="figure-head" />
        {/* Body - angled plank */}
        <line x1="40" y1="100" x2="110" y2="115" className="figure-body" />
        {/* Arms */}
        <line x1="40" y1="100" x2="35" y2="130" className="figure-body" />
        {/* Legs */}
        <line x1="110" y1="115" x2="125" y2="130" className="figure-body" />
      </g>
      {/* Ground */}
      <line x1="15" y1="140" x2="130" y2="140" stroke="var(--text-muted)" strokeWidth="2" />
    </svg>
  );
}

function Crunches() {
  return (
    <svg viewBox="0 0 140 170">
      {/* Ground */}
      <line x1="10" y1="140" x2="130" y2="140" stroke="var(--text-muted)" strokeWidth="2" />
      {/* Lower body - fixed on ground */}
      <line x1="70" y1="130" x2="110" y2="125" className="figure-body" />
      <line x1="110" y1="125" x2="120" y2="135" className="figure-body" />
      {/* Upper body - crunching */}
      <g className="crunch-upper">
        <circle cx="40" cy="100" r="12" className="figure-head" />
        <line x1="50" y1="105" x2="70" y2="130" className="figure-body" />
        {/* Hands behind head */}
        <line x1="45" y1="105" x2="35" y2="95" className="figure-body" />
        <line x1="45" y1="105" x2="50" y2="90" className="figure-body" />
      </g>
    </svg>
  );
}

function StepUps() {
  return (
    <svg viewBox="0 0 140 170">
      {/* Step/box */}
      <rect x="60" y="120" width="50" height="25" rx="3" fill="none" stroke="var(--text-muted)" strokeWidth="2" />
      <g className="stepup-figure">
        <circle cx="70" cy="55" r="13" className="figure-head" />
        <line x1="70" y1="68" x2="70" y2="108" className="figure-body" />
        {/* Stepping leg - on box */}
        <line x1="70" y1="108" x2="80" y2="118" className="figure-body" />
        {/* Trailing leg */}
        <line x1="70" y1="108" x2="50" y2="140" className="figure-body" />
        {/* Arms swinging */}
        <line x1="70" y1="78" x2="55" y2="90" className="figure-body" />
        <line x1="70" y1="78" x2="85" y2="68" className="figure-body" />
      </g>
    </svg>
  );
}

function Squats() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="squat-figure">
        <circle cx="70" cy="40" r="14" className="figure-head" />
        <line x1="70" y1="54" x2="70" y2="95" className="figure-body" />
        {/* Arms forward for balance */}
        <line x1="70" y1="70" x2="45" y2="72" className="figure-body" />
        <line x1="70" y1="70" x2="95" y2="72" className="figure-body" />
        {/* Legs - bending */}
        <line x1="70" y1="95" x2="50" y2="120" className="figure-body" />
        <line x1="50" y1="120" x2="50" y2="150" className="figure-body" />
        <line x1="70" y1="95" x2="90" y2="120" className="figure-body" />
        <line x1="90" y1="120" x2="90" y2="150" className="figure-body" />
      </g>
    </svg>
  );
}

function TricepDips() {
  return (
    <svg viewBox="0 0 140 170">
      {/* Chair/bench */}
      <rect x="65" y="80" width="55" height="8" rx="3" fill="none" stroke="var(--text-muted)" strokeWidth="2" />
      <line x1="70" y1="88" x2="70" y2="145" stroke="var(--text-muted)" strokeWidth="2" />
      <line x1="115" y1="88" x2="115" y2="145" stroke="var(--text-muted)" strokeWidth="2" />
      <g className="dip-figure">
        <circle cx="55" cy="55" r="13" className="figure-head" />
        <line x1="55" y1="68" x2="55" y2="100" className="figure-body" />
        {/* Arms on bench */}
        <line x1="55" y1="75" x2="75" y2="78" className="figure-body" />
        <line x1="55" y1="75" x2="40" y2="78" className="figure-body" />
        {/* Legs forward */}
        <line x1="55" y1="100" x2="30" y2="140" className="figure-body" />
        <line x1="55" y1="100" x2="40" y2="140" className="figure-body" />
      </g>
    </svg>
  );
}

function Plank() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="plank-figure">
        <circle cx="28" cy="95" r="12" className="figure-head" />
        {/* Body - straight line */}
        <line x1="38" y1="100" x2="115" y2="108" className="figure-body" />
        {/* Forearms on ground */}
        <line x1="38" y1="100" x2="42" y2="125" className="figure-body" />
        <line x1="42" y1="125" x2="55" y2="125" className="figure-body" />
        {/* Toes */}
        <line x1="115" y1="108" x2="118" y2="125" className="figure-body" />
      </g>
      {/* Ground */}
      <line x1="15" y1="130" x2="130" y2="130" stroke="var(--text-muted)" strokeWidth="2" />
    </svg>
  );
}

function HighKnees() {
  return (
    <svg viewBox="0 0 140 170">
      <circle cx="70" cy="40" r="14" className="figure-head" />
      <line x1="70" y1="54" x2="70" y2="100" className="figure-body" />
      {/* Arms - pumping */}
      <path d="M55 75 L40 90" className="figure-body hk-arm-l" />
      <path d="M85 75 L100 65" className="figure-body hk-arm-r" />
      {/* Legs - alternating high knees */}
      <path d="M60 115 L55 150" className="figure-body hk-leg-l" />
      <path d="M80 115 L85 95" className="figure-body hk-leg-r" />
    </svg>
  );
}

function Lunges() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="lunge-figure">
        <circle cx="70" cy="35" r="13" className="figure-head" />
        <line x1="70" y1="48" x2="70" y2="90" className="figure-body" />
        {/* Arms at sides */}
        <line x1="70" y1="60" x2="55" y2="80" className="figure-body" />
        <line x1="70" y1="60" x2="85" y2="80" className="figure-body" />
        {/* Front leg - bent */}
        <line x1="70" y1="90" x2="50" y2="115" className="figure-body" />
        <line x1="50" y1="115" x2="50" y2="145" className="figure-body" />
        {/* Back leg - extended */}
        <line x1="70" y1="90" x2="100" y2="120" className="figure-body" />
        <line x1="100" y1="120" x2="110" y2="145" className="figure-body" />
      </g>
    </svg>
  );
}

function PushUpRotation() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="pushup-rot-figure">
        <circle cx="30" cy="95" r="12" className="figure-head" />
        <line x1="40" y1="100" x2="110" y2="115" className="figure-body" />
        {/* Arms */}
        <line x1="40" y1="100" x2="35" y2="130" className="figure-body" />
        {/* Extended arm (rotation) */}
        <line x1="55" y1="105" x2="45" y2="70" className="figure-body" />
        {/* Legs */}
        <line x1="110" y1="115" x2="125" y2="130" className="figure-body" />
      </g>
      <line x1="15" y1="140" x2="130" y2="140" stroke="var(--text-muted)" strokeWidth="2" />
    </svg>
  );
}

function SidePlank() {
  return (
    <svg viewBox="0 0 140 170">
      <g className="side-plank-figure">
        {/* Head */}
        <circle cx="40" cy="70" r="12" className="figure-head" />
        {/* Body - angled */}
        <line x1="40" y1="82" x2="90" y2="128" className="figure-body" />
        {/* Support arm */}
        <line x1="40" y1="88" x2="55" y2="128" className="figure-body" />
        {/* Top arm - reaching up */}
        <line x1="50" y1="90" x2="30" y2="60" className="figure-body" />
        {/* Legs */}
        <line x1="90" y1="128" x2="110" y2="135" className="figure-body" />
      </g>
      {/* Ground */}
      <line x1="15" y1="140" x2="130" y2="140" stroke="var(--text-muted)" strokeWidth="2" />
    </svg>
  );
}

const animations = {
  'jumping-jacks': JumpingJacks,
  'wall-sit': WallSit,
  'push-ups': PushUps,
  'crunches': Crunches,
  'step-ups': StepUps,
  'squats': Squats,
  'tricep-dips': TricepDips,
  'plank': Plank,
  'high-knees': HighKnees,
  'lunges': Lunges,
  'push-up-rotation': PushUpRotation,
  'side-plank': SidePlank,
};

export default function ExerciseAnimation({ exerciseId }) {
  const AnimComponent = animations[exerciseId];

  if (!AnimComponent) {
    return <div className="exercise-animation" />;
  }

  return (
    <div className="exercise-animation">
      <AnimComponent />
    </div>
  );
}
