import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
