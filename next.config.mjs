import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    minimumCacheTTL: 604800, // Cache images for 1 week
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: ''
      },
      {
        protocol: 'https',
        hostname: 'oaidalleapiprodscus.blob.core.windows.net', // For DALL-E
        port: ''
      },
       {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For Mock Image
        port: ''
      }
    ]
  }
};

export default withNextIntl(nextConfig);
