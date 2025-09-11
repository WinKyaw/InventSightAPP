import AsyncStorage from '@react-native-async-storage/async-storage';
import { Item } from '../types';
import { OCRItem, OCRHistoryEntry } from '../services/ocrService';

export interface MatchResult {
  matchedItems: Array<{ item: Item; confidence: number; ocrItem: OCRItem }>;
  unmatchedItems: OCRItem[];
  partialMatches: Array<{ item: Item; confidence: number; ocrItem: OCRItem }>;
}

export interface FuzzyMatchOptions {
  exactMatchThreshold: number;
  partialMatchThreshold: number;
  enableMyanmarMatching: boolean;
  enablePhoneticMatching: boolean;
}

class MyanmarTextUtils {
  private static readonly STORAGE_KEY = 'ocr_scan_history';
  private static readonly MAX_HISTORY_ENTRIES = 50;

  // Myanmar consonants and vowels for phonetic matching
  private static readonly MYANMAR_CONSONANTS = [
    'က', 'ခ', 'ဂ', 'ဃ', 'င', 'စ', 'ဆ', 'ဇ', 'ဈ', 'ဉ', 'ည',
    'တ', 'ထ', 'ད', 'ဓ', 'န', 'ပ', 'ဖ', 'ဗ', 'ဘ', 'မ',
    'ယ', 'ရ', 'လ', 'ဝ', 'သ', 'ဟ', 'ဠ', 'အ'
  ];

  private static readonly MYANMAR_VOWELS = [
    'ါ', 'ာ', 'ိ', 'ီ', 'ု', 'ူ', 'ေ', 'း', 'ံ', '့', '်'
  ];

