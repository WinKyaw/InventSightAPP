import { API_CONFIG, API_ENDPOINTS } from './api/config';

export interface OCRResult {
  extractedText: string;
  confidence: number;
  language: string;
  items?: OCRItem[];
}

export interface OCRItem {
  name: string;
  price: number;
  quantity: number;
}

export interface OCRConfig {
  language: 'myanmar' | 'english' | 'auto';
  imageType: 'receipt' | 'document' | 'general';
  preprocessImage: boolean;
  confidenceThreshold: number;
}

export interface OCRHistoryEntry {
  id: string;
  timestamp: string;
  imageUri?: string;
  extractedText: string;
  confidence: number;
  language: string;
  items: OCRItem[];
}

class OCRService {
  private static instance: OCRService;
  private readonly baseUrl: string;
  private readonly timeout: number;

  private constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  public static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  /**
   * Process image using OCR API
   */
  async processImage(
    imageUri: string,
    config: Partial<OCRConfig> = {}
  ): Promise<OCRResult> {
    const defaultConfig: OCRConfig = {
      language: 'myanmar',
      imageType: 'receipt',
      preprocessImage: true,
      confidenceThreshold: 0.7,
    };

    const ocrConfig = { ...defaultConfig, ...config };

    try {
      // Create form data for the image
      const formData = new FormData();
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri: imageUri,
        name: filename,
        type,
      } as any);

      // Add OCR parameters
      formData.append('language', ocrConfig.language);
      formData.append('imageType', ocrConfig.imageType);
      formData.append('preprocessImage', ocrConfig.preprocessImage.toString());
      formData.append('confidenceThreshold', ocrConfig.confidenceThreshold.toString());

      const endpoint = `${this.baseUrl}${API_ENDPOINTS.OCR.PROCESS}`;
      console.log('OCRService: Sending request to:', endpoint);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OCR API error: ${response.status} - ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'OCR processing failed');
      }

      return {
        extractedText: result.extractedText || '',
        confidence: result.confidence || 0,
        language: result.detectedLanguage || ocrConfig.language,
        items: result.items || [],
      };
    } catch (error) {
      console.error('OCRService: API call failed:', error);
      
      // Fallback to mock data for development/testing
      if (__DEV__) {
        return this.getMockOCRResult(ocrConfig.language);
      }
      
      throw error;
    }
  }

  /**
   * Process text-only OCR (for live scanning)
   */
  async processLiveText(
    text: string,
    language: 'myanmar' | 'english' | 'auto' = 'myanmar'
  ): Promise<OCRResult> {
    try {
      const endpoint = `${this.baseUrl}${API_ENDPOINTS.OCR.PROCESS_TEXT}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          text,
          language,
          type: 'live_scan',
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR text processing error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        extractedText: result.processedText || text,
        confidence: result.confidence || 0.9,
        language: result.detectedLanguage || language,
        items: result.items || [],
      };
    } catch (error) {
      console.error('OCRService: Text processing failed:', error);
      
      // Fallback for live text processing
      return {
        extractedText: text,
        confidence: 0.8,
        language,
        items: [],
      };
    }
  }

  /**
   * Get mock OCR result for development/testing
   */
  private getMockOCRResult(language: string): OCRResult {
    const mockReceiptTexts = {
      myanmar: `မြန်မာစာမေးပွဲ ဆိုင် ရေစာ့
---------------------
ကော်ဖီ              ၁၅၀၀ ကျပ်
နွေးကြော်ခြောက်        ၈၀၀ ကျပ်  
လက်ဖက်ရည်          ၆၀၀ ကျပ်
သုပ်                ၁၂၀၀ ကျပ်
---------------------
စုစုပေါင်း          ၄၁၀၀ ကျပ်`,
      
      english: `Coffee Shop Receipt
================
Coffee Premium    1500 MMK
Croissant         800 MMK  
Tea               600 MMK
Salad            1200 MMK
================
Total            4100 MMK`,
    };

    const selectedText = mockReceiptTexts[language as keyof typeof mockReceiptTexts] || mockReceiptTexts.english;
    
    return {
      extractedText: selectedText,
      confidence: 0.85,
      language: language === 'auto' ? 'myanmar' : language,
      items: this.extractItemsFromText(selectedText),
    };
  }

  /**
   * Extract items from text (basic parsing)
   */
  private extractItemsFromText(text: string): OCRItem[] {
    const lines = text.split('\n');
    const items: OCRItem[] = [];
    
    for (const line of lines) {
      // Skip dividers and headers
      if (line.includes('---') || line.includes('===') || 
          line.toLowerCase().includes('receipt') || 
          line.toLowerCase().includes('total') ||
          line.includes('စুစုပေါင်း')) {
        continue;
      }

      // Try to extract item name and price
      const myanmarPriceMatch = line.match(/(.+?)\s+(\d+)\s*ကျပ်/);
      const englishPriceMatch = line.match(/(.+?)\s+(\d+)\s*(MMK|Kyat)/i);
      
      if (myanmarPriceMatch || englishPriceMatch) {
        const match = myanmarPriceMatch || englishPriceMatch;
        const name = match![1].trim();
        const price = parseInt(match![2]);
        
        if (name.length > 2 && price > 0) {
          items.push({
            name: name.replace(/[^a-zA-Z0-9\u1000-\u109F\s]/g, '').trim(),
            price: price,
            quantity: 1
          });
        }
      }
    }
    
    return items;
  }
}

export default OCRService.getInstance();