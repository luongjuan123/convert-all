import React from "react";
import Link from "next/link";
import { ConverterWidget } from "@/components/ConverterWidget";
import { AdSlot } from "@/components/AdSlot";
import { TOOLS_LIST } from "@/config/site";
import {
  FileText,
  FileCheck,
  Image as ImageIcon,
  Music,
  Video,
  Scissors,
  Minimize2,
  Combine,
  Smartphone,
  ShieldCheck,
  Zap,
  Lock,
  ArrowRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  FileCheck,
  Image: ImageIcon,
  Music,
  Video,
  Scissors,
  Minimize2,
  Combine,
  Smartphone,
};

export default function HomePage() {
  const popularTools = TOOLS_LIST.filter((t) => t.popular);

  return (
    <div className="relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Glow background effects */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-[600px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/20 to-indigo-600/10 blur-3xl" />

      {/* Hero Section */}
      <div className="mx-auto max-w-4xl text-center space-y-4 mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 backdrop-blur-md">
          <Zap className="h-3.5 w-3.5" /> 100% Free & Anonymous File Conversion
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Convert files online
        </h1>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Fast, simple, and private file conversion. Convert PDF, Images, Videos, Audio, and Office documents in seconds.
        </p>
      </div>

      {/* Core Universal Converter Widget */}
      <ConverterWidget />

      {/* Monetization Ad Slot - Max 1 Banner on Homepage */}
      <div className="mx-auto max-w-4xl">
        <AdSlot placement="homepageBottom" format="auto" />
      </div>

      {/* Features summary */}
      <div className="mx-auto max-w-5xl my-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Lock className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Private & Anonymous</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            No registration, no accounts, no paywalls. Your privacy is paramount.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Auto File Destruction</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Uploaded and converted files are automatically purged from our servers within 1 hour.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">High-Speed Engine</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Powered by modern serverless conversion workers for maximum processing efficiency.
          </p>
        </div>
      </div>

      {/* Popular Conversion Tools Grid */}
      <div className="mx-auto max-w-6xl my-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white">Popular Conversion Tools</h2>
          <p className="text-sm text-slate-400 mt-2">Select a specialized conversion tool below</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTools.map((tool) => {
            const IconComp = ICON_MAP[tool.iconName] || FileText;
            return (
              <Link
                key={tool.slug}
                href={`/${tool.slug}`}
                className="group relative flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 transition duration-300 hover:border-cyan-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-cyan-500/5"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-slate-800 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition duration-300">
                  <IconComp className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white group-hover:text-cyan-300 transition truncate">
                      {tool.title}
                    </h3>
                    <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition duration-300" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2">
                    {tool.shortDescription}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Tools Categorized */}
      <div className="mx-auto max-w-6xl my-16 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
        <h3 className="text-2xl font-bold text-white mb-6">All Available Converters</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {TOOLS_LIST.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${tool.slug}`}
              className="text-slate-300 hover:text-cyan-400 transition py-1 flex items-center gap-1.5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span className="truncate">{tool.title}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