  /**
   * Clean and normalize Myanmar text
   */
  static cleanMyanmarText(text: string): string {
    if (!text) return '';
    
    // Remove extra whitespace and normalize
    let cleaned = text.trim().replace(/\s+/g, ' ');
    
    // Remove common OCR artifacts
    cleaned = cleaned.replace(/[|\[\]{}()]/g, '');
    
    // Normalize Myanmar digits to regular digits
    const myanmarDigits = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
    const regularDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    
    for (let i = 0; i < myanmarDigits.length; i++) {
      cleaned = cleaned.replace(new RegExp(myanmarDigits[i], 'g'), regularDigits[i]);
    }
    
    return cleaned;
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  static calculateSimilarity(str1: string, str2: string): number {
    if (!str1 || !str2) return 0;
    
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1.0;
    
    const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= s2.length; j++) {
      for (let i = 1; i <= s1.length; i++) {
        const substitutionCost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }
    
    const maxLength = Math.max(s1.length, s2.length);
    return (maxLength - matrix[s2.length][s1.length]) / maxLength;
  }

  /**
   * Check if text contains Myanmar characters
   */
  static containsMyanmarText(text: string): boolean {
    const myanmarRange = /[\u1000-\u109F]/;
    return myanmarRange.test(text);
  }

  /**
   * Perform fuzzy matching between OCR items and inventory items
   */
  static performFuzzyMatching(
    ocrItems: OCRItem[],
    inventoryItems: Item[],
    options: Partial<FuzzyMatchOptions> = {}
  ): MatchResult {
    const defaultOptions: FuzzyMatchOptions = {
      exactMatchThreshold: 0.9,
      partialMatchThreshold: 0.6,
      enableMyanmarMatching: true,
      enablePhoneticMatching: true,
    };

    const config = { ...defaultOptions, ...options };
    const matchedItems: Array<{ item: Item; confidence: number; ocrItem: OCRItem }> = [];
    const partialMatches: Array<{ item: Item; confidence: number; ocrItem: OCRItem }> = [];
    const unmatchedItems: OCRItem[] = [];

    for (const ocrItem of ocrItems) {
      let bestMatch: { item: Item; confidence: number } | null = null;
      const cleanedOcrName = this.cleanMyanmarText(ocrItem.name);

      for (const inventoryItem of inventoryItems) {
        const cleanedInventoryName = this.cleanMyanmarText(inventoryItem.name);
        
        // Calculate multiple types of similarity
        const exactSimilarity = this.calculateSimilarity(cleanedOcrName, cleanedInventoryName);
        const partialSimilarity = this.calculatePartialSimilarity(cleanedOcrName, cleanedInventoryName);
        
        // Enhanced Myanmar-specific matching
        let myanmarSimilarity = 0;
        if (config.enableMyanmarMatching && 
            (this.containsMyanmarText(cleanedOcrName) || this.containsMyanmarText(cleanedInventoryName))) {
          myanmarSimilarity = this.calculateMyanmarSimilarity(cleanedOcrName, cleanedInventoryName);
        }

        // Take the best similarity score
        const confidence = Math.max(exactSimilarity, partialSimilarity, myanmarSimilarity);
        
        if (confidence > (bestMatch?.confidence || 0)) {
          bestMatch = { item: inventoryItem, confidence };
        }
      }

      // Categorize the match
      if (bestMatch) {
        if (bestMatch.confidence >= config.exactMatchThreshold) {
          matchedItems.push({ ...bestMatch, ocrItem });
        } else if (bestMatch.confidence >= config.partialMatchThreshold) {
          partialMatches.push({ ...bestMatch, ocrItem });
        } else {
          unmatchedItems.push(ocrItem);
        }
      } else {
        unmatchedItems.push(ocrItem);
      }
    }

    return { matchedItems, unmatchedItems, partialMatches };
  }

  /**
   * Calculate partial similarity (word-by-word matching)
   */
  private static calculatePartialSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    let matches = 0;
    let totalWords = Math.max(words1.length, words2.length);
    
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1.includes(word2) || word2.includes(word1) || this.calculateSimilarity(word1, word2) > 0.8) {
          matches++;
          break;
        }
      }
    }
    
    return matches / totalWords;
  }

  /**
   * Enhanced Myanmar-specific similarity calculation
   */
  private static calculateMyanmarSimilarity(str1: string, str2: string): number {
    // Remove Myanmar modifiers and focus on core consonants
    const core1 = this.extractMyanmarCore(str1);
    const core2 = this.extractMyanmarCore(str2);
    
    return this.calculateSimilarity(core1, core2);
  }

  /**
   * Extract core Myanmar consonants (simplified phonetic matching)
   */
  private static extractMyanmarCore(text: string): string {
    let core = '';
    for (const char of text) {
      if (this.MYANMAR_CONSONANTS.includes(char)) {
        core += char;
      }
    }
    return core;
  }

  /**
   * Save OCR scan to history
   */
  static async saveToHistory(historyEntry: Omit<OCRHistoryEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      const history = await this.getHistory();
      
      const newEntry: OCRHistoryEntry = {
        ...historyEntry,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
      };

      // Add to beginning and limit size
      const updatedHistory = [newEntry, ...history].slice(0, this.MAX_HISTORY_ENTRIES);
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Failed to save OCR history:', error);
    }
  }

  /**
   * Get OCR scan history
   */
  static async getHistory(): Promise<OCRHistoryEntry[]> {
    try {
      const historyJson = await AsyncStorage.getItem(this.STORAGE_KEY);
      return historyJson ? JSON.parse(historyJson) : [];
    } catch (error) {
      console.error('Failed to load OCR history:', error);
      return [];
    }
  }

  /**
   * Clear OCR scan history
   */
  static async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear OCR history:', error);
    }
  }

  /**
   * Parse price from Myanmar or English text
   */
  static parsePrice(text: string): number | null {
    // Clean the text first
    const cleaned = this.cleanMyanmarText(text);
    
    // Look for Myanmar price patterns
    const myanmarPricePattern = /(\d+)\s*ကျပ်/;
    const englishPricePattern = /(\d+)\s*(MMK|Kyat|K)/i;
    const numberPattern = /(\d+)/;
    
    let match = cleaned.match(myanmarPricePattern) || 
                cleaned.match(englishPricePattern) ||
                cleaned.match(numberPattern);
    
    if (match) {
      const price = parseInt(match[1]);
      return isNaN(price) ? null : price;
    }
    
    return null;
  }

  /**
   * Format Myanmar currency
   */
  static formatMyanmarCurrency(amount: number): string {
    return `${amount.toLocaleString()} ကျပ်`;
  }

  /**
   * Check if the text is likely a receipt item (has name and price)
   */
  static isLikelyReceiptItem(text: string): boolean {
    const cleaned = this.cleanMyanmarText(text);
    
    // Should have some text and a price indication
    const hasPrice = /(\d+)\s*(ကျပ်|MMK|Kyat|K)/i.test(cleaned);
    const hasName = cleaned.replace(/[\d\s\-=ကျပ်MMKKyat]/g, '').length > 2;
    
    return hasPrice && hasName;
  }
}

export default MyanmarTextUtils;