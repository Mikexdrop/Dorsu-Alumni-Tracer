import React from 'react';

// MiniPieCard: renders a small animated donut + legend.
// Props:
// - data: array of { label, value, color? }
// - sourceMap: object map label->value (alternative to data)
// - fallback: array used when no data/sourceMap provided
// - animated: boolean (controls simple scale animation)
// - title: optional string (not rendered here; caller may render)
export default function MiniPieCard({ data, sourceMap, fallback, animated = true, colors }) {
  const COLORS = colors || ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#6366f1', '#ec4899', '#60a5fa', '#34d399', '#f97316'];

  let items = [];
  if (Array.isArray(data) && data.length) items = data.map(d => ({ label: d.label, value: Number(d.value || 0), color: d.color }));
  else if (sourceMap && typeof sourceMap === 'object') items = Object.entries(sourceMap).map(([k, v]) => ({ label: k, value: Number(v || 0) }));
  else if (Array.isArray(fallback)) items = fallback.map(d => ({ label: d.label, value: Number(d.value || 0), color: d.color }));

  if (!items || !items.length) items = [{ label: 'No data', value: 0 }];

  const total = items.reduce((s, it) => s + (it.value || 0), 0) || 1;
  let cumulative = 0;
  const cx = 80, cy = 80, r = 60;

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '6px 4px', flexWrap: 'wrap', minHeight: 180 }}>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ flex: '0 0 180px', width: 180, height: 180 }}>
        {items.map((d, i) => {
          const start = (cumulative / total) * Math.PI * 2;
          const end = ((cumulative + (d.value || 0)) / total) * Math.PI * 2;
          const large = end - start > Math.PI ? 1 : 0;
          const x1 = cx + r * Math.cos(start - Math.PI / 2);
          const y1 = cy + r * Math.sin(start - Math.PI / 2);
          const x2 = cx + r * Math.cos(end - Math.PI / 2);
          const y2 = cy + r * Math.sin(end - Math.PI / 2);
          const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
          cumulative += (d.value || 0);
          const scale = animated ? 1 : 0.001;
          const color = d.color || COLORS[i % COLORS.length];
          return <path key={i} d={path} fill={color} stroke="#fff" strokeWidth="1" style={{ transformOrigin: `${cx}px ${cy}px`, transform: `scale(${scale})`, transition: `transform 700ms ${80 * i}ms cubic-bezier(.2,.9,.3,1)` }} />;
        })}
        <circle cx={cx} cy={cy} r={28} fill="#fff" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="14" fontWeight={700} fill="#111827">{animated ? `${Math.round(((items[0] && items[0].value) || 0) / total * 100)}%` : ''}</text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: '1 1 220px', minWidth: 140, maxHeight: 180, overflowY: 'auto' }}>
        {items.map((item, idx) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 12, height: 12, background: item.color || COLORS[idx % COLORS.length], borderRadius: 3, display: 'inline-block' }} />
            <div style={{ fontSize: 13, color: '#111827' }}>{item.label} <span style={{ opacity: 0.66, fontSize: 12, marginLeft: 6 }}>{item.value}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}
