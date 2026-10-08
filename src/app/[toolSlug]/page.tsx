import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { TOOLS_LIST, siteConfig } from "@/config/site";
import { ConverterWidget } from "@/components/ConverterWidget";
import { AdSlot } from "@/components/AdSlot";
import { ArrowRight, HelpCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ toolSlug: string }>;
}

export async function generateStaticParams() {
  return TOOLS_LIST.map((tool) => ({
    toolSlug: tool.slug,
  }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { toolSlug } = await params;
  const tool = TOOLS_LIST.find((t) => t.slug === toolSlug);

  if (!tool) {
    return { title: "Tool Not Found" };
  }

  const canonicalUrl = `${siteConfig.domain}/${tool.slug}`;

  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: tool.metaTitle,
      description: tool.metaDescription,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { toolSlug } = await params;
  const tool = TOOLS_LIST.find((t) => t.slug === toolSlug);

  if (!tool) {
    notFound();
  }

  const relatedTools = TOOLS_LIST.filter(
    (t) => t.category === tool.category && t.slug !== tool.slug
  ).slice(0, 4);

  const jsonLdWebApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.title,
    url: `${siteConfig.domain}/${tool.slug}`,
    applicationCategory: "UtilityApplication",
    operatingSystem: "All",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  const jsonLdBreadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteConfig.domain,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.title,
        item: `${siteConfig.domain}/${tool.slug}`,
      },
    ],
  };

  const jsonLdFaq =
    tool.faq && tool.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-10">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbs) }}
      />
      {jsonLdFaq && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
        />
      )}

      {/* Header Info */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {tool.h1}
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {tool.shortDescription}
        </p>
      </div>

      {/* Embedded Actual Converter Widget */}
      <ConverterWidget
        defaultTargetFormat={tool.defaultOutput}
        toolSlug={tool.slug}
      />

      {/* Ad #1: Below main converter widget */}
      <AdSlot placement="afterConverter" format="auto" />

      {/* How it works */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">How to Convert Files with {tool.title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tool.howItWorks.map((step, idx) => (
            <div key={idx} className="flex gap-4">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 font-bold text-sm">
                {idx + 1}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      {tool.faq && tool.faq.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 space-y-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-cyan-400" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {tool.faq.map((faq, i) => (
              <div key={i} className="border-b border-slate-800/60 pb-4">
                <h3 className="text-base font-semibold text-white mb-1">{faq.question}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Tools */}
      {relatedTools.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white">Related Conversion Tools</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedTools.map((rel) => (
              <Link
                key={rel.slug}
                href={`/${rel.slug}`}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-cyan-500/50 hover:bg-slate-900"
              >
                <span className="font-medium text-slate-200">{rel.title}</span>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ad #2: Lower placement before footer */}
      <AdSlot placement="beforeFooter" format="auto" />
    </div>
  );
}
