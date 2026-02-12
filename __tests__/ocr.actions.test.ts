import { extractTextFromImage } from '@/lib/actions/ocr.actions';
import { auth } from "@clerk/nextjs";
import { ImageAnnotatorClient } from "@google-cloud/vision";

// Mocks
jest.mock("@clerk/nextjs", () => ({
  auth: jest.fn(),
}));

jest.mock("@google-cloud/vision", () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    textDetection: jest.fn(),
  })),
}));

describe('OCR Actions', () => {
  let mockTextDetection: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTextDetection = jest.fn();
    (ImageAnnotatorClient as unknown as jest.Mock).mockImplementation(() => ({
      textDetection: mockTextDetection,
    }));
  });

  it('should throw Unauthorized if user is not authenticated', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: null });

    await expect(extractTextFromImage('http://example.com/image.jpg'))
      .rejects
      .toThrow('Unauthorized');

    expect(mockTextDetection).not.toHaveBeenCalled();
  });

  it('should extract text successfully when authenticated', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

    const mockResult = [{
      textAnnotations: [{ description: 'Extracted Text' }]
    }];
    mockTextDetection.mockResolvedValue(mockResult);

    const result = await extractTextFromImage('http://example.com/image.jpg');

    expect(result).toBe('Extracted Text');
    expect(mockTextDetection).toHaveBeenCalledWith('http://example.com/image.jpg');
  });

  it('should return empty string if no text found', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

    const mockResult = [{
      textAnnotations: []
    }];
    mockTextDetection.mockResolvedValue(mockResult);

    const result = await extractTextFromImage('http://example.com/image.jpg');

    expect(result).toBe('');
  });

  it('should handle API errors gracefully (mock fallback)', async () => {
    (auth as jest.Mock).mockReturnValue({ userId: 'user_123' });

    mockTextDetection.mockRejectedValue(new Error('API Error'));

    const result = await extractTextFromImage('http://example.com/image.jpg');

    // Currently returns mock data on error
    expect(result).toContain('MOCK DATA (Fallback)');
  });
});
