"use client";

import { navLinks } from "@/constants";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import { Link, usePathname } from "@/navigation";
import { Button } from "../ui/button";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

const Sidebar = () => {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  return (
    <aside className="sidebar">
      <div className="flex size-full flex-col gap-4">
        <Link href="/" className="sidebar-logo">
          <Image src="/assets/images/logo-text.svg" alt="logo" width={180} height={28} />
        </Link>

        <nav className="sidebar-nav">
          <SignedIn>
            <ul className="sidebar-nav_elements">
              {navLinks.slice(0, 6).map((link) => {
                const isActive = link.route === pathname;

                return (
                  <li
                    key={link.route}
                    className={`sidebar-nav_element group ${
                      isActive ? "bg-purple-gradient text-white" : "text-gray-700"
                    }`}
                  >
                    <Link className="sidebar-link" href={link.route}>
                      <Image
                        src={link.icon}
                        alt=""
                        width={24}
                        height={24}
                        className={`${isActive && "brightness-200"}`}
                      />
                      {t(link.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <ul className="sidebar-nav_elements">
                <li className="flex-center cursor-pointer gap-2 p-4">
                    <UserButton afterSignOutUrl="/" showName />
                </li>
            </ul>
          </SignedIn>

          <SignedOut>
            <Button asChild className="button bg-purple-gradient bg-cover">
              <Link href="/sign-in">{t('login')}</Link>
            </Button>
          </SignedOut>

          <div className="mt-4">
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
