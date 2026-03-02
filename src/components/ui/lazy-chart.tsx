'use client';
import React, { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load Chart.js components
const ChartComponent = lazy(() => import('./chartjs-wrapper'));

interface LazyChartProps {
  type: 'line' | 'bar' | 'radar';
  data: any;
  options?: any;
  height?: string;
  width?: string;
}

const LazyChart: React.FC<LazyChartProps> = ({ type, data, options, height = '400px', width = '100%' }) => {
  return (
    <Suspense 
      fallback={
        <div 
          style={{ height, width }} 
          className="flex items-center justify-center bg-gray-50 rounded-lg"
        >
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <ChartComponent 
        type={type} 
        data={data} 
        options={options} 
        height={height} 
        width={width} 
      />
    </Suspense>
  );
};

export default React.memo(LazyChart); 