"use client";

import { navLinks } from "@/constants";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CreditBalance from "./CreditBalance";
import { Button } from "../ui/button";

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="sidebar fixed h-screen w-72 bg-white p-5 shadow-md hidden lg:flex flex-col overflow-auto">
      <div className="flex size-full flex-col gap-4">
        <Link href="/" className="flex items-center gap-2 mb-10">
           <h1 className="text-2xl font-bold text-purple-600">ArabianRizz</h1>
        </Link>

        <nav className="h-full flex-col justify-between md:flex md:gap-4">
          <SignedIn>
            <ul className="flex w-full flex-col items-start gap-2">
              {navLinks.map((link) => {
                const isActive = link.route === pathname;

                return (
                  <li key={link.route} className={`flex w-full justify-start rounded-full p-4 group transition-all ${
                    isActive ? 'bg-purple-600 text-white' : 'text-gray-700 hover:bg-purple-100'
                  }`}>
                    <Link className="flex gap-4 items-center w-full" href={link.route}>
                      {/* Placeholder for icon since assets are missing */}
                      <span className={`font-semibold ${isActive ? 'text-white' : 'text-gray-700'}`}>{link.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>

            <ul className="flex w-full flex-col items-start gap-2 mt-auto">
                <li className="w-full">
                  <CreditBalance />
                </li>
                <li className="flex items-center gap-2 p-4 cursor-pointer">
                    <UserButton afterSignOutUrl='/' showName />
                </li>
            </ul>
          </SignedIn>

          <SignedOut>
            <Button asChild className="button bg-purple-600 w-full rounded-full">
              <Link href="/sign-in">Login</Link>
            </Button>
          </SignedOut>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
