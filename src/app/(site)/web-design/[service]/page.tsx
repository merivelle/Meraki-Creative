import { notFound } from "next/navigation";
import { breadcrumbs, faqNode, graph, pageMetadata, pageNode, serviceNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { WebServicePage } from "@/components/site/WebServicePage";
import { WEB_SERVICES, webServiceByPath } from "@/content/web-design";

type Params = { params: Promise<{ service: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return WEB_SERVICES.map((s) => ({ service: s.path }));
}

const titleFor = (name: string) => {
  const cap = name.replace(/^\w/, (c) => c.toUpperCase());
  return `${cap} in Los Angeles | Meraki Creative`;
};
// e.g. "Actor website design in Los Angeles, from $650. Your headshots, reel, …"
const descriptionFor = (s: NonNullable<ReturnType<typeof webServiceByPath>>) =>
  `${s.name.replace(/ websites$/, "").replace(/^\w/, (c) => c.toUpperCase())} website design in Los Angeles, ${s.price.toLowerCase()}. ${s.card}`;

export async function generateMetadata({ params }: Params) {
  const s = webServiceByPath((await params).service);
  if (!s) return {};
  return pageMetadata({ path: `/web-design/${s.path}`, title: titleFor(s.name), description: descriptionFor(s) });
}

export default async function WebServiceRoute({ params }: Params) {
  const s = webServiceByPath((await params).service);
  if (!s) notFound();
  const path = `/web-design/${s.path}`;
  const title = titleFor(s.name);
  const description = descriptionFor(s);
  const faqs = s.faqs.map((f, i) => ({ id: `${s.key}-${i}`, scope: "web-design" as const, question: f.q, answer: f.a, sort: i }));

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", path, title, description),
        serviceNode(path, s.name.replace(/^\w/, (c) => c.toUpperCase()), "Website design", description),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Web Design", path: "/web-design" }, { name: s.name, path }]),
        faqNode(path, faqs),
      )} />
      <WebServicePage s={s} />
    </>
  );
}
