import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "How does the AI Career Advisor work?",
    answer:
      "Our AI analyzes your resume, skills, and career goals to provide personalized recommendations. It identifies skill gaps, suggests learning paths, and helps you prepare for interviews—all tailored to your unique background and aspirations.",
  },
  {
    question: "Is my data secure and private?",
    answer:
      "Absolutely. We use enterprise-grade encryption to protect your data. Your information is never shared with third parties, and you can delete your account and all associated data at any time.",
  },
  {
    question: "How long does it take to see results?",
    answer:
      "Many users start seeing actionable insights within minutes of uploading their resume. The full career roadmap, including learning recommendations and job matches, is typically generated within 24 hours.",
  },
  {
    question: "Can I use this for career transitions?",
    answer:
      "Yes! Our AI is specially designed to help with career transitions. It identifies transferable skills from your current role and maps out the shortest path to your desired career, including any upskilling needed.",
  },
  {
    question: "What industries does the AI support?",
    answer:
      "We support careers across technology, finance, healthcare, marketing, consulting, and many more industries. Our AI is trained on diverse career data to provide relevant guidance for most professional fields.",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes! You can start using the AI Career Advisor for free. Get your initial career analysis and recommendations at no cost. Premium features are available with our paid plans.",
  },
];

const FAQ = () => {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-4">
            <HelpCircle className="w-4 h-4" />
            Got Questions?
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about AI Career Advisor
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-card border border-border rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow data-[state=open]:shadow-lg data-[state=open]:border-primary/50"
            >
              <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline py-5">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
