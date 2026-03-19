import { useState } from 'react';
import Home from './components/Home';
import Workout from './components/Workout';
import Complete from './components/Complete';
import Library from './components/Library';
import AiComposer from './components/AiComposer';
import './styles/App.css';

export default function App() {
  const [screen, setScreen] = useState('home'); // home | workout | complete | library | compose
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
      {screen === 'home' && (
        <Home
          onStartRoutine={handleStart}
          onOpenLibrary={() => setScreen('library')}
          onOpenComposer={() => setScreen('compose')}
        />
      )}
      {screen === 'library' && <Library onBack={handleHome} />}
      {screen === 'compose' && (
        <AiComposer onStartRoutine={handleStart} onBack={handleHome} />
      )}
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
