"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function FAQSection() {
    return (
        <section className="py-24 bg-zinc-900/30 border-y border-white/5">
            <div className="container px-4 max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
                <Accordion type="single" collapsible className="w-full space-y-4">
                    <AccordionItem value="item-1" className="border border-zinc-800 rounded-xl px-6 bg-zinc-900/50">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline hover:text-primary transition-colors">Is it really uncensored?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                            Yes. We use custom-tuned models that allow for spicy, flirty, and bold conversations that other AI assistants block. However, we strictly prohibit illegal content.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-2" className="border border-zinc-800 rounded-xl px-6 bg-zinc-900/50">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline hover:text-primary transition-colors">How does the "Persona" feature work?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                            You create a profile for the person you're chatting with (e.g., "Sarah from Hinge"). The AI remembers her details and tailoring its advice specifically to her vibe.
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="item-3" className="border border-zinc-800 rounded-xl px-6 bg-zinc-900/50">
                        <AccordionTrigger className="text-lg font-medium hover:no-underline hover:text-primary transition-colors">Is there a free trial?</AccordionTrigger>
                        <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                            Yes! You get 20 free credits when you sign up to test the waters. No credit card required.
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </section>
    );
}
