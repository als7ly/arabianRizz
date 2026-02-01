import { authMiddleware } from "@clerk/nextjs";
import createMiddleware from "next-intl/middleware";
 
const intlMiddleware = createMiddleware({
  locales: ['en', 'ar', 'fr', 'zh', 'ja', 'es', 'hi', 'pt', 'ru', 'de'],
  defaultLocale: 'en'
});
 
export default authMiddleware({
  beforeAuth: (req) => {
    // Execute next-intl middleware before Clerk's auth middleware
    return intlMiddleware(req);
  },
 
  // Ensure that the intl routes are public
  publicRoutes: ['/:locale/sign-in', '/:locale/sign-up', '/api/webhooks(.*)', '/api/uploadthing(.*)']
});
 
export const config = {
  // Match only internationalized pathnames
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)']
};
