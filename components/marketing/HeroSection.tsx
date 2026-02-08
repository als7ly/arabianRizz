"use client";

import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-[0.02] pointer-events-none"></div>
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>

      <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-6">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-sm text-purple-300 backdrop-blur-xl mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
          v2.0 Now Live: Uncensored AI Wingman
        </motion.div>

        <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto"
        >
          Stop Getting Rejected. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-purple-400">
            Get Loved. Get Laid.
          </span>
        </motion.h1>

        <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The only Uncensored AI Wingman that helps you navigate modern dating. Generate spicy replies, witty openers, and close the deal.
        </motion.p>

        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20"
        >
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_30px_-5px_rgba(124,58,237,0.5)] transition-all hover:scale-105 font-semibold">
              Start for Free
              <Icons.arrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="#features">
            <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 h-14 rounded-full border-white/10 hover:bg-white/5 hover:text-white backdrop-blur-sm transition-all hover:scale-105">
              See How It Works
            </Button>
          </Link>
        </motion.div>

        {/* CSS Mockup */}
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative w-full max-w-4xl mx-auto rounded-xl border border-white/10 shadow-2xl bg-black/40 backdrop-blur-sm overflow-hidden"
        >
           <div className="absolute top-0 left-0 right-0 h-10 bg-white/5 border-b border-white/5 flex items-center px-4 gap-2">
               <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
               <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
           </div>
           <div className="pt-16 pb-8 px-4 md:px-12 flex flex-col gap-4">
                {/* Simulated Chat */}
                <div className="flex justify-start">
                    <div className="bg-zinc-800 text-zinc-300 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] text-sm md:text-base">
                        She just replied "lol okay" after I asked her out. What do I say? 😩
                    </div>
                </div>
                <div className="flex justify-end">
                    <div className="bg-primary text-white rounded-2xl rounded-br-none px-4 py-3 max-w-[80%] text-sm md:text-base shadow-lg shadow-primary/20">
                         <div className="flex items-center gap-2 mb-1 text-xs font-bold text-white/70">
                            <Sparkles size={12} /> WINGMAN AI
                         </div>
                        Here's a playful push-pull response: "Wow, contain your excitement. Should I take that as a 'hard to get' yes?"
                    </div>
                </div>
           </div>

           {/* Glow Effect */}
           <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-40 bg-primary/20 blur-[80px] rounded-full pointer-events-none"></div>
        </motion.div>

      </div>
    </section>
  );
}
