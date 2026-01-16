import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager at Google",
    avatar: "SC",
    content:
      "This AI advisor completely transformed my career trajectory. I went from a junior analyst to a PM role at a top tech company within 8 months!",
    rating: 5,
  },
  {
    name: "Michael Roberts",
    role: "Data Scientist at Netflix",
    avatar: "MR",
    content:
      "The personalized learning path and interview prep were game-changers. I felt so confident going into my interviews.",
    rating: 5,
  },
  {
    name: "Priya Sharma",
    role: "AI Engineer at OpenAI",
    avatar: "PS",
    content:
      "The skill gap analysis helped me focus on exactly what I needed to learn. Best career investment I've ever made!",
    rating: 5,
  },
  {
    name: "James Wilson",
    role: "Business Analyst at Amazon",
    avatar: "JW",
    content:
      "From career confusion to dream job in just 6 months. The AI recommendations were spot-on for my background.",
    rating: 5,
  },
  {
    name: "Emily Zhang",
    role: "UX Designer at Apple",
    avatar: "EZ",
    content:
      "The resume optimization feature helped me highlight skills I didn't even know were valuable. Landed 5x more interviews!",
    rating: 5,
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 px-6 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Success Stories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands who transformed their careers with AI guidance
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {testimonials.map((testimonial, index) => (
              <CarouselItem
                key={index}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <div className="h-full p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all duration-300 group">
                  {/* Quote icon */}
                  <Quote className="w-8 h-8 text-primary/30 mb-4 group-hover:text-primary/50 transition-colors" />

                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.content}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <Avatar className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70">
                      <AvatarFallback className="text-primary-foreground font-semibold">
                        {testimonial.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">
                        {testimonial.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-4" />
          <CarouselNext className="hidden md:flex -right-4" />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
