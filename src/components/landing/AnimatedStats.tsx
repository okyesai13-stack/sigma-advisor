import { useEffect, useState, useRef } from "react";

interface StatProps {
  value: string;
  label: string;
  suffix?: string;
  delay: number;
}

const AnimatedStat = ({ value, label, suffix = "", delay }: StatProps) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const timeout = setTimeout(() => {
      const duration = 2000;
      const steps = 60;
      const increment = numericValue / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
          setCount(numericValue);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, delay);

    return () => clearTimeout(timeout);
  }, [isVisible, numericValue, delay]);

  const displayValue = value.includes("K")
    ? `${Math.floor(count / 1000)}K+`
    : value.includes("%")
    ? `${count}%`
    : count.toString();

  return (
    <div ref={ref} className="text-center group">
      <div className="text-4xl md:text-5xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform duration-300">
        {isVisible ? displayValue : "0"}
        {suffix}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </div>
  );
};

const AnimatedStats = () => {
  const stats = [
    { value: "10000", label: "Career Paths", suffix: "+" },
    { value: "95", label: "Success Rate", suffix: "%" },
    { value: "50000", label: "Users Helped", suffix: "+" },
    { value: "24", label: "AI Support", suffix: "/7" },
  ];

  return (
    <section className="py-20 px-6 border-t border-border">
      <div className="container mx-auto max-w-5xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <AnimatedStat
              key={stat.label}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              delay={index * 200}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;
