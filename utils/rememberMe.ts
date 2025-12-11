import AsyncStorage from '@react-native-async-storage/async-storage';

const REMEMBER_ME_KEY = 'remember_me_email';

/**
 * Save email for "Remember Me" feature
 */
export const saveRememberedEmail = async (email: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REMEMBER_ME_KEY, email);
    console.log('✅ Email saved for Remember Me');
  } catch (error) {
    console.error('❌ Failed to save email:', error);
  }
};

/**
 * Get remembered email
 */
export const getRememberedEmail = async (): Promise<string | null> => {
  try {
    const email = await AsyncStorage.getItem(REMEMBER_ME_KEY);
    console.log('📧 Remembered email:', email || 'None');
    return email;
  } catch (error) {
    console.error('❌ Failed to get remembered email:', error);
    return null;
  }
};

/**
 * Clear remembered email
 */
export const clearRememberedEmail = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REMEMBER_ME_KEY);
    console.log('✅ Remembered email cleared');
  } catch (error) {
    console.error('❌ Failed to clear email:', error);
  }
};
