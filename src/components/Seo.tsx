import { Helmet } from "react-helmet-async";

const SITE_URL = "https://www.okesha.com";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
}

const Seo = ({ title, description, path, noindex = false }: SeoProps) => {
  const url = `${SITE_URL}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default Seo;
