import { useState } from 'react';
import Home from './components/Home';
import Workout from './components/Workout';
import Complete from './components/Complete';
import './styles/App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | workout | complete
  const [activeRoutine, setActiveRoutine] = useState(null);

  const handleStart = (routine) => {
    setActiveRoutine(routine);
    setScreen('workout');
  };

  const handleComplete = () => {
    setScreen('complete');
  };

  const handleHome = () => {
    setActiveRoutine(null);
    setScreen('home');
  };

  return (
    <>
      {screen === 'home' && <Home onStartRoutine={handleStart} />}
      {screen === 'workout' && (
        <Workout
          routine={activeRoutine}
          onComplete={handleComplete}
          onQuit={handleHome}
        />
      )}
      {screen === 'complete' && (
        <Complete routine={activeRoutine} onHome={handleHome} />
      )}
    </>
  );
}
