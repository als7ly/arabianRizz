"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/navigation";
import { motion } from "framer-motion";
import { Icons } from "@/components/ui/icons";

export default function CTASection() {
    return (
        <section className="py-32 relative overflow-hidden bg-background">
            <div className="absolute inset-0 bg-purple-900/10 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container relative z-10 text-center px-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-8 tracking-tight">Ready to level up your dating life?</h2>
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                        Join thousands of men who are getting more dates, better connections, and more confidence.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/sign-up">
                            <Button size="lg" className="w-full sm:w-auto text-lg px-10 h-14 rounded-full bg-white text-black hover:bg-gray-200 shadow-xl transition-transform hover:scale-105 font-bold">
                                Get Started Now - It's Free
                            </Button>
                        </Link>
                    </div>
                    <p className="mt-6 text-sm text-muted-foreground">No credit card required for trial.</p>
                </motion.div>
            </div>
        </section>
    );
}
