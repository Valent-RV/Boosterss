export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") {
    return "Бюджет не вказано";
  }

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0
  }).format(Number(value));
};

export const formatShortDate = (value) => {
  if (!value) {
    return "Гнучка дата";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "short"
  }).format(new Date(value));
};

export const formatFullDate = (value) => {
  if (!value) {
    return "Без дедлайну";
  }

  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium"
  }).format(new Date(value));
};

export const formatMessageTime = (value) =>
  new Intl.DateTimeFormat("uk-UA", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));

export const formatMessageDay = (value) =>
  new Intl.DateTimeFormat("uk-UA", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(new Date(value));

export const truncateText = (value = "", maxLength = 120) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
};
