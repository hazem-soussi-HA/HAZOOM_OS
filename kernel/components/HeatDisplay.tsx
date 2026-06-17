// src/components/HeatDisplay.tsx

import { useState, useEffect } from 'react';
import { getHeatData } from '../services/heatService';

const HeatDisplay = () => {
  const [heat, setHeat] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHeat = async () => {
      try {
        const data = await getHeatData();
        setHeat(data.heat);
      } catch (err) {
        setError('Failed to load heat data.');
      }
    };

    fetchHeat();
    const interval = setInterval(fetchHeat, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold text-white mb-2">System Heat</h2>
      {error && <p className="text-red-500">{error}</p>}
      {heat !== null && !error && (
        <p className="text-green-400 text-2xl font-bold">{heat.toFixed(2)}°</p>
      )}
    </div>
  );
};

export default HeatDisplay;
