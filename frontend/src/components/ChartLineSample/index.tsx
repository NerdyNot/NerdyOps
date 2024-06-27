import React from 'react';
import {
  Chart,
  LineElement,
  PointElement,
  LineController,
  LinearScale,
  CategoryScale,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

Chart.register(LineElement, PointElement, LineController, LinearScale, CategoryScale, Tooltip);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      display: true,
      title: {
        display: true,
        text: 'Usage (%)',
      },
    },
    x: {
      display: true,
      title: {
        display: true,
        text: 'Time',
      },
    },
  },
  plugins: {
    legend: {
      display: true,
    },
  },
};

const ChartLineSample = ({ data }) => {
  return <Line options={options} data={data} className="h-96" />;
};

export default ChartLineSample;