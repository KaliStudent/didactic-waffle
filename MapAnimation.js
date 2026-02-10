import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3'; 
// We are inlining the ping logic, so we import data directly
import locationsData from './locations.json';
import './CyberOverlay.css';

const drawPing = (ctx, ping) => {
  const { start, end, progress, status } = ping;
  
  // Elegant Modern Style
  ctx.shadowBlur = 15;
  ctx.shadowColor = 'rgba(59, 130, 246, 0.5)'; // Blue-500

  if (status === 'rippling' || status === 'target-ripple') {
    const center = status === 'rippling' ? start : end;
    const radius = progress * 25; 
    
    // Smooth fade out ripple
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(59, 130, 246, ${0.4 * (1 - progress)})`;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = `rgba(96, 165, 250, ${0.8 * (1 - progress)})`; // Blue-400
    ctx.lineWidth = 1;
    ctx.stroke();

    // Solid core dot
    ctx.beginPath();
    ctx.arc(center.x, center.y, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();

  } else if (status === 'shooting') {
    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    // Higher arc for better aesthetic
    const cpX = midX;
    const cpY = midY - (dist * 0.4); 

    const getBezierPoint = (t) => {
        const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * cpX + Math.pow(t, 2) * end.x;
        const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * cpY + Math.pow(t, 2) * end.y;
        return { x, y };
    };

    const currentPos = getBezierPoint(progress);

    // Draw Tail (Projectiles / Beam effect) - only draw recent history
    const tailLength = 0.15;
    const tailStartT = Math.max(0, progress - tailLength);
    const tailPos = getBezierPoint(tailStartT);

    // Create gradient for the beam
    const gradient = ctx.createLinearGradient(tailPos.x, tailPos.y, currentPos.x, currentPos.y);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0)'); // Fade out tail
    gradient.addColorStop(1, 'rgba(147, 197, 253, 1)'); // Bright head

    ctx.beginPath();
    ctx.moveTo(tailPos.x, tailPos.y);
    // Draw a simplified curve segment or just a straight line for the short beam? 
    // A quadratic curve segment is more accurate.
    // We can sample a few points for smoothness if needed, but a straight line for a short tail is often fine.
    // Let's try sampling one mid-point for the tail curvature.
    const midT = (tailStartT + progress) / 2;
    const midPos = getBezierPoint(midT);
    ctx.quadraticCurveTo(midPos.x, midPos.y, currentPos.x, currentPos.y);
    
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glowing Head
    ctx.beginPath();
    ctx.arc(currentPos.x, currentPos.y, 4, 0, 2 * Math.PI); // Larger head
    ctx.fillStyle = '#fff'; // White hot center
    ctx.shadowColor = '#60a5fa'; // Blue glow
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset
  }
};

const MapAnimation = () => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const [projection, setProjection] = useState(null);
  const [hoveredPing, setHoveredPing] = useState(null); 
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  // Use Ref for animation state to avoid React render cycle limits
  const pingsRef = useRef([]);

  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            setDimensions({ width: clientWidth, height: clientHeight });
        }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Setup Map & Projection
  useEffect(() => {
    const { width, height } = dimensions;
    const scale = width / 6.3; 
    const newProjection = d3.geoEquirectangular()
        .scale(scale)
        .translate([width / 2, height / 2]);
        
    setProjection(() => newProjection); 

    const path = d3.geoPath().projection(newProjection);

    // Draw Vector Map (Modern Clean)
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
      .then(data => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); 

        // 1. Sphere background (Oceans)
        svg.append("rect")
           .attr("width", width)
           .attr("height", height)
           .attr("fill", "transparent");

        // 2. Graticule
        const graticule = d3.geoGraticule();
        svg.append("path")
           .datum(graticule())
           .attr("d", path)
           .attr("fill", "none")
           .attr("stroke", "#475569")
           .attr("stroke-width", 0.3)
           .attr("stroke-opacity", 0.2);

        // 3. Landmasses
        svg.selectAll("path")
          .data(data.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("fill", "#334155") // Slate-700
          .attr("stroke", "#475569") // Slate-600
          .attr("stroke-width", 0.5);

        // 4. City Markers (Static)
        svg.selectAll("circle")
           .data(locationsData)
           .enter()
           .append("circle")
           .attr("cx", d => newProjection([d.lng, d.lat])[0])
           .attr("cy", d => newProjection([d.lng, d.lat])[1])
           .attr("r", 2)
           .attr("fill", "#94a3b8")
           .attr("opacity", 0.5);
      });
  }, [dimensions]); 

  // Ping System Logic (Interval)
  useEffect(() => {
    if (!projection) return;

    const spawnPing = () => {
       if (pingsRef.current.length < 3) { // Max 3 pings
          const startLoc = locationsData[Math.floor(Math.random() * locationsData.length)];
          let endLoc = locationsData[Math.floor(Math.random() * locationsData.length)];
          while (endLoc === startLoc) {
            endLoc = locationsData[Math.floor(Math.random() * locationsData.length)];
          }

          const projStart = projection([startLoc.lng, startLoc.lat]);
          const projEnd = projection([endLoc.lng, endLoc.lat]);

          if (projStart && projEnd) {
             const newPing = {
                id: Math.random(),
                start: { ...startLoc, x: projStart[0], y: projStart[1] },
                end: { ...endLoc, x: projEnd[0], y: projEnd[1] },
                progress: 0,
                status: 'rippling',
                startTime: Date.now()
             };
             pingsRef.current.push(newPing);
          }
       }
    };

    const interval = setInterval(spawnPing, 1500);
    return () => clearInterval(interval);
  }, [projection]);

  // Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const animate = () => {
      const { width, height } = dimensions;
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();

      // Process and Draw Pings
      // We iterate backwards to allow easy removal, or filter after
      pingsRef.current = pingsRef.current.map(p => {
          let newProgress = p.progress;
          let newStatus = p.status;
          let startTime = p.startTime;

          const elapsed = now - startTime;

          switch (p.status) {
            case 'rippling':
              newProgress = elapsed / 1000; 
              if (newProgress >= 1) {
                newStatus = 'shooting';
                newProgress = 0; 
                startTime = now; 
              }
              break;
            case 'shooting':
              newProgress = elapsed / 1500; 
              if (newProgress >= 1) {
                newStatus = 'target-ripple';
                newProgress = 0; 
                startTime = now; 
              }
              break;
            case 'target-ripple':
              newProgress = elapsed / 1000; 
              if (newProgress >= 1) {
                newStatus = 'completed'; 
              }
              break;
            default:
              newProgress = p.progress;
          }

          // Return updated ping
          return { ...p, progress: newProgress, status: newStatus, startTime };
      }).filter(p => p.status !== 'completed');

      // Draw all active pings
      pingsRef.current.forEach(p => drawPing(ctx, p));

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]); 

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check collision with static cities
    const hoveredCity = locationsData.find(city => {
        const coords = projection([city.lng, city.lat]);
        if (!coords) return false;
        const dx = x - coords[0];
        const dy = y - coords[1];
        return Math.sqrt(dx*dx + dy*dy) < 10;
    });

    if (hoveredCity) {
        setHoveredPing({
            start: hoveredCity,
            status: 'static', // New status for static hover
            // Mock some "datacenter" info
            datacenter: `DC-${hoveredCity.city.toUpperCase().substring(0,3)}-01`,
            provider: 'Global Backbone'
        });
        setTooltipPos({ x: e.clientX, y: e.clientY });
        canvasRef.current.style.cursor = 'pointer';
    } else {
        // Also check active pings if no city hovered (optional, but requested behavior implies static cities are main focus)
        // Let's clear if no city is hovered for now to keep it clean, or keep the ping logic?
        // User asked: "I also would like each city location to have a popup..." 
        // Let's prioritise cities.
        setHoveredPing(null);
        canvasRef.current.style.cursor = 'default';
    }
  };

  const handleCanvasClick = (e) => {
    // Keep click logic if needed, or remove if hover is sufficient. 
    // The user said "popup image and text window... at the dot". 
    // Usually hover is better for "popup at dot". 
    // Let's leave click for now as it doesn't hurt.
  };

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} style={{ position: 'absolute', top: 0, left: 0 }} />
      <canvas 
        ref={canvasRef} 
        width={dimensions.width} 
        height={dimensions.height} 
        style={{ position: 'absolute', top: 0, left: 0, cursor: 'default' }} 
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />
      
      {hoveredPing && (
        <div className={`ping-tooltip visible`} style={{ top: tooltipPos.y + 15, left: tooltipPos.x + 15 }}>
            <div className="ping-header">
                <span>{hoveredPing.status === 'static' ? hoveredPing.start.city : (hoveredPing.status === 'rippling' ? hoveredPing.start.city : hoveredPing.end.city)}</span>
                <span className="live-indicator" style={{background: hoveredPing.status === 'static' ? '#3b82f6' : '#10b981'}}></span>
            </div>
            <div className="ping-body">
                <div className="ping-row">
                    <span>IP Address</span>
                    <span className="ping-value">{hoveredPing.status === 'static' ? hoveredPing.start.ip : (hoveredPing.status === 'rippling' ? hoveredPing.start.ip : hoveredPing.end.ip)}</span>
                </div>
                {hoveredPing.status === 'static' ? (
                     <>
                        <div className="ping-row">
                            <span>Datacenter</span>
                            <span className="ping-value">{hoveredPing.datacenter}</span>
                        </div>
                        <div style={{marginTop: '10px', width: '100%', height: '120px', background: '#0f172a', borderRadius: '4px', border: '1px solid #334155', overflow: 'hidden', position: 'relative'}}>
                            <img 
                                src={`https://image.pollinations.ai/prompt/futuristic%20cyberpunk%20data%20center%20server%20room%20in%20${hoveredPing.start.city}%20neon%20lights?width=400&height=240&nologo=true`}
                                alt={`${hoveredPing.start.city} Node`}
                                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                onError={(e) => {e.target.src = 'https://image.pollinations.ai/prompt/generic%20cyberpunk%20server%20rack?width=400&height=240&nologo=true'}}
                            />
                            <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px', background: 'rgba(0,0,0,0.6)', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center'}}>
                                LIVE FEED SOURCE
                            </div>
                        </div>
                     </>
                ) : (
                    <div className="ping-row">
                        <span>Status</span>
                        <span className="ping-value">{hoveredPing.status}</span>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default MapAnimation;
