import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.warn('Goals fetch error:', err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (goalData) => {
    const { data, error } = await supabase.from('goals').insert([{
      ...goalData,
      user_id: user.id
    }]).select().single();
    if (error) throw error;
    await fetchGoals();
    return data;
  };

  const updateGoal = async (id, updates) => {
    const { error } = await supabase.from('goals').update(updates).eq('id', id);
    if (error) throw error;
    await fetchGoals();
  };

  const deleteGoal = async (id) => {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw error;
    await fetchGoals();
  };

  const getGoalProgress = async (goalId) => {
    const { data, error } = await supabase
      .from('assets')
      .select('amount')
      .eq('goal_id', goalId)
      .eq('user_id', user.id);
    if (error) return 0;
    return (data || []).reduce((sum, a) => sum + Number(a.amount), 0);
  };

  return { goals, loading, fetchGoals, createGoal, updateGoal, deleteGoal, getGoalProgress };
}
