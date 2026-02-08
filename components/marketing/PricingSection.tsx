"use client";

import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "@/navigation";
import { motion } from "framer-motion";

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-background">
            <div className="container px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
                    <p className="text-muted-foreground">Start for free. Upgrade when you're ready to dominate.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Starter Pack */}
                    <PricingCard
                        title="Starter Pack"
                        price="$9.99"
                        description="For the casual dater needing a quick fix."
                        features={["100 Credits", "Uncensored Replies", "Basic Support"]}
                        buttonText="Get Started"
                        buttonVariant="outline"
                        delay={0.1}
                    />

                    {/* Pro Subscription */}
                    <PricingCard
                        title="Pro Wingman"
                        price="$29.99"
                        period="/month"
                        description="For the serious dater active on multiple apps."
                        features={["500 Credits / Month", "Daily Streak Bonus (2x)", "Priority Generation", "Unlimited Persona Storage", "Access to New Features"]}
                        buttonText="Subscribe & Save"
                        buttonVariant="default"
                        isPopular={true}
                        delay={0.2}
                    />

                    {/* Rizz God Pack */}
                    <PricingCard
                        title="Rizz God Pack"
                        price="$49.99"
                        description="Massive credit pack for power users."
                        features={["1000 Credits", "Never Expire", "VIP Support", "Profile Review (Beta)"]}
                        buttonText="Buy Credits"
                        buttonVariant="outline"
                        delay={0.3}
                    />
                </div>
            </div>
        </section>
    );
}

interface PricingCardProps {
    title: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant: "default" | "outline";
    isPopular?: boolean;
    delay?: number;
}

function PricingCard({ title, price, period, description, features, buttonText, buttonVariant, isPopular, delay }: PricingCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay }}
            className={`relative p-8 rounded-2xl border flex flex-col ${isPopular ? 'bg-zinc-900 border-primary shadow-2xl shadow-primary/10' : 'bg-background border-zinc-800'}`}
        >
            {isPopular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                    <Sparkles size={12} /> MOST POPULAR
                </div>
            )}
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-bold">{price}</span>
                {period && <span className="text-muted-foreground">{period}</span>}
            </div>
            <p className="text-muted-foreground text-sm mb-6">{description}</p>

            <div className="space-y-3 mb-8 flex-1">
                {features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <Check size={16} className="text-green-500 shrink-0" />
                        <span>{feature}</span>
                    </div>
                ))}
            </div>

            <Link href="/sign-up" className="w-full">
                <Button className="w-full" variant={buttonVariant === 'default' ? 'default' : 'outline'} size="lg">
                    {buttonText}
                </Button>
            </Link>
        </motion.div>
    )
}
