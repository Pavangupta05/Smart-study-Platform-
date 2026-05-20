import { useMemo } from "react";
import { buildHeatmapFromActivity } from "../utils/studyGamification";
import "./HeatmapWidget.css";

function HeatmapWidget() {
  const { data: heatmapData, total, map } = useMemo(() => buildHeatmapFromActivity(12), []);
  const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May"];

  const tooltipFor = (wIndex, dIndex) => {
    const weeks = 12;
    const today = new Date();
    const dayOffset = (weeks - 1 - wIndex) * 7 + (6 - dIndex);
    const dte = new Date(today);
    dte.setDate(dte.getDate() - dayOffset);
    const key = dte.toISOString().slice(0, 10);
    const count = map[key] || 0;
    if (count === 0) return `No AI questions on ${key}`;
    return `You asked ${count} question${count === 1 ? "" : "s"} on ${key}`;
  };

  return (
    <div className="heatmap-widget">
      <div className="heatmap-header">
        <h3>Study Activity</h3>
        <span className="heatmap-total">{total} AI questions</span>
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
                  title={tooltipFor(wIndex, dIndex)}
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
