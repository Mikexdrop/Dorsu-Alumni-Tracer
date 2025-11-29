// EmploymentBarChart.js
// Simple monthly bar chart for employment reports (mock data)
import React from 'react';

const mockEmploymentData = [
  { month: 'Jan', count: 12 },
  { month: 'Feb', count: 18 },
  { month: 'Mar', count: 10 },
  { month: 'Apr', count: 15 },
  { month: 'May', count: 20 },
  { month: 'Jun', count: 17 },
  { month: 'Jul', count: 14 },
  { month: 'Aug', count: 19 },
  { month: 'Sep', count: 16 },
  { month: 'Oct', count: 13 },
  { month: 'Nov', count: 21 },
  { month: 'Dec', count: 11 }
];

function EmploymentBarChart() {
  const maxCount = Math.max(...mockEmploymentData.map(d => d.count));
  return (
    <div style={{ width: '100%', padding: 24, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #0001', margin: '32px 0' }}>
      <h3 style={{ marginBottom: 16 }}>Employment Reports (Monthly)</h3>
      <div style={{ display: 'flex', alignItems: 'flex-end', height: 200, gap: 8 }}>
        {mockEmploymentData.map((d, i) => (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{
              width: 24,
              height: `${(d.count / maxCount) * 160}px`,
              background: '#2196F3',
              borderRadius: 4,
              marginBottom: 8,
              transition: 'height 0.3s'
            }} />
            <span style={{ fontSize: 12, color: '#555' }}>{d.month}</span>
            <span style={{ fontSize: 12, color: '#888' }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmploymentBarChart;
