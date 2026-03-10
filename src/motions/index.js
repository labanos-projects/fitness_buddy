import { pose, deg } from './poseUtils';

const relaxed = pose({
  torso: { x: deg(2) },
  leftShoulder: { x: deg(-4), z: deg(6) },
  rightShoulder: { x: deg(-4), z: deg(-6) },
  leftHip: { x: deg(2) },
  rightHip: { x: deg(2) },
});

const jumpingJacks = {
  duration: 1.6,
  keyframes: [
    { time: 0, pose: relaxed },
    {
      time: 0.8,
      pose: pose({
        torso: { x: deg(5) },
        leftShoulder: { x: deg(-5), z: deg(-150) },
        rightShoulder: { x: deg(-5), z: deg(150) },
        leftElbow: { x: deg(-5) },
        rightElbow: { x: deg(-5) },
        leftHip: { x: deg(5), z: deg(26) },
        rightHip: { x: deg(5), z: deg(-26) },
        leftKnee: { x: deg(10) },
        rightKnee: { x: deg(10) },
      }),
    },
    { time: 1.6, pose: relaxed },
  ],
};

const squats = {
  duration: 2,
  keyframes: [
    { time: 0, pose: relaxed },
    {
      time: 1,
      pose: pose({
        torso: { x: deg(12) },
        leftShoulder: { x: deg(8), z: deg(20) },
        rightShoulder: { x: deg(8), z: deg(-20) },
        leftHip: { x: deg(-35) },
        rightHip: { x: deg(-35) },
        leftKnee: { x: deg(70) },
        rightKnee: { x: deg(70) },
      }),
    },
    { time: 2, pose: relaxed },
  ],
};

const lunges = {
  duration: 2.2,
  keyframes: [
    { time: 0, pose: relaxed },
    {
      time: 1.1,
      pose: pose({
        torso: { x: deg(8), y: deg(5) },
        leftShoulder: { x: deg(-10), z: deg(-30) },
        rightShoulder: { x: deg(15), z: deg(40) },
        leftHip: { x: deg(-50) },
        leftKnee: { x: deg(80) },
        rightHip: { x: deg(25), z: deg(-12) },
        rightKnee: { x: deg(-15) },
      }),
    },
    {
      time: 2.2,
      pose: pose({
        torso: { x: deg(8), y: deg(-5) },
        leftShoulder: { x: deg(15), z: deg(40) },
        rightShoulder: { x: deg(-10), z: deg(-30) },
        rightHip: { x: deg(-50) },
        rightKnee: { x: deg(80) },
        leftHip: { x: deg(25), z: deg(12) },
        leftKnee: { x: deg(-15) },
      }),
    },
  ],
};

const plank = {
  duration: 3,
  keyframes: [
    {
      time: 0,
      pose: pose({
        torso: { x: deg(-10) },
        leftShoulder: { x: deg(40) },
        rightShoulder: { x: deg(40) },
        leftHip: { x: deg(-10) },
        rightHip: { x: deg(-10) },
        leftKnee: { x: deg(-5) },
        rightKnee: { x: deg(-5) },
      }),
    },
    {
      time: 1.5,
      pose: pose({
        torso: { x: deg(-8) },
        leftShoulder: { x: deg(45) },
        rightShoulder: { x: deg(45) },
        leftHip: { x: deg(-12) },
        rightHip: { x: deg(-12) },
      }),
    },
    {
      time: 3,
      pose: pose({
        torso: { x: deg(-10) },
        leftShoulder: { x: deg(40) },
        rightShoulder: { x: deg(40) },
      }),
    },
  ],
};

export const motions = {
  'jumping-jacks': jumpingJacks,
  squats,
  lunges,
  plank,
};
