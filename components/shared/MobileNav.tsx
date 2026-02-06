"use client";

import { useState } from "react";
import { usePathname, Link } from "@/navigation";
import { navLinks } from "@/constants";
import { Button } from "@/components/ui/button";
import { Menu, Home, User, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTranslations } from "next-intl";

const MobileNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("Sidebar");

  const iconMap: { [key: string]: any } = {
    home: Home,
    user: User,
    bookmark: Bookmark
  };

  return (
    <nav className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-white p-6 flex flex-col w-[80%] max-w-xs">
            <div className="mb-8">
                <Image src="/assets/images/logo-text.svg" alt="ArabianRizz" width={128} height={38} />
            </div>

            <div className="flex-1 flex flex-col gap-6">
                <ul className="flex flex-col gap-4">
                {navLinks.map((link) => {
                    const isActive = link.route === pathname;
                    const IconComponent = iconMap[link.icon] || Home;

                    return (
                    <li
                        key={link.route}
                        className={cn(
                            "p-16-semibold flex whitespace-nowrap text-dark-700",
                            isActive && "text-purple-600"
                        )}
                    >
                        <Link
                            className="flex w-full items-center gap-4 p-3"
                            href={link.route}
                            onClick={() => setIsOpen(false)}
                        >
                            <IconComponent className={cn("w-6 h-6", isActive ? "text-purple-600" : "text-gray-500")} />
                            {t(link.key)}
                        </Link>
                    </li>
                    );
                })}
                </ul>
            </div>

            <div className="border-t pt-6">
                <SignedIn>
                    <div className="flex items-center gap-4 p-3">
                        <UserButton afterSignOutUrl="/" />
                        <p className="p-14-medium">{t('profile')}</p>
                    </div>
                </SignedIn>
                <SignedOut>
                    <Button asChild className="button bg-purple-gradient bg-cover w-full">
                        <Link href="/sign-in">{t('login')}</Link>
                    </Button>
                </SignedOut>
            </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};

export default MobileNav;
