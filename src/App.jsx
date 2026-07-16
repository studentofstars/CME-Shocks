import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import DataTable from './components/DataTable';
import { loadAllData } from './utils/dataLoader';
import './App.css';

const SHOCK_TYPE_MAP = {
  FF: ['FF'],
  FR: ['FR'],
  SF: ['SF'],
  SR: ['SR'],
  SFD: ['SFD'],
  SRD: ['SRD'],
};

const PARAMETER_COLUMNS = [
  'V_sh', 'B_1', 'B_2', 'V_1', 'V_2',
  'den_1', 'den_2', 'T_1', 'T_2', 'M_A1', 'M_A2', 'M_ms1',
  'M_ms2', 'theta_1', 'theta_2', 'Shock Normal', 'V_A1', 'V_A2', 'V_fms1', 'V_fms2',
  'V_sms1', 'V_sms2'
];

const CONDITION_PARAMETERS = [
  'V_sh', 'B_1', 'B_2', 'Jump % (B)', 'V_1', 'V_2', 'Jump % (V)',
  'den_1', 'den_2', 'Jump % (den)', 'T_1', 'T_2', 'Jump % (T)',
  'M_A1', 'M_A2', 'M_ms1', 'M_ms2',
];

export default function App() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParameters, setSelectedParameters] = useState(PARAMETER_COLUMNS);
  const [filters, setFilters] = useState({
    shockTypes: [],
    startDate: '',
    endDate: '',
    spacecraft: [],
    conditions: {},
  });
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    loadAllData().then((data) => {
      setAllData(data);
      setLoading(false);
    });
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const filteredData = useMemo(() => {
    let result = allData;

    if (filters.shockTypes.length > 0) {
      const allowed = filters.shockTypes.flatMap((t) => SHOCK_TYPE_MAP[t] || [t]);
      result = result.filter((row) => allowed.includes(row['Shock Type']));
    }

    if (filters.startDate) {
      result = result.filter((row) => row.Date >= filters.startDate);
    }

    if (filters.endDate) {
      result = result.filter((row) => row.Date <= filters.endDate);
    }

    // Jump % computation helper for conditions filtering
    const JUMP_PAIRS = {
      'Jump % (B)': ['B_1', 'B_2'],
      'Jump % (V)': ['V_1', 'V_2'],
      'Jump % (den)': ['den_1', 'den_2'],
      'Jump % (T)': ['T_1', 'T_2'],
    };

    const getRowValue = (row, param) => {
      if (JUMP_PAIRS[param]) {
        const [col1, col2] = JUMP_PAIRS[param];
        const initial = parseFloat(row[col1]);
        const final_ = parseFloat(row[col2]);
        if (isNaN(initial) || isNaN(final_) || final_ === 0) return NaN;
        return ((final_ - initial) / final_) * 100;
      }
      return parseFloat(row[param]);
    };

    // Conditions filtering (single threshold >= value)
    const conditions = filters.conditions || {};
    Object.entries(conditions).forEach(([param, val]) => {
      if (val !== '' && val !== undefined) {
        const threshold = parseFloat(val);
        if (!isNaN(threshold)) {
          result = result.filter((row) => {
            const rowVal = getRowValue(row, param);
            return isNaN(rowVal) || rowVal >= threshold;
          });
        }
      }
    });

    return result;
  }, [allData, filters]);

  return (
    <div className="app">
      <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle Theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
      <Header />
      <main className="main-content">
        <FilterPanel
          filters={filters}
          onFilterChange={setFilters}
          selectedParameters={selectedParameters}
          onParameterChange={setSelectedParameters}
          allParameters={PARAMETER_COLUMNS}
          conditionParameters={CONDITION_PARAMETERS}
        />
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading shock data…</p>
          </div>
        ) : (
          <DataTable data={filteredData} selectedParameters={selectedParameters} />
        )}
      </main>
    </div>
  );
}


