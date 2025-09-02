export { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from './calendarHelpers';
export { formatCurrency, formatDate, calculateTotal, calculateTax } from './formatters';
export { getApiBaseUrl, getNetworkInfo, API_BASE_URL_EXAMPLES } from './networkConfig';

export const generateReceiptNumber = () => {
  return `RCP-${Date.now()}`;
};