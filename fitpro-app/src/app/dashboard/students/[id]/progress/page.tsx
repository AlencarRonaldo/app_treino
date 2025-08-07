'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ProgressMetric {
  date: string;
  weight: number;
  bodyFat: number;
  muscleMass: number;
}

export default function StudentProgressPage() {
  const { id } = useParams();
  const [progressData, setProgressData] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      // TODO: Fetch real progress data from API based on student ID
      const mockProgress: ProgressMetric[] = [
        { date: '2025-06-01', weight: 78, bodyFat: 20, muscleMass: 35 },
        { date: '2025-07-01', weight: 77.5, bodyFat: 19.5, muscleMass: 35.5 },
        { date: '2025-08-01', weight: 77, bodyFat: 19, muscleMass: 36 },
      ];
      setProgressData(mockProgress);
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return <div className="p-8">Carregando dados de progresso...</div>;
  }

  if (progressData.length === 0) {
    return <div className="p-8">Nenhum dado de progresso encontrado para este aluno.</div>;
  }

  const dates = progressData.map(data => data.date);
  const weights = progressData.map(data => data.weight);
  const bodyFats = progressData.map(data => data.bodyFat);
  const muscleMasses = progressData.map(data => data.muscleMass);

  const weightChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Peso (kg)',
        data: weights,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const bodyFatChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Percentual de Gordura (%)',
        data: bodyFats,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      },
    ],
  };

  const muscleMassChartData = {
    labels: dates,
    datasets: [
      {
        label: 'Massa Muscular (kg)',
        data: muscleMasses,
        borderColor: 'rgb(53, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Relatório de Progresso do Aluno</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Evolução de Peso</h2>
          <Line data={weightChartData} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Evolução de Percentual de Gordura</h2>
          <Line data={bodyFatChartData} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Evolução de Massa Muscular</h2>
          <Line data={muscleMassChartData} />
        </div>
      </div>
    </div>
  );
}
