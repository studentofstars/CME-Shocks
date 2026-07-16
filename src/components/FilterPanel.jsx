import React, { useState, useRef, useEffect } from 'react';
import './FilterPanel.css';

const SHOCK_TYPES = [
  { value: 'FF', label: 'FF — Fast Forward' },
  { value: 'FR', label: 'FR — Fast Reverse' },
  { value: 'SF', label: 'SF — Slow Forward' },
  { value: 'SR', label: 'SR — Slow Reverse' },
  { value: 'SFD', label: 'SFD — Slow Forward Discontinuity' },
  { value: 'SRD', label: 'SRD — Slow Reverse Discontinuity' },
];

const SPACECRAFT = [
  { value: 'AdityaL1', label: 'Aditya L1' },
  { value: 'WIND', label: 'WIND' },
  { value: 'SDO', label: 'SDO' },
  { value: 'SOHO', label: 'SOHO' },
];

function Dropdown({ id, label, icon, options, selected, onToggle, onSelectAll, onClearAll }) {
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
        {icon && <span className="dropdown-icon">{icon}</span>}
        <span className="dropdown-label">{summary}</span>
        <span className={`dropdown-chevron ${open ? 'rotated' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="dropdown-menu">
          {(onSelectAll || onClearAll) && (
            <div className="dropdown-actions">
              {onSelectAll && (
                <button type="button" onClick={onSelectAll} className="dropdown-action-btn">
                  Select All
                </button>
              )}
              {onClearAll && (
                <button type="button" onClick={onClearAll} className="dropdown-action-btn">
                  Clear All
                </button>
              )}
            </div>
          )}
          <div className="dropdown-options-list">
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
        </div>
      )}
    </div>
  );
}

function ConditionsDropdown({ parameters, conditions, onConditionsChange, onAutoSelectParameters }) {
  const [open, setOpen] = useState(false);
  const [localConditions, setLocalConditions] = useState({});
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Sync local state when dropdown opens
  useEffect(() => {
    if (open) {
      setLocalConditions({ ...conditions });
    }
  }, [open]);

  const updateLocal = (param, value) => {
    setLocalConditions((prev) => ({
      ...prev,
      [param]: value,
    }));
  };

  const handleApply = () => {
    // Only keep entries that have a non-empty value
    const cleaned = {};
    Object.entries(localConditions).forEach(([param, val]) => {
      if (val !== '' && val !== undefined) {
        cleaned[param] = val;
      }
    });
    // Auto-select parameters that have condition values
    if (onAutoSelectParameters) {
      onAutoSelectParameters(Object.keys(cleaned));
    }
    onConditionsChange(cleaned);
    setOpen(false);
  };

  const handleClear = () => {
    setLocalConditions({});
    onConditionsChange({});
    setOpen(false);
  };

  const activeCount = Object.values(conditions).filter(
    (v) => v !== '' && v !== undefined
  ).length;

  return (
    <div className="dropdown conditions-dropdown" ref={ref} id="filter-conditions">
      <button
        className={`dropdown-trigger ${open ? 'active' : ''} ${activeCount > 0 ? 'has-selection' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="dropdown-label">
          {activeCount > 0 ? `Conditions (${activeCount})` : 'Conditions'}
        </span>
        <span className={`dropdown-chevron ${open ? 'rotated' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="dropdown-menu conditions-menu">
          <div className="conditions-header">
            <span className="conditions-title">Filter by threshold (≥ value)</span>
            <div className="conditions-actions">
              <button type="button" className="conditions-btn conditions-btn-clear" onClick={handleClear}>
                Clear All
              </button>
              <button type="button" className="conditions-btn conditions-btn-apply" onClick={handleApply}>
                Apply
              </button>
            </div>
          </div>
          <div className="conditions-list">
            {parameters.map((param) => {
              const val = localConditions[param] || '';
              return (
                <div key={param} className="condition-row">
                  <span className="condition-param">{param}</span>
                  <div className="condition-inputs">
                    <input
                      type="number"
                      className="condition-input"
                      placeholder="≥ value"
                      value={val}
                      onChange={(e) => updateLocal(param, e.target.value)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function FilterPanel({
  filters,
  onFilterChange,
  selectedParameters = [],
  onParameterChange,
  allParameters = [],
  conditionParameters = [],
}) {
  const { shockTypes = [], startDate = '', endDate = '', spacecraft = [], conditions = {} } = filters;

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

  const toggleParameter = (val) => {
    const next = selectedParameters.includes(val)
      ? selectedParameters.filter((v) => v !== val)
      : [...selectedParameters, val];
    onParameterChange(next);
  };

  const handleConditionsChange = (newConditions) => {
    onFilterChange({ ...filters, conditions: newConditions });
  };

  // Map condition parameter names to the actual table column names they affect
  const CONDITION_TO_COLUMNS = {
    'V_sh': ['V_sh'],
    'B_1': ['B_1'],
    'B_2': ['B_2'],
    'Jump % (B)': ['B_1', 'B_2'],
    'V_1': ['V_1'],
    'V_2': ['V_2'],
    'Jump % (V)': ['V_1', 'V_2'],
    'den_1': ['den_1'],
    'den_2': ['den_2'],
    'Jump % (den)': ['den_1', 'den_2'],
    'T_1': ['T_1'],
    'T_2': ['T_2'],
    'Jump % (T)': ['T_1', 'T_2'],
    'M_A1': ['M_A1'],
    'M_A2': ['M_A2'],
    'M_ms1': ['M_ms1'],
    'M_ms2': ['M_ms2'],
  };

  const handleAutoSelectParameters = (conditionParams) => {
    // Collect all table column names that should be selected
    const columnsToSelect = new Set(selectedParameters);
    conditionParams.forEach((cp) => {
      const cols = CONDITION_TO_COLUMNS[cp] || [];
      cols.forEach((c) => columnsToSelect.add(c));
    });
    onParameterChange([...allParameters.filter((p) => columnsToSelect.has(p))]);
  };

  return (
    <section className="filter-panel" id="filter-panel">
      <Dropdown
        id="filter-shock-type"
        label="Shock Type"
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
        options={SPACECRAFT}
        selected={spacecraft}
        onToggle={toggleSpacecraft}
      />

      <Dropdown
        id="filter-parameters"
        label="Parameters"
        options={allParameters.map((p) => ({ value: p, label: p }))}
        selected={selectedParameters}
        onToggle={toggleParameter}
        onSelectAll={() => onParameterChange(allParameters)}
        onClearAll={() => onParameterChange([])}
      />

      <ConditionsDropdown
        parameters={conditionParameters}
        conditions={conditions}
        onConditionsChange={handleConditionsChange}
        onAutoSelectParameters={handleAutoSelectParameters}
      />

      <button className="quality-btn" id="filter-quality" title="Quality — coming soon">
        <span>Quality</span>
      </button>
    </section>
  );
}
