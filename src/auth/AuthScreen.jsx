import { useState } from 'react';
import { db } from '../lib/supabase';
import { I } from '../components/Icons';
import { useT, useLang } from '../contexts/LangContext';

export default function AuthScreen({ onAuth }) {
  const t = useT();
  const { lang, setLang } = useLang();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [isErr, setIsErr] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg('');
    try {
      if (mode === 'login') {
        const { data, error } = await db.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuth(data.user);
      } else {
        const { data, error } = await db.auth.signUp({
          email, password,
          options: { data: { full_name: name, workspace_name: workspace || name + "'s Workspace" } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setIsErr(false);
          setMsg(lang === 'fr' ? 'Vérifiez votre e-mail pour confirmer votre compte.' : 'Check your email to confirm your account.');
        } else if (data.user) { onAuth(data.user); }
      }
    } catch (err) {
      setIsErr(true); setMsg(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', background: 'var(--bg)', padding: 20 }}>
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(140deg,var(--acc-2),var(--acc))', display: 'grid', placeItems: 'center', boxShadow: '0 6px 20px var(--acc-glow)' }}>
            <I.plane size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 720, letterSpacing: '-0.03em', color: 'var(--tx)' }}>Altitude <span style={{ color: 'var(--tx-4)' }}>One</span></div>
            <div style={{ fontSize: 11.5, color: 'var(--tx-4)', marginTop: 1 }}>Business OS</div>
          </div>
        </div>

        <div className="card card-pad">
          <div className="row" style={{ marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, letterSpacing: '-0.025em' }}>
                {mode === 'login' ? (lang === 'fr' ? 'Connexion' : 'Sign in') : (lang === 'fr' ? 'Créer un compte' : 'Create account')}
              </h2>
              <p style={{ margin: 0, color: 'var(--tx-3)', fontSize: 13 }}>
                {mode === 'login'
                  ? (lang === 'fr' ? 'Bienvenue. Vos données vous attendent.' : 'Welcome back. Your data is waiting.')
                  : (lang === 'fr' ? 'Gratuit pour commencer — toutes vos données en un endroit.' : 'Free to start — all your data in one place.')}
              </p>
            </div>
            <div className="row gap6" style={{ marginLeft: 'auto' }}>
              {['en','fr'].map(l => (
                <button key={l} onClick={() => setLang(l)}
                  style={{ fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, border: '1px solid var(--line-2)', cursor: 'pointer', background: lang === l ? 'var(--acc-soft)' : 'var(--panel-2)', color: lang === l ? 'var(--acc-2)' : 'var(--tx-3)' }}>
                  {l === 'en' ? 'EN' : 'FR'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mode === 'register' && <>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 550 }}>
                {t('auth_name')}
                <input className="set-input" placeholder="Jean Dupont" value={name} onChange={e => setName(e.target.value)} required />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 550 }}>
                {t('auth_workspace')}
                <input className="set-input" placeholder={t('auth_workspace_ph')} value={workspace} onChange={e => setWorkspace(e.target.value)} />
              </label>
            </>}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 550 }}>
              {t('auth_email')}
              <input className="set-input" type="email" placeholder="vous@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} required />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 550 }}>
              {t('auth_password')}
              <input className="set-input" type="password" placeholder="········" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </label>
            {msg && (
              <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 13, background: isErr ? 'var(--red-soft)' : 'var(--green-soft)', color: isErr ? 'var(--red)' : 'var(--green)' }}>{msg}</div>
            )}
            <button className="btn primary" type="submit" disabled={loading}
              style={{ width: '100%', height: 44, fontSize: 14, fontWeight: 600, marginTop: 4, borderRadius: 12 }}>
              {loading ? (lang === 'fr' ? 'En cours…' : 'Loading…') : mode === 'login' ? t('auth_login') : t('auth_register')}
            </button>
          </form>
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--tx-3)' }}>
            {mode === 'login' ? t('auth_no_acc') : t('auth_have')}{' '}
            <span style={{ color: 'var(--acc-2)', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMsg(''); }}>
              {mode === 'login' ? t('auth_create') : t('auth_signin')}
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11.5, color: 'var(--tx-4)' }}>
          {lang === 'fr' ? 'Données sécurisées par Supabase · RLS activé' : 'Secured by Supabase · Row Level Security enabled'}
        </div>
      </div>
    </div>
  );
}
