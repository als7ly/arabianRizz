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
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 border-r border-border bg-background transition-transform lg:translate-x-0 hidden lg:flex flex-col">
      <div className="flex h-full flex-col px-6 py-8">
        <Link href="/dashboard" className="flex items-center gap-2 mb-10 pl-2">
            <Icons.zap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight text-foreground">
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
                        "group flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all hover:bg-secondary",
                        isActive ? "bg-secondary text-primary" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <IconComponent className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
            <div className="rounded-xl bg-card border border-border p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex items-center gap-3 mb-3 relative z-10">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Icons.sparkles className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">Pro Plan</p>
                        <p className="text-xs text-muted-foreground">Get unlimited Rizz</p>
                    </div>
                </div>
                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-sm" asChild>
                    <Link href="/dashboard/credits">Upgrade Now</Link>
                </Button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary transition-colors cursor-pointer border border-transparent hover:border-border">
                <UserButton afterSignOutUrl="/" showName appearance={{
                    elements: {
                        userButtonBox: "flex flex-row-reverse",
                        userButtonOuterIdentifier: "text-foreground font-medium text-sm ml-0 mr-2",
                    }
                }} />
            </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
