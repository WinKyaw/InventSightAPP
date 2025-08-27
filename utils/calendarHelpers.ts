// Helper functions for calendar functionality
export const getSeasonalMultiplier = (month: number) => {
  if (month >= 11 || month <= 1) return 1.2; // Winter - higher sales
  if (month >= 5 && month <= 7) return 1.1; // Summer - good sales
  if (month >= 2 && month <= 4) return 0.9; // Spring - moderate
  return 1.0; // Fall - baseline
};

export const generateDailyActivities = (date: Date, sales: number, orders: number) => {
  const activities = [];
  const dayOfWeek = date.getDay();
  
  // Morning activities
  activities.push({
    time: '08:00',
    type: 'opening',
    description: 'Store opened for business',
    icon: 'storefront-outline'
  });
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
    activities.push({
      time: '08:30',
      type: 'delivery',
      description: 'Fresh bakery items delivered',
      icon: 'car-outline'
    });
  }
  
  // Peak hours
  if (orders > 40) {
    activities.push({
      time: '12:15',
      type: 'peak',
      description: 'Lunch rush - high customer volume',
      icon: 'people-outline'
    });
  }
  
  // Inventory activities
  if (Math.random() > 0.7) {
    activities.push({
      time: '14:30',
      type: 'inventory',
      description: 'Inventory restocked',
      icon: 'cube-outline'
    });
  }
  
  // Special events
  if (dayOfWeek === 5 && Math.random() > 0.6) { // Friday specials
    activities.push({
      time: '16:00',
      type: 'promotion',
      description: 'Friday special promotion launched',
      icon: 'pricetag-outline'
    });
  }
  
  // Closing
  activities.push({
    time: '20:00',
    type: 'closing',
    description: 'Store closed',
    icon: 'lock-closed-outline'
  });
  
  return activities;
};

export const generateTopItemsForDay = (sales: number) => {
  const baseItems = ['Coffee', 'Sandwich', 'Tea', 'Croissant', 'Muffin', 'Salad'];
  return baseItems.slice(0, 3).map((item, index) => ({
    name: item,
    sales: Math.floor(sales * (0.3 - index * 0.08)),
    quantity: Math.floor(sales * (0.05 - index * 0.01))
  }));
};