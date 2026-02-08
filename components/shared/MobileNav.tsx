"use client"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { navLinks } from "@/constants"
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs"
import { Link, usePathname } from "@/navigation"
import { Button } from "../ui/button"
import { Icons } from "@/components/ui/icons"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

const MobileNav = () => {
  const pathname = usePathname();
  const t = useTranslations("Sidebar");

  const getIcon = (iconName: string) => {
    // @ts-ignore
    return Icons[iconName] || Icons.help;
  }

  return (
    <header className="fixed top-0 z-30 flex w-full items-center justify-between border-b border-white/5 bg-background/80 px-6 py-4 backdrop-blur-md lg:hidden">
      <Link href="/dashboard" className="flex items-center gap-2">
        <Icons.zap className="h-6 w-6 text-primary" />
        <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200">
            ArabianRizz
        </span>
      </Link>

      <Sheet>
        <SheetTrigger>
          <Icons.menu className="h-6 w-6 text-white" />
        </SheetTrigger>
        <SheetContent side="left" className="border-r border-white/10 bg-background/95 backdrop-blur-xl sm:w-72">
            <Link href="/dashboard" className="flex items-center gap-2 mb-8 px-4">
                <Icons.zap className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold tracking-tight text-white">
                    ArabianRizz
                </span>
            </Link>

            <nav className="flex flex-col gap-4">
                <SignedIn>
                    <ul className="flex flex-col gap-2">
                    {navLinks.map((link) => {
                        const isActive = link.route === pathname || (link.route !== '/dashboard' && pathname.startsWith(link.route));
                        const IconComponent = getIcon(link.icon);

                        return (
                        <li key={link.route}>
                            <Link
                                href={link.route}
                                className={cn(
                                    "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all hover:bg-white/5",
                                    isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-white border border-transparent"
                                )}
                            >
                                <IconComponent className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                {t(link.key)}
                            </Link>
                        </li>
                        )
                    })}
                    </ul>
                </SignedIn>

                <SignedOut>
                    <Button asChild className="w-full bg-primary text-white">
                        <Link href="/sign-in">Login</Link>
                    </Button>
                </SignedOut>
            </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}

export default MobileNav
