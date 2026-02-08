"use client";

import { navLinks } from "@/constants";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Link, usePathname } from "@/navigation";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import { Icons } from "../ui/icons";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  // Map icon strings to components
  const getIcon = (iconName: string) => {
    // @ts-ignore
    const Icon = Icons[iconName] || Icons.help;
    return Icon;
  };

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-white/10 bg-background/95 backdrop-blur-xl transition-transform lg:translate-x-0 hidden lg:flex flex-col">
      <div className="flex h-full flex-col px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2 mb-10 pl-2">
            <Icons.zap className="h-8 w-8 text-primary animate-pulse-glow" />
            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
              ArabianRizz
            </span>
        </Link>

        <nav className="flex-1 space-y-2">
          <SignedIn>
            <ul className="space-y-2">
              {navLinks.slice(0, 6).map((link) => {
                const isActive = link.route === pathname || (link.route !== '/dashboard' && pathname.startsWith(link.route));
                const IconComponent = getIcon(link.icon);

                return (
                  <li key={link.route}>
                    <Link
                      href={link.route}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/5",
                        isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-white border border-transparent"
                      )}
                    >
                      <IconComponent className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-white")} />
                      {t(link.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SignedIn>

          <SignedOut>
            <Button asChild className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
              <Link href="/sign-in">{t('login')}</Link>
            </Button>
          </SignedOut>
        </nav>

        <div className="mt-auto space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-purple-900/50 to-indigo-900/50 p-4 border border-white/5 shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-primary/20 rounded-lg">
                        <Icons.sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-white">Pro Plan</p>
                        <p className="text-xs text-muted-foreground">Get unlimited Rizz</p>
                    </div>
                </div>
                <Button size="sm" className="w-full bg-white text-purple-900 hover:bg-gray-100 font-bold shadow-md transition-transform hover:scale-105 relative z-10" asChild>
                    <Link href="/dashboard/credits">Upgrade Now</Link>
                </Button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5">
                <UserButton afterSignOutUrl="/" showName appearance={{
                    elements: {
                        userButtonBox: "flex flex-row-reverse",
                        userButtonOuterIdentifier: "text-white font-medium text-sm ml-0 mr-2",
                    }
                }} />
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
