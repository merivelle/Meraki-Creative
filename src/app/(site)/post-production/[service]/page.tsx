import { notFound } from "next/navigation";
import { breadcrumbs, faqNode, graph, pageMetadata, pageNode, serviceNode } from "@/lib/seo";
import { JsonLd } from "@/components/site/JsonLd";
import { ServiceDetailPage } from "@/components/site/Services";
import { POST_AREA, POST_SERVICES, postServiceByPath } from "@/content/post-production";

type Params = { params: Promise<{ service: string }> };
type Service = NonNullable<ReturnType<typeof postServiceByPath>>;

export const dynamicParams = false;
export function generateStaticParams() {
  return POST_SERVICES.map((s) => ({ service: s.path }));
}

// "Demo Reel Edit" → "Demo Reel Editing"; "Social Cutdowns" stays as is.
const serviceTitle = (s: Service) => s.pkgName.replace(/ Edit$/, " Editing");
const titleFor = (s: Service) => `${serviceTitle(s)} in Los Angeles | Meraki Creative`;
// e.g. "Demo reel editing in Los Angeles, from $150. Your strongest moments, …"
const descriptionFor = (s: Service) =>
  `${serviceTitle(s).replace(/^(\w)(.*)$/, (_, a: string, b: string) => a + b.toLowerCase())} in Los Angeles, ${s.price.toLowerCase()}. ${s.card}`;

export async function generateMetadata({ params }: Params) {
  const s = postServiceByPath((await params).service);
  if (!s) return {};
  return pageMetadata({ path: `/post-production/${s.path}`, title: titleFor(s), description: descriptionFor(s) });
}

export default async function PostServiceRoute({ params }: Params) {
  const s = postServiceByPath((await params).service);
  if (!s) notFound();
  const path = `/post-production/${s.path}`;
  const title = titleFor(s);
  const description = descriptionFor(s);
  const faqs = s.faqs.map((f, i) => ({ id: `${s.key}-${i}`, scope: "post-production" as const, question: f.q, answer: f.a, sort: i }));

  return (
    <>
      <JsonLd data={graph(
        pageNode("WebPage", path, title, description),
        serviceNode(path, serviceTitle(s), "Video editing", description),
        breadcrumbs([{ name: "Home", path: "/" }, { name: "Post-Production", path: "/post-production" }, { name: serviceTitle(s), path }]),
        faqNode(path, faqs),
      )} />
      <ServiceDetailPage s={s} area={POST_AREA} />
    </>
  );
}
