import React, { useEffect, useRef } from "react";

function StepsTimeCharts() {
  // Example data (you can swap in real values after running your solvers)
  const bfSteps = 1200; // Brute Force steps
  const dfsSteps = 50; // DFS steps
  const bfTime = 5; // Brute Force time (ms)
  const dfsTime = 1.2; // DFS time (ms)

  // We'll draw two separate bar charts:
  // 1) StepsChart
  // 2) TimeChart

  const stepsCanvasRef = useRef(null);
  const timeCanvasRef = useRef(null);

  // === 1) Steps Chart ===
  useEffect(() => {
    const canvas = stepsCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // We'll have 2 bars: Brute Force (blue), DFS (green)
    const labels = ["Brute Force", "DFS+Backtracking"];
    const data = [bfSteps, dfsSteps];

    // Find max for scaling
    const maxValue = Math.max(...data);
    if (maxValue === 0) return;

    // Layout settings
    const margin = 60; // space around edges
    const chartW = canvas.width - margin * 2;
    const chartH = canvas.height - margin * 2;

    // We'll place each bar in the horizontal dimension
    const barCount = 2;
    const barSpacing = chartW / (barCount + 1);
    const barWidth = 40;

    // Colors
    const colors = ["rgba(54, 162, 235, 0.8)", "rgba(75, 192, 75, 0.8)"];

    // Helper: draw one bar
    function drawBar(xCenter, value, color) {
      const barMaxHeight = chartH - margin; // leave top margin
      const barHeight = (value / maxValue) * barMaxHeight;
      const x = xCenter - barWidth / 2;
      const y = canvas.height - margin - barHeight;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    // Draw each bar
    for (let i = 0; i < barCount; i++) {
      const barX = margin + (i + 1) * barSpacing;
      drawBar(barX, data[i], colors[i]);

      // Label below the bar
      ctx.fillStyle = "#000";
      ctx.font = "bold 14px sans-serif";
      const text = labels[i];
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, barX - textWidth / 2, canvas.height - 10);
    }

    // Chart title
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    const title = "Steps Comparison";
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, (canvas.width - titleWidth) / 2, 30);

    // Simple legend box in top-left
    // Blue
    ctx.fillStyle = colors[0];
    ctx.fillRect(margin, 40, 12, 12);
    ctx.fillStyle = "#000";
    ctx.font = "13px sans-serif";
    ctx.fillText("Brute Force", margin + 18, 50);
    // Green
    ctx.fillStyle = colors[1];
    ctx.fillRect(margin, 60, 12, 12);
    ctx.fillStyle = "#000";
    ctx.fillText("DFS+Backtracking", margin + 18, 70);
  }, [bfSteps, dfsSteps]);

  // === 2) Time Chart ===
  useEffect(() => {
    const canvas = timeCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Two bars: Brute Force (blue), DFS (green)
    const labels = ["Brute Force", "DFS+Backtracking"];
    const data = [bfTime, dfsTime];

    const maxValue = Math.max(...data);
    if (maxValue === 0) return;

    const margin = 60;
    const chartW = canvas.width - margin * 2;
    const chartH = canvas.height - margin * 2;

    const barCount = 2;
    const barSpacing = chartW / (barCount + 1);
    const barWidth = 40;

    const colors = ["rgba(54, 162, 235, 0.8)", "rgba(75, 192, 75, 0.8)"];

    function drawBar(xCenter, value, color) {
      const barMaxHeight = chartH - margin;
      const barHeight = (value / maxValue) * barMaxHeight;
      const x = xCenter - barWidth / 2;
      const y = canvas.height - margin - barHeight;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    for (let i = 0; i < barCount; i++) {
      const barX = margin + (i + 1) * barSpacing;
      drawBar(barX, data[i], colors[i]);

      // Label
      ctx.fillStyle = "#000";
      ctx.font = "bold 14px sans-serif";
      const text = labels[i];
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, barX - textWidth / 2, canvas.height - 10);
    }

    // Title
    ctx.fillStyle = "#000";
    ctx.font = "16px sans-serif";
    const title = "Time Comparison (ms)";
    const titleWidth = ctx.measureText(title).width;
    ctx.fillText(title, (canvas.width - titleWidth) / 2, 30);

    // Legend
    ctx.fillStyle = colors[0];
    ctx.fillRect(margin, 40, 12, 12);
    ctx.fillStyle = "#000";
    ctx.font = "13px sans-serif";
    ctx.fillText("Brute Force", margin + 18, 50);

    ctx.fillStyle = colors[1];
    ctx.fillRect(margin, 60, 12, 12);
    ctx.fillStyle = "#000";
    ctx.fillText("DFS+Backtracking", margin + 18, 70);
  }, [bfTime, dfsTime]);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>Compare Brute Force vs. DFS on Steps & Time</h2>
      <p>
        We display two separate bar charts side by side—one for steps and one
        for time.
        <br />
        Bars are <span style={{ color: "blue" }}>blue</span> for Brute Force,
        and <span style={{ color: "green" }}>green</span> for DFS.
      </p>

      <div style={{ display: "flex", gap: "2rem" }}>
        {/* Steps Chart */}
        <canvas
          ref={stepsCanvasRef}
          width={400}
          height={350}
          style={{ border: "1px solid #ccc" }}
        />

        {/* Time Chart */}
        <canvas
          ref={timeCanvasRef}
          width={400}
          height={350}
          style={{ border: "1px solid #ccc" }}
        />
      </div>

      {/* Show numeric results below */}
      <div style={{ marginTop: "1rem", lineHeight: "1.6" }}>
        <strong>Brute Force:</strong> {bfSteps} steps, {bfTime} ms
        <br />
        <strong>DFS+Backtracking:</strong> {dfsSteps} steps, {dfsTime} ms
      </div>
    </div>
  );
}

export default StepsTimeCharts;
