import { Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background font-IBMPlex text-foreground">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
            <Icons.zap className="h-6 w-6 text-primary animate-pulse-glow" />
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              ArabianRizz
            </span>
          </Link>
          <nav className="flex items-center gap-4">
            <SignedOut>
              <Link href="/sign-in">
                <Button variant="ghost" className="text-muted-foreground hover:text-white hidden sm:inline-flex">
                  Log in
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95">
                  Get Started
                </Button>
              </Link>
            </SignedOut>
            <SignedIn>
                <Link href="/dashboard">
                    <Button variant="ghost" className="mr-2">Dashboard</Button>
                </Link>
                <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>
      <main className="flex-1 pt-16">
        {children}
      </main>
      <footer className="py-10 border-t border-white/5 bg-black/20 mt-auto">
          <div className="container text-center text-muted-foreground text-sm flex flex-col md:flex-row justify-between items-center px-4 gap-4">
            <p>© 2024 ArabianRizz. All rights reserved.</p>
            <div className="flex gap-4">
                <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            </div>
          </div>
      </footer>
    </div>
  );
}
