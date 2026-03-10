# Fitness Buddy — Project Ideas

_Early brainstorming — nothing is decided yet._

## The Problem
Apps like Seven started simple (7-min HIIT timer) but bloated into premium fitness platforms. We just want the clean, simple core.

## Core Concept
A clean, no-nonsense workout timer with animated exercise demos. No subscriptions, no social, no gamification. Just: here's what to do, here's how long, go.

## Must-Haves
- **Animated exercise demos** — simple figure showing proper form
- **Sequential timer** — one exercise at a time, countdown, rest, next
- **Exercise library** — reusable pool of exercises (HIIT, yoga, stretching, etc.)
- **Programs/routines** — ordered sequences composed from the library
- **Responsive** — works on phone, tablet, laptop, TV

## Platform
- **Web app (PWA)** — most portable, one codebase for all devices
- Pin to homescreen on iPhone, works in browser everywhere else
- Needs to look good from small screen to large TV

## Tech Stack (tentative)
- **Frontend:** React (reuse InvestTracker patterns)
- **Backend:** PHP (same hosting as InvestTracker)
- **Database:** MySQL on labanos.dk (already set up)
- Could start with static JSON for exercises/routines, add DB later

## Animations — To Explore
- SVG/CSS animations (lightweight, scalable, free)
- Lottie animations (JSON-based, smooth, lots of free options)
- Open source exercise illustration libraries
- Goal: clean silhouette/figure style, not video

## AI Program Composer (key feature)
- Describe what you want in plain language: "20 min yoga for back stretching after golf"
- AI picks exercises from the library, orders them sensibly, sets durations
- Feeds into the same timer/player as pre-built programs
- Could use Gemini API (Peter has Pro subscription, free-tier API available)
- Pre-built programs still exist as quick-start options

## Future Ideas
- Workout history/tracking
- Favourite/save AI-generated programs for reuse
- "More like this" — regenerate with tweaks

## Audio
- Countdown before starting
- Transition cues between exercises
- Possibly voice announcements ("Next: push-ups")

## V1 Scope
- Classic 7-minute HIIT workout (12 exercises, 30s each, 10s rest)
- Animated demos + sequential timer + audio cues
- Responsive PWA
- Get it working end-to-end, then expand

## Open Questions
- What does the exercise data model look like?
- Animation style — need to prototype a few approaches
- Hosting: subdomain like fitness.labanos.dk?
