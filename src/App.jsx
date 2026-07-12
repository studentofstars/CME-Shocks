import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FilterPanel from './components/FilterPanel';
import DataTable from './components/DataTable';
import { loadAllData } from './utils/dataLoader';
import './App.css';

const SHOCK_TYPE_MAP = {
  FF: ['FF'],
  FR: ['FR'],
  SF: ['SF', 'SFD'],
  SR: ['SR', 'SRD'],
};

const PARAMETER_COLUMNS = [
  'V_sh', 'theta_1', 'theta_2', 'B_1', 'B_2', 'V_1', 'V_2',
  'den_1', 'den_2', 'T_1', 'T_2', 'M_A1', 'M_A2', 'M_ms1',
  'M_ms2', 'C_s1', 'C_s2', 'V_A1', 'V_A2', 'V_fms1', 'V_fms2',
  'V_sms1', 'V_sms2'
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


