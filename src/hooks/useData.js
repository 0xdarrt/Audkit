import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';
import { useAuth } from '../context/AuthContext';

export function useData() {
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [mRes, aRes] = await Promise.all([
        supabase.from('members').select('*').eq('user_id', user.id),
        // PostgREST automatically traverses the asset_members junction table when selecting members(*)
        supabase.from('assets').select('*, members(id, name, initials, avatar_color)').eq('user_id', user.id).order('maturity_date')
      ]);

      if (mRes.error) throw mRes.error;
      if (aRes.error) throw aRes.error;

      setMembers(mRes.data || []);
      setAssets(aRes.data || []);
      
      // Fetch expenses safely (won't crash if table doesn't exist yet)
      const eRes = await supabase.from('expenses').select('*').eq('user_id', user.id).order('date', { ascending: false });
      if (eRes.error) console.warn("Expenses table might not exist yet:", eRes.error);
      else setExpenses(eRes.data || []);
      
    } catch (err) {
      console.error("Error fetching data: ", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { members, assets, expenses, loading, reloadData: fetchData };
}
