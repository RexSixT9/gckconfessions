import { MAX_EMBED_IMAGE_URL_LENGTH } from "./constants.mjs";

export function buildQuickChartUrl(daily) {
  const labels = daily.map((point) => point.day.slice(5));
  const submissions = daily.map((point) => point.submissions);
  const published = daily.map((point) => point.published);

  const chartConfig = {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Submissions",
          data: submissions,
          backgroundColor: "#0b7285",
          borderColor: "#0b7285",
          borderWidth: 1,
        },
        {
          type: "line",
          label: "Published",
          data: published,
          borderColor: "#2f9e44",
          backgroundColor: "#2f9e44",
          borderWidth: 2,
          fill: false,
          tension: 0.32,
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
          text: "Confessions Per Day",
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
      backgroundColor: "#f8fafc",
    },
  };

  const url = `https://quickchart.io/chart?width=1000&height=420&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
  return url.length <= MAX_EMBED_IMAGE_URL_LENGTH ? url : "";
}

export function buildRealtimeQueueChartUrl(points) {
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
