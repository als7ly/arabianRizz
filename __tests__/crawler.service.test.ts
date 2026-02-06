import { crawlUrl } from '@/lib/services/crawler.service';

// Mock global fetch
global.fetch = jest.fn();

describe('crawlUrl Security Tests', () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
  });

  it('should follow safe redirects', async () => {
    // 1. First call returns 302 to a safe URL
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({ Location: 'https://example.com/safe' }),
      } as Response)
      // 2. Second call returns 200 OK
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => '<html><title>Safe</title><body>Safe Content</body></html>',
      } as Response);

    const result = await crawlUrl('https://example.com/start');

    expect(result.chunks).toBeDefined();
    // The loop should have happened, so fetch called twice
    expect(global.fetch).toHaveBeenCalledTimes(2);
    // Note: We check specifically for manual redirect mode in the implementation
    expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://example.com/safe', expect.objectContaining({ redirect: 'manual' }));
  });

  it('should block redirects to localhost', async () => {
    // 1. First call returns 302 to localhost
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({ Location: 'http://localhost:3000/secret' }),
      } as Response);

    await expect(crawlUrl('https://example.com/start'))
      .rejects
      .toThrow('Access to localhost is denied');

    // Should NOT call fetch a second time (for the redirected URL)
    // It is called once for the initial request, then validates the redirect and fails
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should block redirects to private IP', async () => {
    // 1. First call returns 302 to private IP
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 302,
        headers: new Headers({ Location: 'http://192.168.1.1/admin' }),
      } as Response);

    await expect(crawlUrl('https://example.com/start'))
      .rejects
      .toThrow('Access to private IP range (192.168.0.0/16) is denied');

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('should limit the number of redirects', async () => {
      // Create a redirect loop or chain
      const mockFetch = global.fetch as jest.Mock;
      // Mock 6 redirects
      for(let i=0; i<6; i++) {
          mockFetch.mockResolvedValueOnce({
            ok: false,
            status: 302,
            headers: new Headers({ Location: `https://example.com/page${i}` }),
          } as Response);
      }

      await expect(crawlUrl('https://example.com/start'))
        .rejects
        .toThrow('Too many redirects');
  });
});
