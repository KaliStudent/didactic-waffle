import { useState, useEffect } from 'react';

export const usePingSystem = (locations, projection, maxActive = 2) => {
  const [activePings, setActivePings] = useState([]);

  useEffect(() => {
    // We need to check if projection exists before starting interval logic
    if (!projection) return;

    const interval = setInterval(() => {
      setActivePings(prev => {
        if (prev.length < maxActive) {
            // Pick a random start and end point from our 50 locations
            const startLoc = locations[Math.floor(Math.random() * locations.length)];
            let endLoc = locations[Math.floor(Math.random() * locations.length)];
            
            // Ensure they aren't the same city
            while (endLoc === startLoc) {
              endLoc = locations[Math.floor(Math.random() * locations.length)];
            }
    
            const projectedStart = projection([startLoc.lng, startLoc.lat]);
            const projectedEnd = projection([endLoc.lng, endLoc.lat]);
    
            if (!projectedStart || !projectedEnd) {
                return prev;
            }
    
            const newPing = {
              id: Math.random(),
              start: { ...startLoc, x: projectedStart[0], y: projectedStart[1] },
              end: { ...endLoc, x: projectedEnd[0], y: projectedEnd[1] },
              progress: 0,
              status: 'rippling', 
              startTime: Date.now()
            };
    
            return [...prev, newPing];
        }
        return prev;
      });
    }, 2000); 

    return () => clearInterval(interval);
  }, [locations, maxActive, projection]);

  return { activePings, setActivePings };
};