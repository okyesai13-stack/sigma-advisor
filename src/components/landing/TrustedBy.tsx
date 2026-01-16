import { Building2 } from "lucide-react";

const companies = [
  "Google",
  "Microsoft",
  "Amazon",
  "Meta",
  "Apple",
  "Netflix",
  "Spotify",
  "Uber",
];

const TrustedBy = () => {
  return (
    <section className="py-12 px-6 border-y border-border bg-muted/20">
      <div className="container mx-auto max-w-5xl">
        <p className="text-center text-sm text-muted-foreground mb-8 uppercase tracking-wider font-medium">
          Trusted by professionals at leading companies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {companies.map((company, index) => (
            <div
              key={company}
              className="flex items-center gap-2 text-muted-foreground/60 hover:text-foreground transition-colors duration-300 group animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Building2 className="w-5 h-5 group-hover:text-primary transition-colors" />
              <span className="font-semibold text-lg">{company}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;
