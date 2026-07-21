import React from 'react';
import './TabBar.css';

const TABS = [
  { id: 'database', label: 'Database' },
  { id: 'log', label: 'Log' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'publication', label: 'Publication' },
  { id: 'contact', label: 'Contact' },
];

export default function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="tab-bar" id="main-tab-bar">
      <div className="tab-bar-inner">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-selected={activeTab === tab.id}
            role="tab"
          >
            <span className="tab-label">{tab.label}</span>
            {activeTab === tab.id && <span className="tab-active-indicator" />}
          </button>
        ))}
      </div>
    </nav>
  );
}
