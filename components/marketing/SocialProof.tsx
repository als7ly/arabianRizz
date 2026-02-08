"use client";

import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";

export default function SocialProof() {
    return (
        <section className="py-16 border-y border-white/5 bg-black/20">
            <div className="container px-4 text-center">
                <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="text-muted-foreground mb-10 text-xs font-bold uppercase tracking-[0.2em]"
                >
                    Trusted by 10,000+ Kings Worldwide
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700"
                >
                    <div className="flex items-center gap-2 font-bold text-2xl text-white"><Icons.zap className="h-6 w-6" /> Tinder</div>
                    <div className="flex items-center gap-2 font-bold text-2xl text-white"><Icons.heart className="h-6 w-6" /> Bumble</div>
                    <div className="flex items-center gap-2 font-bold text-2xl text-white"><Icons.globe className="h-6 w-6" /> Hinge</div>
                    <div className="flex items-center gap-2 font-bold text-2xl text-white"><Icons.messageCircle className="h-6 w-6" /> WhatsApp</div>
                </motion.div>
            </div>
        </section>
    )
}
