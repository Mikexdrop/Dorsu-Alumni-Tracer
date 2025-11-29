import React from 'react';

const Sidebar = ({ activeSection, setActiveSection }) => (
  <div style={{
    width: 250,
    background: '#333',
    color: 'white',
    minHeight: '100vh',
    padding: '20px 0'
  }}>
    <h2 style={{ textAlign: 'center', marginBottom: 30 }}>Admin Panel</h2>
    <nav>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: 10 }}>
          <button
            onClick={() => setActiveSection('dashboard')}
            style={{
              width: '100%',
              padding: '15px 20px',
              background: activeSection === 'dashboard' ? '#4CAF50' : 'transparent',
              border: 'none',
              color: 'white',
              textAlign: 'left',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Dashboard
          </button>
        </li>
        {/* ...other sidebar items... */}
      </ul>
    </nav>
  </div>
);

export default Sidebar;
