export { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from './calendarHelpers';
export { formatCurrency, formatDate, calculateTotal, calculateTax } from './formatters';
export { getApiBaseUrl, getNetworkInfo, API_BASE_URL_EXAMPLES } from './networkConfig';
export { showNetworkDiagnostics, logNetworkDiagnostics, testApiConnectivity, getNetworkSummary } from './networkDiagnostics';
export { default as MyanmarTextUtils } from './myanmarTextUtils';

export const generateReceiptNumber = () => {
  return `RCP-${Date.now()}`;
};