import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/supabase';
import { dbFetchAll, seedSampleData } from '../lib/data';
import { I } from '../components/Icons';

const AppDataCtx = createContext(null);

export function AppDataProvider({ user, children }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      await seedSampleData(db, user.id);
      const d = await dbFetchAll(db, user.id);
      setData(d);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user.id]);

  if (loading) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--bg)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', display: 'grid', placeItems: 'center', animation: 'loader-pulse 1.4s ease-in-out infinite' }}>
          <I.plane size={22} style={{ color: '#fff' }} />
        </div>
        <div style={{ fontSize: 13.5, color: 'var(--tx-3)', fontWeight: 500 }}>Loading workspace…</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--bg)', padding: 24 }}>
      <div className="card card-pad" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ color: 'var(--red)', fontWeight: 600, marginBottom: 8 }}>Erreur de connexion Supabase</div>
        <div style={{ fontSize: 12.5, color: 'var(--tx-3)', marginBottom: 16 }}>{error}</div>
        <button className="btn primary" style={{ width: '100%' }} onClick={load}>Réessayer</button>
      </div>
    </div>
  );

  return (
    <AppDataCtx.Provider value={{ ...data, refetch: load, user }}>
      {children}
    </AppDataCtx.Provider>
  );
}

export function useAppData() {
  return useContext(AppDataCtx) || {};
}
