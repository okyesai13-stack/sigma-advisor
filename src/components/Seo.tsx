import { useEffect } from "react";

const SITE_URL = "https://www.okesha.com";

const DEFAULTS = {
  title: "Planz — AI Business Strategy Agents",
  description:
    "Planz turns ideas into viable businesses with AI agents for market research, competitor analysis, business plans, and financial models.",
  ogDescription:
    "Multi-agent AI for market research, business plans, and financial modeling.",
};

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

const setMeta = (selector: string, attr: "content" | "href", value: string) => {
  const el = document.head.querySelector(selector);
  if (el) el.setAttribute(attr, value);
};

const Seo = ({ title, description, path, noindex = false }: SeoProps) => {
  useEffect(() => {
    const url = `${SITE_URL}${path}`;

    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);

    let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    let robots = document.head.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (noindex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.name = "robots";
        document.head.appendChild(robots);
      }
      robots.content = "noindex, nofollow";
    } else if (robots) {
      robots.remove();
    }

    return () => {
      document.title = DEFAULTS.title;
      setMeta('meta[name="description"]', "content", DEFAULTS.description);
      setMeta('meta[property="og:title"]', "content", DEFAULTS.title);
      setMeta('meta[property="og:description"]', "content", DEFAULTS.ogDescription);
      canonical?.remove();
      robots?.remove();
    };
  }, [title, description, path, noindex]);

  return null;
};

export default Seo;
