'use client';
import React, { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'radar';
  data: ChartData<'line' | 'bar' | 'radar'>;
  options?: ChartOptions<'line' | 'bar' | 'radar'>;
  height?: string;
  width?: string;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({ 
  type, 
  data, 
  options, 
  height = '400px', 
  width = '100%' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    // Create new chart
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      chartRef.current = new ChartJS(ctx, {
        type,
        data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          ...options,
        },
      });
    }

    // Cleanup on unmount
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [type, data, options]);

  return (
    <div style={{ height, width }}>
      <canvas ref={canvasRef} />
    </div>
  );
};

export default ChartWrapper; 