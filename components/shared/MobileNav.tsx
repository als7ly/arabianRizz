"use client"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navLinks } from "@/constants"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "../ui/button"
import CreditBalance from "./CreditBalance"
import { Menu } from "lucide-react"

const MobileNav = () => {
  const pathname = usePathname();

  return (
    <header className="flex justify-between items-center p-5 lg:hidden bg-white shadow-sm fixed top-0 w-full z-10">
      <Link href="/" className="flex items-center gap-2">
         <h1 className="text-xl font-bold text-purple-600">ArabianRizz</h1>
      </Link>

      <nav className="flex gap-2 items-center">
        <SignedIn>
          <UserButton afterSignOutUrl="/" />

          <Sheet>
            <SheetTrigger>
              <Menu className="w-8 h-8 text-gray-700" />
            </SheetTrigger>
            <SheetContent className="bg-white sm:w-64">
              <>
                <h1 className="text-2xl font-bold text-purple-600 mb-5">Menu</h1>

                <ul className="flex w-full flex-col items-start gap-4 mt-8">
                  {navLinks.map((link) => {
                    const isActive = link.route === pathname;

                    return (
                      <li
                        key={link.route}
                        className={`flex w-full justify-start rounded-full p-4 whitespace-nowrap ${
                          isActive ? 'bg-purple-600 text-white' : 'text-gray-700'
                        }`}
                      >
                        <Link className="flex gap-4 items-center w-full" href={link.route}>
                           {link.label}
                        </Link>
                      </li>
                    )
                  })}

                  <li className="mt-4 w-full">
                     <CreditBalance />
                  </li>
                </ul>
              </>
            </SheetContent>
          </Sheet>
        </SignedIn>

        <SignedOut>
            <Button asChild className="button bg-purple-600 rounded-full">
              <Link href="/sign-in">Login</Link>
            </Button>
        </SignedOut>
      </nav>
    </header>
  )
}

export default MobileNav
