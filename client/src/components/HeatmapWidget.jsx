import { useState } from "react";
import "./HeatmapWidget.css";

function HeatmapWidget() {
  // Generate mock data for the last 12 weeks
  const weeks = 12;
  const daysPerWeek = 7;
  
  const generateMockData = () => {
    const data = [];
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < daysPerWeek; d++) {
        // Random intensity 0-4
        week.push(Math.floor(Math.random() * 5));
      }
      data.push(week);
    }
    return data;
  };

  const [heatmapData] = useState(generateMockData());
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May"];

  return (
    <div className="heatmap-widget">
      <div className="heatmap-header">
        <h3>Study Activity</h3>
        <span className="heatmap-total">342 Contributions</span>
      </div>

      <div className="heatmap-container">
        <div className="heatmap-months">
          {monthLabels.map((m, i) => <span key={i}>{m}</span>)}
        </div>
        
        <div className="heatmap-grid">
          {heatmapData.map((week, wIndex) => (
            <div key={`w-${wIndex}`} className="heatmap-column">
              {week.map((level, dIndex) => (
                <div 
                  key={`d-${wIndex}-${dIndex}`} 
                  className={`heatmap-cell level-${level}`}
                  title={`${level * 2} activities`}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="heatmap-legend">
          <span>Less</span>
          <div className="heatmap-cell level-0"></div>
          <div className="heatmap-cell level-1"></div>
          <div className="heatmap-cell level-2"></div>
          <div className="heatmap-cell level-3"></div>
          <div className="heatmap-cell level-4"></div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default HeatmapWidget;
