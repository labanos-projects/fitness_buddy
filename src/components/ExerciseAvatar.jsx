import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrthographicCamera, Environment } from '@react-three/drei';
import { motions } from '../motions';
import { jointNames, defaultPose, getPoseAt } from '../motions/poseUtils';

const torsoHeight = 1.2;
const shoulderOffset = 0.38;
const hipOffset = 0.28;
const upperArm = 0.65;
const lowerArm = 0.55;
const upperLeg = 0.85;
const lowerLeg = 0.85;

const Limb = ({ length, radius, color = '#f4f4fc' }) => (
  <mesh position={[0, -length / 2, 0]}>
    <cylinderGeometry args={[radius, radius, length, 12]} />
    <meshStandardMaterial color={color} roughness={0.7} metalness={0.05} />
  </mesh>
);

const Capsule = ({ height, radius, color }) => (
  <mesh>
    <capsuleGeometry args={[radius, height, 4, 16]} />
    <meshStandardMaterial color={color} roughness={0.6} metalness={0.02} />
  </mesh>
);

function Rig({ motionId }) {
  const motion = motions[motionId];
  const refs = useMemo(() => {
    const map = {};
    jointNames.forEach((joint) => {
      map[joint] = { current: null };
    });
    return map;
  }, []);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    if (!motion) return;
    timeRef.current += delta;
    const pose = getPoseAt(motion, timeRef.current);
    jointNames.forEach((joint) => {
      const node = refs[joint].current;
      if (node) {
        const rotation = pose[joint] ?? defaultPose[joint];
        node.rotation.set(rotation.x, rotation.y, rotation.z);
      }
    });
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* Torso */}
      <group ref={refs.torso}>
        <Capsule height={torsoHeight} radius={0.22} color="#f9f4ff" />
        {/* chest to head */}
        <group ref={refs.head} position={[0, torsoHeight / 2 + 0.35, 0]}>
          <Capsule height={0.45} radius={0.18} color="#f9f4ff" />
        </group>
      </group>

      {/* Arms */}
      <group ref={refs.leftShoulder} position={[-shoulderOffset, torsoHeight / 2 - 0.05, 0]}>
        <Limb length={upperArm} radius={0.1} color="#e2d7ff" />
        <group ref={refs.leftElbow} position={[0, -upperArm, 0]}>
          <Limb length={lowerArm} radius={0.08} color="#e2d7ff" />
        </group>
      </group>
      <group ref={refs.rightShoulder} position={[shoulderOffset, torsoHeight / 2 - 0.05, 0]}>
        <Limb length={upperArm} radius={0.1} color="#e2d7ff" />
        <group ref={refs.rightElbow} position={[0, -upperArm, 0]}>
          <Limb length={lowerArm} radius={0.08} color="#e2d7ff" />
        </group>
      </group>

      {/* Legs */}
      <group ref={refs.leftHip} position={[-hipOffset, -torsoHeight / 2 + 0.1, 0]}>
        <Limb length={upperLeg} radius={0.12} color="#ffb3c1" />
        <group ref={refs.leftKnee} position={[0, -upperLeg, 0]}>
          <Limb length={lowerLeg} radius={0.1} color="#ffb3c1" />
        </group>
      </group>
      <group ref={refs.rightHip} position={[hipOffset, -torsoHeight / 2 + 0.1, 0]}>
        <Limb length={upperLeg} radius={0.12} color="#ffb3c1" />
        <group ref={refs.rightKnee} position={[0, -upperLeg, 0]}>
          <Limb length={lowerLeg} radius={0.1} color="#ffb3c1" />
        </group>
      </group>
    </group>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.3, 0]}>
      <circleGeometry args={[3, 48]} />
      <meshStandardMaterial color="#1f1f35" />
    </mesh>
  );
}

export default function ExerciseAvatar({ exerciseId }) {
  const motion = motions[exerciseId];
  if (!motion) {
    return (
      <div className="exercise-animation placeholder">
        <div className="placeholder-icon">🏃‍♂️</div>
      </div>
    );
  }

  return (
    <div className="exercise-animation three">
      <Canvas shadows frameloop="always">
        <OrthographicCamera makeDefault position={[0, 2.6, 6]} zoom={180} />
        <color attach="background" args={[0x050510]} />
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 5, 3]} intensity={0.9} castShadow />
        <Suspense fallback={null}>
          <Rig motionId={exerciseId} />
          <Ground />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
