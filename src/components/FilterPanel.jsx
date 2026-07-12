import React, { useState, useRef, useEffect } from 'react';
import './FilterPanel.css';

const SHOCK_TYPES = [
  { value: 'FF', label: 'FF — Fast Forward' },
  { value: 'FR', label: 'FR — Fast Reverse' },
  { value: 'SF', label: 'SF — Slow Forward' },
  { value: 'SR', label: 'SR — Slow Reverse' },
];

const SPACECRAFT = [
  { value: 'AdityaL1', label: 'Aditya L1' },
  { value: 'WIND', label: 'WIND' },
  { value: 'SDO', label: 'SDO' },
  { value: 'SOHO', label: 'SOHO' },
];

function Dropdown({ id, label, icon, options, selected, onToggle }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const summary = selected.length === 0
    ? label
    : selected.length === options.length
      ? `All ${label}`
      : `${selected.length} selected`;

  return (
    <div className="dropdown" ref={ref} id={id}>
      <button
        className={`dropdown-trigger ${open ? 'active' : ''} ${selected.length > 0 ? 'has-selection' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="dropdown-icon">{icon}</span>
        <span className="dropdown-label">{summary}</span>
        <span className={`dropdown-chevron ${open ? 'rotated' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {options.map((opt) => (
            <label key={opt.value} className="dropdown-option">
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => onToggle(opt.value)}
              />
              <span className="checkmark"></span>
              <span className="option-text">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({ filters, onFilterChange }) {
  const { shockTypes = [], startDate = '', endDate = '', spacecraft = [] } = filters;

  const toggleShockType = (val) => {
    const next = shockTypes.includes(val)
      ? shockTypes.filter((v) => v !== val)
      : [...shockTypes, val];
    onFilterChange({ ...filters, shockTypes: next });
  };

  const toggleSpacecraft = (val) => {
    const next = spacecraft.includes(val)
      ? spacecraft.filter((v) => v !== val)
      : [...spacecraft, val];
    onFilterChange({ ...filters, spacecraft: next });
  };

  return (
    <section className="filter-panel" id="filter-panel">
      <Dropdown
        id="filter-shock-type"
        label="Shock Type"
        icon="⚡"
        options={SHOCK_TYPES}
        selected={shockTypes}
        onToggle={toggleShockType}
      />

      <div className="time-filter" id="filter-time-range">
        <div className="time-input-group">
          <label className="time-label">
            <span className="time-icon">🕐</span>
            <span>From</span>
          </label>
          <input
            type="date"
            className="time-input"
            value={startDate}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
          />
        </div>
        <span className="time-separator">→</span>
        <div className="time-input-group">
          <label className="time-label">
            <span>To</span>
          </label>
          <input
            type="date"
            className="time-input"
            value={endDate}
            onChange={(e) => onFilterChange({ ...filters, endDate: e.target.value })}
          />
        </div>
      </div>

      <Dropdown
        id="filter-spacecraft"
        label="Spacecraft"
        icon="🛰️"
        options={SPACECRAFT}
        selected={spacecraft}
        onToggle={toggleSpacecraft}
      />
    </section>
  );
}
