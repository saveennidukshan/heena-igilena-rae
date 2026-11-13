import { useEffect } from "react";

interface Props {
  title: string;
  description: string;
}

function setMeta(selector: string, attr: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [, name] = selector.match(/\[(?:name|property)="(.+)"\]/) ?? [];
    if (selector.includes("property")) el.setAttribute("property", name ?? "");
    else el.setAttribute("name", name ?? "");
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

/** Sets per-guest title/description at runtime. (Build-time prerender bakes these for crawlers.) */
export default function SEO({ title, description }: Props) {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
  }, [title, description]);

  return null;
}
