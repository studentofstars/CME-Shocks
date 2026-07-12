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

export default function App() {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    shockTypes: [],
    startDate: '',
    endDate: '',
    spacecraft: [],
  });

  useEffect(() => {
    loadAllData().then((data) => {
      setAllData(data);
      setLoading(false);
    });
  }, []);

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
      <Header />
      <main className="main-content">
        <FilterPanel filters={filters} onFilterChange={setFilters} />
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading shock data…</p>
          </div>
        ) : (
          <DataTable data={filteredData} />
        )}
      </main>
    </div>
  );
}
