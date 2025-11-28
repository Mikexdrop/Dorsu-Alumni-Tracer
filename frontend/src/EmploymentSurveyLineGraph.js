// EmploymentSurveyLineGraph.js
// Modern line graph for alumni survey results with enhanced styling
import React, { useState } from 'react';

const mockSurveyData = [
  { month: 'Jan', score: 3.2 },
  { month: 'Feb', score: 3.8 },
  { month: 'Mar', score: 4.1 },
  { month: 'Apr', score: 3.7 },
  { month: 'May', score: 4.3 },
  { month: 'Jun', score: 4.0 },
  { month: 'Jul', score: 3.9 },
  { month: 'Aug', score: 4.2 },
  { month: 'Sep', score: 4.1 },
  { month: 'Oct', score: 3.6 },
  { month: 'Nov', score: 4.4 },
  { month: 'Dec', score: 4.0 }
];

function EmploymentSurveyLineGraph() {
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const maxScore = 5;
  const minScore = 3;
  const graphHeight = 160;
  
  // Generate smooth curve points
  const getPath = () => {
    const points = mockSurveyData.map((d, i) => {
      const x = (i / (mockSurveyData.length - 1)) * 320 + 40;
      const y = graphHeight - ((d.score - minScore) / (maxScore - minScore)) * graphHeight + 40;
      return [x, y];
    });

    // Create smooth curve using cubic bezier
    return points.reduce((path, point, i) => {
      if (i === 0) return `M ${point[0]},${point[1]}`;
      
      const prev = points[i - 1];
      const curr = point;
      const controlPoint1 = [prev[0] + (curr[0] - prev[0]) / 2, prev[1]];
      const controlPoint2 = [prev[0] + (curr[0] - prev[0]) / 2, curr[1]];
      
      return `${path} C ${controlPoint1[0]},${controlPoint1[1]} ${controlPoint2[0]},${controlPoint2[1]} ${curr[0]},${curr[1]}`;
    }, '');
  };

  // Get area path for gradient fill
  const getAreaPath = () => {
    return `${getPath()} L 360,200 L 40,200 Z`;
  };

  return (
    <div style={{ 
      width: '100%', 
      padding: 24, 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)', 
      borderRadius: 16, 
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)', 
      margin: '32px 0'
    }}>
      <h3 style={{ 
        marginBottom: 16, 
        color: '#2c3e50',
        fontSize: '1.2rem',
        fontWeight: 600 
      }}>Alumni Engagement Over Time (Last 12 Months)</h3>
      <svg width={400} height={240} style={{ 
        background: 'linear-gradient(180deg, #ffffff 0%, #f8f9ff 100%)', 
        borderRadius: 8,
        overflow: 'visible'
      }}>
        {/* Definitions for gradients */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line 
            key={i}
            x1={40} 
            y1={40 + (i * 40)} 
            x2={360} 
            y2={40 + (i * 40)} 
            stroke="#e2e8f0" 
            strokeDasharray="4 4"
          />
        ))}
        {mockSurveyData.map((d, i) => (
          <line 
            key={i}
            x1={(i / (mockSurveyData.length - 1)) * 320 + 40}
            y1={40}
            x2={(i / (mockSurveyData.length - 1)) * 320 + 40}
            y2={200}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill */}
        <path
          d={getAreaPath()}
          fill="url(#areaGradient)"
        />

        {/* Line graph */}
        <path
          d={getPath()}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive dots */}
        {mockSurveyData.map((d, i) => {
          const x = (i / (mockSurveyData.length - 1)) * 320 + 40;
          const y = graphHeight - ((d.score - minScore) / (maxScore - minScore)) * graphHeight + 40;
          const isHovered = hoveredPoint === i;
          return (
            <g key={d.month}>
              <circle
                cx={x}
                cy={y}
                r={isHovered ? 8 : 6}
                fill="#fff"
                stroke={isHovered ? "#3b82f6" : "#60a5fa"}
                strokeWidth={3}
                style={{ 
                  transition: 'all 0.2s ease-in-out',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
              {isHovered && (
                <g>
                  <rect
                    x={x - 30}
                    y={y - 35}
                    width={60}
                    height={25}
                    rx={4}
                    fill="#2c3e50"
                  />
                  <text
                    x={x}
                    y={y - 18}
                    fontSize={12}
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#fff"
                  >
                    {d.score.toFixed(1)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Month labels */}
        {mockSurveyData.map((d, i) => {
          const x = (i / (mockSurveyData.length - 1)) * 320 + 40;
          return (
            <text 
              key={d.month} 
              x={x} 
              y={220} 
              fontSize={12} 
              textAnchor="middle" 
              fill="#64748b"
              fontWeight="500"
            >
              {d.month}
            </text>
          );
        })}

        {/* Score labels */}
        {[3,3.5,4,4.5,5].map((score) => (
          <text 
            key={score} 
            x={35} 
            y={graphHeight - ((score - minScore) / (maxScore - minScore)) * graphHeight + 40} 
            fontSize={12} 
            textAnchor="end" 
            fill="#64748b"
            fontWeight="500"
          >
            {score.toFixed(1)}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default EmploymentSurveyLineGraph;
