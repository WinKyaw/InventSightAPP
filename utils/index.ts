export { getSeasonalMultiplier, generateDailyActivities, generateTopItemsForDay } from './calendarHelpers';
export { formatCurrency, formatDate, calculateTotal, calculateTax } from './formatters';

export const generateReceiptNumber = () => {
  return `RCP-${Date.now()}`;
};