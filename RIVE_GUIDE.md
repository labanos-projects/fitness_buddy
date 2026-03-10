# Rive Animation Guide — Fitness Buddy

## Overview
We use **one** `.riv` file (`public/fitness-buddy.riv`) with multiple artboards — one per exercise.

## File Structure
```
public/
  fitness-buddy.riv    ← The Rive file (all exercises in one file)
```

## Rive Editor Setup (rive.app)

### 1. Create a free account at https://rive.app

### 2. Create a new file called "Fitness Buddy"

### 3. Design ONE character rig
Build a simple, flat-design human figure with bones:
- **Head** (circle/ellipse)
- **Neck** (short bone)
- **Torso** (upper + lower)
- **Arms**: shoulder → upper arm → forearm → hand (each side)
- **Legs**: hip → thigh → calf → foot (each side)

Use **bones + constraints** so you can pose it naturally.

**Style guide:**
- Flat single color (we use `#e94560` — our accent red)
- Slightly darker shade for arms (`#c23152`) for depth
- Rounded shapes, no outlines
- No facial features — clean silhouette
- Proportional body (~7 head-heights)

### 4. For each exercise, create an artboard
Artboard names must match exercise IDs exactly:
- `jumping-jacks`
- `wall-sit`
- `push-ups`
- `crunches`
- `step-ups`
- `squats`
- `tricep-dips`
- `plank`
- `high-knees`
- `lunges`
- `push-up-rotation`
- `side-plank`

### 5. Each artboard needs:
- A **State Machine** called `Controller`
- The state machine should auto-play a looping animation
- Animation shows the exercise movement smoothly

### 6. Export
- File → Export → `.riv`
- Save as `fitness-buddy.riv` in the `public/` folder

## How the React code uses it
```jsx
const { RiveComponent } = useRive({
  src: '/fitness-buddy.riv',
  artboard: exerciseId,        // e.g. 'jumping-jacks'
  stateMachines: 'Controller',
  autoplay: true,
});
```

The code automatically checks if the `.riv` file exists. If not, it shows emoji placeholders.

## Tips
- Start with jumping jacks — it's the most iconic
- Use Rive's bone system for the skeleton (way easier than shape-based animation)
- Keep artboard size consistent (e.g., 400x400)
- All exercises can share the same character — just copy the rig to each artboard and animate differently
- Rive community has character templates you can start from

## Resources
- Rive Editor: https://rive.app/editor
- Character rigging tutorial: https://rive.app/docs/editor/bones-and-constraints
- Community files: https://rive.app/marketplace (search "character", "human", "person")
