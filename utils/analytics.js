export const getAnalyticsDateRange = (range) => {
  const today = new Date();

  // Normalize to local date at midnight.
  const toDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const fromDate = new Date(toDate);

  switch (range) {
    case "7d":
      fromDate.setDate(fromDate.getDate() - 6);
      break;

    case "30d":
      fromDate.setDate(fromDate.getDate() - 29);
      break;

    case "3m":
      fromDate.setMonth(fromDate.getMonth() - 3);
      fromDate.setDate(fromDate.getDate() + 1);
      break;

    case "1y":
      fromDate.setFullYear(fromDate.getFullYear() - 1);
      fromDate.setDate(fromDate.getDate() + 1);
      break;

    default:
      fromDate.setDate(fromDate.getDate() - 29);
      break;
  }

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  return {
    from: formatDate(fromDate),
    to: formatDate(toDate),
  };
};