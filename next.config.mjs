import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
<<<<<<< bolt-global-knowledge-index-9904550364947778686
    minimumCacheTTL: 604800, // 1 week
=======
    minimumCacheTTL: 604800, // Cache images for 1 week
>>>>>>> main
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
