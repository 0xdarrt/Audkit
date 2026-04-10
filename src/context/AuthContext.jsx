import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(true); // Premium unlocked by default for developer
  const [onboardingCompleted, setOnboardingCompleted] = useState(true); // default true to prevent flash
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user);
      }
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        checkOnboarding(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboarding = async (currentUser) => {
    // Quick localStorage check first
    const localCompleted = localStorage.getItem('audkit_onboarding_completed');
    if (localCompleted === 'true') {
      setOnboardingCompleted(true);
      return;
    }

    // Check if user already has assets (auto-complete for existing users)
    try {
      const { data: assets, error: assetErr } = await supabase
        .from('assets')
        .select('id')
        .eq('user_id', currentUser.id)
        .limit(1);

      if (!assetErr && assets && assets.length > 0) {
        // Existing user with assets — skip onboarding
        setOnboardingCompleted(true);
        localStorage.setItem('audkit_onboarding_completed', 'true');
        return;
      }

      // Check profiles table for onboarding state
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('onboarding_completed, onboarding_step')
        .eq('id', currentUser.id)
        .single();

      if (!profileErr && profile) {
        setOnboardingCompleted(!!profile.onboarding_completed);
        setOnboardingStep(profile.onboarding_step || 0);
        if (profile.onboarding_completed) {
          localStorage.setItem('audkit_onboarding_completed', 'true');
        }
      } else {
        // No profile row = new user = show onboarding
        setOnboardingCompleted(false);
        setOnboardingStep(0);
      }
    } catch (e) {
      // Table might not exist — check localStorage step
      const savedStep = localStorage.getItem('audkit_onboarding_step');
      if (savedStep !== null) {
        setOnboardingCompleted(false);
        setOnboardingStep(parseInt(savedStep));
      } else {
        // Truly new user with no local state
        setOnboardingCompleted(false);
      }
    }
  };

  const signUp = (email, password) => supabase.auth.signUp({ email, password });
  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password });
  const signOut = () => {
    localStorage.removeItem('audkit_onboarding_completed');
    localStorage.removeItem('audkit_onboarding_step');
    return supabase.auth.signOut();
  };
  const signInWithGoogle = () => supabase.auth.signInWithOAuth({ provider: 'google' });

  return (
    <AuthContext.Provider value={{
      user, isPremium, setIsPremium,
      onboardingCompleted, setOnboardingCompleted, onboardingStep, setOnboardingStep,
      signUp, signIn, signOut, signInWithGoogle, loading
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
