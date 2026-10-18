const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

const priceFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  year: "numeric",
  month: "short",
});

const pointsFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: "exceptZero",
});

export function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return percentFormatter.format(value);
}

export function formatPrice(value, currencyCode) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${priceFormatter.format(value)} ${currencyCode ?? ""}`.trim();
}

export function formatUsd(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `US$ ${priceFormatter.format(value)}`;
}

export function formatDate(date) {
  if (!date) return "-";
  return dateFormatter.format(date);
}

export function formatOrdinal(rank) {
  if (rank === null || rank === undefined) return "-";
  return `${rank}º`;
}

export function formatPercentagePoints(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${pointsFormatter.format(value * 100)} p.p.`;
}
