import http from 'http';
import https from 'https';
import { URL } from 'url';
import { validateIp } from './url-validator';
import dns from 'dns';

export interface SafeResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: {
        get(name: string): string | undefined;
    };
    text(): Promise<string>;
    json(): Promise<any>;
}

export async function safeFetch(urlStr: string, options: any = {}): Promise<SafeResponse> {
    let url: URL;
    try {
        url = new URL(urlStr);
    } catch (e) {
        throw new Error('Invalid URL');
    }

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Invalid protocol');
    }

    const lib = url.protocol === 'https:' ? https : http;

    return new Promise((resolve, reject) => {
        const req = lib.request(url, {
            ...options,
            lookup: (hostname, opts, cb) => {
                dns.lookup(hostname, opts, (err, address, family) => {
                    if (err) return cb(err, address, family);

                    try {
                        validateIp(address);
                        cb(null, address, family);
                    } catch (validationErr: any) {
                        cb(validationErr, address, family);
                    }
                });
            },
        }, (res) => {
             const chunks: Buffer[] = [];
             res.on('data', chunk => chunks.push(Buffer.from(chunk)));
             res.on('end', () => {
                 const bodyBuffer = Buffer.concat(chunks);
                 const bodyText = bodyBuffer.toString('utf-8');

                 resolve({
                     ok: !!(res.statusCode && res.statusCode >= 200 && res.statusCode < 300),
                     status: res.statusCode || 0,
                     statusText: res.statusMessage || '',
                     headers: {
                         get: (name: string) => {
                             const val = res.headers[name.toLowerCase()];
                             if (Array.isArray(val)) return val[0];
                             return val;
                         }
                     },
                     text: async () => bodyText,
                     json: async () => JSON.parse(bodyText)
                 });
             });
        });

        req.on('error', (err) => {
            reject(err);
        });

        if (options.signal) {
            if (options.signal.aborted) {
                req.destroy();
                reject(new Error('Aborted'));
            } else {
                options.signal.addEventListener('abort', () => {
                    req.destroy();
                    reject(new Error('Aborted'));
                });
            }
        }

        req.end();
    });
}
