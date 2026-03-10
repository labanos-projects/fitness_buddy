export const jointNames = [
  'torso',
  'head',
  'leftShoulder',
  'leftElbow',
  'rightShoulder',
  'rightElbow',
  'leftHip',
  'leftKnee',
  'rightHip',
  'rightKnee'
];

export const deg = (value) => (value * Math.PI) / 180;

export const defaultPose = jointNames.reduce((acc, joint) => {
  acc[joint] = { x: 0, y: 0, z: 0 };
  return acc;
}, {});

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
};

export function pose(partial = {}) {
  const merged = clone(defaultPose);
  for (const joint of Object.keys(partial)) {
    merged[joint] = {
      x: partial[joint]?.x ?? defaultPose[joint].x,
      y: partial[joint]?.y ?? defaultPose[joint].y,
      z: partial[joint]?.z ?? defaultPose[joint].z,
    };
  }
  return merged;
}

export function getPoseAt(motion, timeSeconds) {
  if (!motion || !motion.keyframes?.length) {
    return defaultPose;
  }
  const duration = motion.duration ?? motion.keyframes.at(-1).time;
  const local = duration > 0 ? (timeSeconds % duration) : 0;

  let prev = motion.keyframes[0];
  let next = motion.keyframes[motion.keyframes.length - 1];

  for (let i = 0; i < motion.keyframes.length - 1; i += 1) {
    const current = motion.keyframes[i];
    const following = motion.keyframes[i + 1];
    if (local >= current.time && local <= following.time) {
      prev = current;
      next = following;
      break;
    }
  }

  const span = Math.max(next.time - prev.time, 0.0001);
  const t = Math.min(Math.max((local - prev.time) / span, 0), 1);

  const interpolated = {};
  for (const joint of jointNames) {
    const from = prev.pose[joint] ?? defaultPose[joint];
    const to = next.pose[joint] ?? defaultPose[joint];
    interpolated[joint] = {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      z: from.z + (to.z - from.z) * t,
    };
  }

  return interpolated;
}
