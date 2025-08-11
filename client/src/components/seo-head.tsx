import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  tags?: string[];
}

export function SEOHead({
  title = "Anuj's Blog - Latest Trends in AI, Backend, Frontend & Hosting",
  description = "Discover the latest trends in AI/LLM, backend technologies, frontend frameworks, and hosting solutions. Technical blog by Anuj Mahajan featuring in-depth tutorials and insights.",
  image = "/og-image.jpg",
  url,
  type = "website",
  publishedTime,
  modifiedTime,
  author = "Anuj Mahajan",
  tags = []
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Create or update meta tags
    const updateMeta = (name: string, content: string, property?: string) => {
      const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement("meta");
        if (property) {
          meta.setAttribute("property", property);
        } else {
          meta.setAttribute("name", name);
        }
        document.head.appendChild(meta);
      }
      
      meta.setAttribute("content", content);
    };

    // Basic meta tags
    updateMeta("description", description);
    updateMeta("author", author);
    if (tags.length > 0) {
      updateMeta("keywords", tags.join(", "));
    }

    // Open Graph tags
    updateMeta("", title, "og:title");
    updateMeta("", description, "og:description");
    updateMeta("", type, "og:type");
    updateMeta("", image, "og:image");
    if (url) {
      updateMeta("", url, "og:url");
    }

    // Twitter Card tags
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
    updateMeta("twitter:image", image);

    // Article specific tags
    if (type === "article") {
      if (publishedTime) {
        updateMeta("", publishedTime, "article:published_time");
      }
      if (modifiedTime) {
        updateMeta("", modifiedTime, "article:modified_time");
      }
      updateMeta("", author, "article:author");
      tags.forEach(tag => {
        const meta = document.createElement("meta");
        meta.setAttribute("property", "article:tag");
        meta.setAttribute("content", tag);
        document.head.appendChild(meta);
      });
    }

    return () => {
      // Cleanup function to remove article tags when component unmounts
      if (type === "article") {
        const articleTags = document.querySelectorAll('meta[property="article:tag"]');
        articleTags.forEach(tag => tag.remove());
      }
    };
  }, [title, description, image, url, type, publishedTime, modifiedTime, author, tags]);

  return null;
}
