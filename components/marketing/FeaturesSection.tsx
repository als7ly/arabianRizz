"use client";

import { Icons } from "@/components/ui/icons";
import { motion } from "framer-motion";

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-background relative overflow-hidden">
            <div className="container px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Your unfair advantage.</h2>
                    <p className="text-lg text-muted-foreground">
                        Stop guessing what to say. Let our AI analyze the conversation and tell you exactly how to respond to get the date.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    <FeatureCard
                        icon={<Icons.chat className="h-8 w-8 text-primary" />}
                        title="Uncensored Chat"
                        description="No filters. No lectures. Just raw, effective advice and lines that actually work in the real world."
                        delay={0.1}
                    />
                    <FeatureCard
                        icon={<Icons.user className="h-8 w-8 text-white" />}
                        title="Persona Learning"
                        description="The AI learns your style, hobbies, and vibe to suggest dates you'd actually enjoy."
                        delay={0.2}
                    />
                    <FeatureCard
                        icon={<Icons.sparkles className="h-8 w-8 text-yellow-500" />}
                        title="Scenario Mode"
                        description="Stuck in a specific situation? Use our preset scenarios like 'Ghosted', 'First Date', or 'Late Night'."
                        delay={0.3}
                    />
                </div>
            </div>
        </section>
    );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className="p-8 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-primary/50 transition-colors duration-300 group"
        >
            <div className="mb-6 p-4 bg-zinc-800 rounded-xl w-fit group-hover:bg-primary/20 transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-4 text-white">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    )
}
