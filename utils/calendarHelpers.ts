import { ActivityItem } from '../services/api/config';

// Helper functions for calendar functionality
export const getSeasonalMultiplier = (month: number) => {
  if (month >= 11 || month <= 1) return 1.2; // Winter - higher sales
  if (month >= 5 && month <= 7) return 1.1; // Summer - good sales
  if (month >= 2 && month <= 4) return 0.9; // Spring - moderate
  return 1.0; // Fall - baseline
};

export const generateDailyActivities = (date: Date, sales: number, orders: number): ActivityItem[] => {
  const activities: ActivityItem[] = [];
  const dateStr = date.toISOString().split('T')[0];
  
  // Morning activities
  activities.push({
    id: Date.now() + Math.random(),
    type: 'sale',
    productName: 'Store Opening',
    quantity: 1,
    timestamp: `${dateStr} 08:00:00`,
    userId: 'system',
    notes: 'Store opened for business'
  });
  
  const dayOfWeek = date.getDay();
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
    activities.push({
      id: Date.now() + Math.random(),
      type: 'restock',
      productName: 'Fresh Bakery Items',
      quantity: 20,
      timestamp: `${dateStr} 08:30:00`,
      userId: 'system',
      notes: 'Fresh bakery items delivered'
    });
  }
  
  // Peak hours
  if (orders > 40) {
    activities.push({
      id: Date.now() + Math.random(),
      type: 'sale',
      productName: 'Lunch Combo',
      quantity: Math.floor(orders * 0.3),
      timestamp: `${dateStr} 12:15:00`,
      userId: 'system',
      notes: 'Lunch rush - high customer volume'
    });
  }
  
  // Inventory activities
  if (Math.random() > 0.7) {
    activities.push({
      id: Date.now() + Math.random(),
      type: 'adjustment',
      productName: 'Inventory Items',
      quantity: Math.floor(Math.random() * 50),
      timestamp: `${dateStr} 14:30:00`,
      userId: 'system',
      notes: 'Inventory restocked'
    });
  }
  
  // Special events
  if (dayOfWeek === 5 && Math.random() > 0.6) { // Friday specials
    activities.push({
      id: Date.now() + Math.random(),
      type: 'sale',
      productName: 'Friday Special',
      quantity: Math.floor(sales * 0.1),
      timestamp: `${dateStr} 16:00:00`,
      userId: 'system',
      notes: 'Friday special promotion launched'
    });
  }
  
  return activities;
};

export const generateTopItemsForDay = (sales: number) => {
  const baseItems = ['Coffee', 'Sandwich', 'Tea', 'Croissant', 'Muffin', 'Salad'];
  return baseItems.slice(0, 3).map((item, index) => ({
    name: item,
    revenue: Math.floor(sales * (0.3 - index * 0.08)),
    quantity: Math.floor(sales * (0.05 - index * 0.01))
  }));
};