import { MAX_EMBED_IMAGE_URL_LENGTH } from "./constants.ts";

export function buildQuickChartUrl(daily: any[]): string {
  const labels = daily.map((point) => point.day.slice(5));
  const submissions = daily.map((point) => point.submissions);

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Daily Submissions",
          data: submissions,
          borderColor: "#a855f7",
          backgroundColor: "rgba(168,85,247,0.32)",
          borderWidth: 3,
          fill: true,
          tension: 0.34,
          pointRadius: 3,
          pointHoverRadius: 4,
          pointBackgroundColor: "#c084fc",
        },
      ],
    },
    options: {
      layout: {
        padding: 12,
      },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Daily Submission Trend",
          color: "#ece9ff",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#ddd6fe" },
          grid: { color: "rgba(167,139,250,0.16)" },
        },
        x: {
          ticks: { color: "#c4b5fd" },
          grid: { color: "rgba(167,139,250,0.08)" },
        },
      },
      backgroundColor: "#141025",
    },
  };

  const url = `https://quickchart.io/chart?width=1000&height=420&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  return url.length <= MAX_EMBED_IMAGE_URL_LENGTH ? url : "";
}

export function buildRealtimeQueueChartUrl(points: any[]): string {
  const labels = points.map((point) => {
    const date = new Date(point.at);
    return date.toISOString().slice(11, 16);
  });

  const pending = points.map((point) => point.pending);
  const total = points.map((point) => point.total);

  const chartConfig = {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Pending",
          data: pending,
          borderColor: "#d9480f",
          backgroundColor: "rgba(217,72,15,0.18)",
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
        {
          label: "Total",
          data: total,
          borderColor: "#0b7285",
          backgroundColor: "rgba(11,114,133,0.16)",
          fill: true,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 2,
        },
      ],
    },
    options: {
      layout: {
        padding: 12,
      },
      plugins: {
        legend: { display: true },
        title: {
          display: true,
          text: "Realtime Queue Trend",
          color: "#1f2937",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#374151" },
          grid: { color: "#e5e7eb" },
        },
        x: {
          ticks: { color: "#374151" },
          grid: { display: false },
        },
      },
      backgroundColor: "#fefce8",
    },
  };

  const url = `https://quickchart.io/chart?width=1000&height=340&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  return url.length <= MAX_EMBED_IMAGE_URL_LENGTH ? url : "";
}
