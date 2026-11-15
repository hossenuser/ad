import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import SetupWizard from './components/SetupWizard';
import MainApp from './components/MainApp';

type AppState = 'landing' | 'setup' | 'app';

function initialState(): AppState {
  try {
    if (window.location.hash === '#app') return 'app';
    if (window.location.hash === '#setup') return 'setup';
    if (window.location.protocol === 'file:') return 'app';
  } catch {
    /* ignore */
  }
  return 'landing';
}

export default function App() {
  const [state, setState] = useState<AppState>(initialState);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [state]);

  const finishSetup = () => {
    try {
      window.localStorage.setItem('mh_installed_at', String(Date.now()));
      window.localStorage.setItem('mh_app_version', '2.2.0');
    } catch {
      /* storage is optional */
    }
    setState('app');
  };

  return (
    <>
      {state === 'landing' && (
        <LandingPage
          onInstall={() => setState('setup')}
          onOpenApp={() => setState('app')}
        />
      )}

      {state === 'setup' && (
        <SetupWizard
          onComplete={finishSetup}
          onCancel={() => setState('landing')}
        />
      )}

      {state === 'app' && (
        <MainApp
          onExit={() => setState('landing')}
          onRunSetup={() => setState('setup')}
        />
      )}
    </>
  );
}
