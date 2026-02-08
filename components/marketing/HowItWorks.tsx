"use client";

import { motion } from "framer-motion";
import { Upload, Cpu, MessageCircle } from "lucide-react";

export default function HowItWorks() {
    const steps = [
        {
            icon: <Upload className="w-8 h-8 text-primary" />,
            title: "Upload Screenshot",
            description: "Take a screenshot of your chat or bio and upload it."
        },
        {
            icon: <Cpu className="w-8 h-8 text-primary" />,
            title: "AI Analysis",
            description: "Our engine analyzes the context, tone, and intent."
        },
        {
            icon: <MessageCircle className="w-8 h-8 text-primary" />,
            title: "Get The Reply",
            description: "Receive 3 uncensored, high-conversion replies instantly."
        }
    ];

    return (
        <section className="py-24 border-y border-white/5 bg-zinc-900/50">
            <div className="container px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
                    <p className="text-muted-foreground">Three steps to 10x your dating life.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connector Line (Desktop) */}
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent z-0"></div>

                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="relative z-10 flex flex-col items-center text-center"
                        >
                            <div className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-xl shadow-black/50">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-muted-foreground max-w-xs">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
