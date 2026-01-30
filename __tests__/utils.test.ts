import { cn, formUrlQuery, removeKeysFromQuery } from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle conditional classes', () => {
      expect(cn('bg-red-500', false && 'text-white')).toBe('bg-red-500');
    });

    it('should resolve tailwind conflicts', () => {
      expect(cn('p-4', 'p-2')).toBe('p-2');
    });
  });

  describe('formUrlQuery', () => {
    // Mock window.location
    const originalLocation = window.location;

    beforeAll(() => {
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { pathname: '/search' };
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it('should add a query param', () => {
      const result = formUrlQuery({
        searchParams: 'page=1',
        key: 'query',
        value: 'test',
      });
      expect(result).toBe('/search?page=1&query=test');
    });

    it('should update an existing query param', () => {
        const result = formUrlQuery({
          searchParams: 'page=1&query=old',
          key: 'query',
          value: 'new',
        });
        expect(result).toBe('/search?page=1&query=new');
      });
  });

  describe('removeKeysFromQuery', () => {
    // Mock window.location
    const originalLocation = window.location;

    beforeAll(() => {
      // @ts-ignore
      delete window.location;
      // @ts-ignore
      window.location = { pathname: '/search' };
    });

    afterAll(() => {
      window.location = originalLocation;
    });

    it('should remove specified keys', () => {
      const result = removeKeysFromQuery({
        searchParams: 'page=1&query=test&sort=asc',
        keysToRemove: ['query', 'sort'],
      });
      expect(result).toBe('/search?page=1');
    });
  });
});
