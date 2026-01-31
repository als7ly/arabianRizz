"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "@/constants";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UserButton, SignedIn, SignedOut } from "@clerk/nextjs";

const MobileNav = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <nav className="md:hidden">
      <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Menu">
        <Menu className="h-6 w-6" />
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={toggleMenu}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={cn(
            "fixed top-0 right-0 h-full w-[80%] max-w-xs bg-white z-50 shadow-xl transition-transform transform duration-300 ease-in-out p-6 flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex justify-between items-center mb-8">
            <Image src="/assets/images/logo-text.svg" alt="logo" width={128} height={38} />
            <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Close menu">
                <X className="h-6 w-6" />
            </Button>
        </div>

        <div className="flex-1 flex flex-col gap-6">
            <ul className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const isActive = link.route === pathname;

                return (
                  <li
                    key={link.route}
                    className={cn(
                        "p-16-semibold flex whitespace-nowrap text-dark-700",
                        isActive && "text-purple-600"
                    )}
                  >
                    <Link className="flex w-full items-center gap-4 p-3" href={link.route} onClick={toggleMenu}>
                        <Image
                            src={link.icon}
                            alt="logo"
                            width={24}
                            height={24}
                        />
                      {link.label}
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
                    <p className="p-14-medium">My Account</p>
                </div>
            </SignedIn>
            <SignedOut>
                <Button asChild className="button bg-purple-gradient bg-cover w-full">
                    <Link href="/sign-in">Login</Link>
                </Button>
            </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default MobileNav;
