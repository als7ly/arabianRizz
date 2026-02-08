import { Link } from "@/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[url('/assets/images/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="container relative z-10 flex flex-col items-center text-center px-4 md:px-6">
          <div className="inline-flex items-center rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-sm text-purple-300 backdrop-blur-xl mb-8 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-purple-400 mr-2 animate-pulse"></span>
            v2.0 Now Live: Uncensored AI Wingman
          </div>
          <h1 className="h1-bold text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-purple-200 mb-6 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Stop Getting Rejected. <br />
            <span className="text-primary">Get Loved. Get Laid.</span>
          </h1>
          <p className="p-20-semibold text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            The only Uncensored AI Wingman that helps you navigate modern dating. Generate spicy replies, witty openers, and close the deal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-105">
                Start for Free
                <Icons.arrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 rounded-full border-white/10 hover:bg-white/5 backdrop-blur-sm transition-all hover:scale-105">
                See How It Works
              </Button>
            </Link>
          </div>

          {/* Mockup */}
          <div className="mt-20 relative w-full max-w-5xl aspect-[16/9] bg-white/5 rounded-xl border border-white/10 shadow-2xl overflow-hidden glass-card animate-fade-in-up flex items-center justify-center" style={{ animationDelay: "0.5s" }}>
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none z-10"></div>
             {/* Placeholder for Mockup */}
             <div className="text-center space-y-4 z-0">
                <Icons.sparkles className="h-16 w-16 text-primary mx-auto animate-pulse" />
                <p className="text-muted-foreground/50 text-xl font-bold uppercase tracking-widest">Interactive Demo Loading...</p>
             </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-y border-white/5 bg-black/20">
        <div className="container px-4 text-center">
            <p className="text-muted-foreground mb-8 text-sm uppercase tracking-widest font-semibold">Trusted by 10,000+ Kings Worldwide</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 text-muted-foreground">
                <div className="flex items-center gap-2 font-bold text-xl"><Icons.zap className="h-6 w-6" /> Tinder</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Icons.heart className="h-6 w-6" /> Bumble</div>
                <div className="flex items-center gap-2 font-bold text-xl"><Icons.globe className="h-6 w-6" /> Hinge</div>
            </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 relative">
        <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h2 className="h2-bold mb-6">Your unfair advantage in dating.</h2>
                <p className="p-18-medium text-muted-foreground">
                    Stop guessing what to say. Let our AI analyze the conversation and tell you exactly how to respond to get the date.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<Icons.chat className="h-8 w-8 text-primary" />}
                    title="Uncensored Chat"
                    description="No filters. No lectures. Just raw, effective advice and lines that actually work in the real world."
                />
                <FeatureCard
                    icon={<Icons.user className="h-8 w-8 text-white" />}
                    title="Persona Learning"
                    description="The AI learns your style, hobbies, and vibe to suggest dates you'd actually enjoy."
                />
                <FeatureCard
                    icon={<Icons.sparkles className="h-8 w-8 text-yellow-500" />}
                    title="Scenario Mode"
                    description="Stuck in a specific situation? Use our preset scenarios like 'Ghosted', 'First Date', or 'Late Night'."
                />
            </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-black/20 border-y border-white/5">
        <div className="container px-4 max-w-3xl mx-auto">
            <h2 className="h2-bold text-center mb-12">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
                <AccordionItem value="item-1" className="border border-white/10 rounded-xl px-6 bg-white/5">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">Is it really uncensored?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                        Yes. We use custom-tuned models that allow for spicy, flirty, and bold conversations that other AI assistants block. However, we strictly prohibit illegal content.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2" className="border border-white/10 rounded-xl px-6 bg-white/5">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">How does the "Persona" feature work?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                        You create a profile for the person you're chatting with (e.g., "Sarah from Hinge"). The AI remembers her details and tailoring its advice specifically to her vibe.
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3" className="border border-white/10 rounded-xl px-6 bg-white/5">
                    <AccordionTrigger className="text-lg font-medium hover:no-underline">Is there a free trial?</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4">
                        Yes! You get 20 free credits when you sign up to test the waters. No credit card required.
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
      </section>

      {/* CTA */}
       <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-purple-900/20 pointer-events-none"></div>
        <div className="container relative z-10 text-center px-4">
            <h2 className="h2-bold mb-8">Ready to change your dating life?</h2>
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-10 py-8 rounded-full bg-white text-purple-900 hover:bg-gray-100 shadow-xl transition-transform hover:scale-105 font-bold">
                Get Started Now - It's Free
              </Button>
            </Link>
            <p className="mt-6 text-sm text-muted-foreground">No credit card required for trial.</p>
        </div>
      </section>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="p-8 rounded-2xl glass-card hover:bg-white/10 transition-colors duration-300">
            <div className="mb-6 p-4 bg-white/5 rounded-xl w-fit border border-white/10">
                {icon}
            </div>
            <h3 className="h3-bold mb-4">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </div>
    )
}
