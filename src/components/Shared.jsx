import { I } from './Icons';
import { TEAM, STATUS_META, fmtEUR, initials } from '../lib/data';

export const byId = (id) => TEAM.find(t => t.id === id) || TEAM[0];

export function Avatar({ who, size = 28, sm }) {
  const m = byId(who);
  const s = sm ? 26 : size;
  return (
    <div className={"avatar" + (sm ? " av-sm" : "")} title={m.name}
      style={{ width: s, height: s, background: m.color, fontSize: s * 0.4 }}>
      {initials(m.name)}
    </div>
  );
}

export function AvatarStack({ ids, max = 4 }) {
  const show = ids.slice(0, max);
  return (
    <div style={{ display: 'flex' }}>
      {show.map((id, i) => (
        <div key={id} style={{ marginLeft: i ? -8 : 0, border: '2px solid var(--panel)', borderRadius: 9, zIndex: max - i }}>
          <Avatar who={id} size={26} />
        </div>
      ))}
      {ids.length > max && (
        <div style={{ marginLeft: -8, width: 26, height: 26, borderRadius: 9, border: '2px solid var(--panel)',
          background: 'var(--panel-3)', display: 'grid', placeItems: 'center', fontSize: 10, color: 'var(--tx-2)', fontWeight: 600 }}>
          +{ids.length - max}
        </div>
      )}
    </div>
  );
}

export function PageHead({ title, sub, children }) {
  return (
    <div className="row" style={{ marginBottom: 22, gap: 16, alignItems: 'flex-start' }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 680, letterSpacing: '-0.03em' }}>{title}</h1>
        {sub && <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>{sub}</div>}
      </div>
      <div className="spacer" />
      <div className="row gap8">{children}</div>
    </div>
  );
}

export function Delta({ v, suffix, invert }) {
  if (v === 0) return <span className="delta flat">±0</span>;
  const up = invert ? v < 0 : v > 0;
  const Ic = v > 0 ? I.arrowUp : I.arrowDn;
  return (
    <span className={"delta " + (up ? "up" : "down")}>
      <Ic /> {Math.abs(v)}{suffix || '%'}
    </span>
  );
}

export function Pill({ status, text, kind }) {
  const meta = status ? STATUS_META[status] : null;
  return (
    <span className={"pill " + (kind || (meta ? meta.color : 'gray'))}>
      {meta && <span className="dot" style={{ background: meta.dot }} />}
      {text || status}
    </span>
  );
}

export function Money({ v, short, cls }) {
  return <span className={"num " + (cls || "")}>{fmtEUR(v, short)}</span>;
}

export function Seg({ options, value, onChange }) {
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o} className={value === o ? "on" : ""} onClick={() => onChange(o)}>{o}</button>
      ))}
    </div>
  );
}

export function Health({ h }) {
  const map = { good: ['var(--green)', 'Healthy'], watch: ['var(--amber)', 'Watch'], risk: ['var(--red)', 'At risk'] };
  const [c, lab] = map[h] || map.good;
  return (
    <span className="row gap8" style={{ fontSize: 12.5 }}>
      <span style={{ width: 8, height: 8, borderRadius: 50, background: c, boxShadow: `0 0 8px ${c}` }} />
      <span style={{ color: 'var(--tx-2)' }}>{lab}</span>
    </span>
  );
}

export function StatTile({ icon, color, label, value, note }) {
  const Ic = I[icon];
  return (
    <div className="kpi">
      <div className="kpi-top"><div className="kpi-ico" style={{ background: `var(${color}-soft)`, color: `var(${color})` }}><Ic size={18} /></div><span className="kpi-label">{label}</span></div>
      <div className="kpi-val num">{value}</div>
      <div className="kpi-foot"><span className="delta-note">{note}</span></div>
    </div>
  );
}
