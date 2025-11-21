import AsyncStorage from '@react-native-async-storage/async-storage';

const ACTIVITY_KEY = '@activity_last_interaction';
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Activity Tracker for monitoring user interactions
 * Implements 15-minute inactivity timeout
 */
class ActivityTracker {
  private static instance: ActivityTracker;
  private lastActivityTime: number = Date.now();
  private activityListeners: Array<() => void> = [];
  private inactivityListeners: Array<() => void> = [];
  private checkInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeActivity();
  }

  public static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  /**
   * Initialize activity tracking
   */
  private async initializeActivity(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ACTIVITY_KEY);
      if (stored) {
        this.lastActivityTime = parseInt(stored, 10);
      } else {
        this.lastActivityTime = Date.now();
        await this.saveActivity();
      }
    } catch (error) {
      console.error('Failed to initialize activity tracker:', error);
      this.lastActivityTime = Date.now();
    }
  }

  /**
   * Save last activity time to storage
   */
  private async saveActivity(): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVITY_KEY, this.lastActivityTime.toString());
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  }

  /**
   * Record user activity
   */
  public async recordActivity(): Promise<void> {
    this.lastActivityTime = Date.now();
    await this.saveActivity();
    
    // Notify activity listeners
    this.activityListeners.forEach(listener => listener());
  }

  /**
   * Get last activity time
   */
  public getLastActivityTime(): number {
    return this.lastActivityTime;
  }

  /**
   * Get time since last activity in milliseconds
   */
  public getTimeSinceLastActivity(): number {
    return Date.now() - this.lastActivityTime;
  }

  /**
   * Check if user has been inactive for too long
   */
  public isInactive(): boolean {
    return this.getTimeSinceLastActivity() >= INACTIVITY_TIMEOUT;
  }

  /**
   * Start monitoring for inactivity
   */
  public startMonitoring(onInactive: () => void): void {
    // Clear existing interval
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Add inactivity listener
    this.inactivityListeners.push(onInactive);

    // Check every minute
    this.checkInterval = setInterval(() => {
      if (this.isInactive()) {
        console.log('⏰ User inactive for 15 minutes - triggering logout');
        this.inactivityListeners.forEach(listener => listener());
        this.stopMonitoring();
      }
    }, 60 * 1000); // Check every minute
  }

  /**
   * Stop monitoring for inactivity
   */
  public stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.inactivityListeners = [];
  }

  /**
   * Add activity listener
   */
  public onActivity(listener: () => void): () => void {
    this.activityListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.activityListeners = this.activityListeners.filter(l => l !== listener);
    };
  }

  /**
   * Reset activity tracking
   */
  public async reset(): Promise<void> {
    this.lastActivityTime = Date.now();
    await this.saveActivity();
    this.stopMonitoring();
    this.activityListeners = [];
    this.inactivityListeners = [];
  }

  /**
   * Clear stored activity data
   */
  public async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVITY_KEY);
      this.stopMonitoring();
      this.activityListeners = [];
      this.inactivityListeners = [];
    } catch (error) {
      console.error('Failed to clear activity data:', error);
    }
  }
}

// Export singleton instance
export const activityTracker = ActivityTracker.getInstance();
