import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Auth from './pages/Auth';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Reminders from './pages/Reminders';
import Family from './pages/Family';
import Landing from './pages/Landing';
import Settings from './pages/Settings';
import OnboardingWizard from './components/OnboardingWizard';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" />;
  return children;
}

function App() {
  const { loading, user, onboardingCompleted, setOnboardingCompleted } = useAuth();

  if (loading) {
    return (
      <div className="loader-container">
        App is waking up... Please wait.
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" /> : <Auth />} />
        
        {user ? (
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="assets" element={<Assets />} />
            <Route path="reminders" element={<Reminders />} />
            <Route path="family" element={<Family />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        ) : (
          <Route path="/" element={<Landing />} />
        )}

        {/* Catch-all to redirect to root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Onboarding Overlay — renders on top of everything */}
      {user && !onboardingCompleted && (
        <OnboardingWizard onComplete={() => setOnboardingCompleted(true)} />
      )}
    </>
  );
}

export default App;
