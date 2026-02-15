import { safeFetch } from "../../lib/security/safe-fetch";
import dns from 'dns';
import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';

jest.mock('dns');

describe('safeFetch', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should pass a validating lookup function to http.request', async () => {
        const reqMock = new EventEmitter();
        (reqMock as any).end = jest.fn();

        let capturedOptions: any;
        const requestMock = jest.fn((url, options, cb) => {
            capturedOptions = options;
            return reqMock;
        });

        jest.spyOn(http, 'request').mockImplementation(requestMock as any);

        // Start safeFetch
        const promise = safeFetch('http://example.com');

        expect(capturedOptions).toBeDefined();
        expect(capturedOptions.lookup).toBeDefined();

        // Test the lookup function directly
        const lookupFn = capturedOptions.lookup;
        const lookupCallback = jest.fn();

        // 1. Private IP check
        (dns.lookup as unknown as jest.Mock).mockImplementation((hostname, opts, cb) => {
            cb(null, '127.0.0.1', 4);
        });

        lookupFn('example.com', {}, lookupCallback);
        expect(lookupCallback).toHaveBeenCalledWith(expect.any(Error), '127.0.0.1', 4);
        expect(lookupCallback.mock.calls[0][0].message).toContain('Access to loopback address is denied');

        // 2. Public IP check
        lookupCallback.mockClear();
        (dns.lookup as unknown as jest.Mock).mockImplementation((hostname, opts, cb) => {
            cb(null, '93.184.216.34', 4);
        });

        lookupFn('example.com', {}, lookupCallback);
        expect(lookupCallback).toHaveBeenCalledWith(null, '93.184.216.34', 4);

        // Clean up
        reqMock.emit('error', new Error('Test end'));
        try { await promise; } catch (e) {}
    });

    it('should use https.request for https URLs', async () => {
        const reqMock = new EventEmitter();
        (reqMock as any).end = jest.fn();

        const requestMock = jest.fn((url, options, cb) => {
            return reqMock;
        });

        const httpsSpy = jest.spyOn(https, 'request').mockImplementation(requestMock as any);

        const promise = safeFetch('https://example.com');

        expect(httpsSpy).toHaveBeenCalled();

        reqMock.emit('error', new Error('Test end'));
        try { await promise; } catch (e) {}
    });

    it('should handle successful response', async () => {
        const reqMock = new EventEmitter();
        (reqMock as any).end = jest.fn();

        const requestMock = jest.fn((url, options, cb) => {
            // Simulate calling callback with response
            const resMock = new EventEmitter();
            (resMock as any).statusCode = 200;
            (resMock as any).statusMessage = 'OK';
            (resMock as any).headers = { 'content-type': 'text/plain' };

            // Invoke the callback passed to request
            cb(resMock);

            // Simulate data
            resMock.emit('data', Buffer.from('Hello World'));
            resMock.emit('end');

            return reqMock;
        });

        jest.spyOn(http, 'request').mockImplementation(requestMock as any);
        (dns.lookup as unknown as jest.Mock).mockImplementation((hostname, opts, cb) => {
             // We need to ensure lookup is called if we want to simulate full flow,
             // but here we mocked request to bypass it, or we rely on the fact that safeFetch passes lookup.
             // If we mock request, we replace the logic that CALLS lookup.
             // So safeFetch logic `request(..., lookup: ...)` is executed,
             // but our mock doesn't call `options.lookup`. This is fine for testing the response handling.
             cb(null, '93.184.216.34', 4);
        });

        const res = await safeFetch('http://example.com');

        expect(res.ok).toBe(true);
        expect(res.status).toBe(200);
        expect(await res.text()).toBe('Hello World');
        expect(res.headers.get('content-type')).toBe('text/plain');
    });
});
