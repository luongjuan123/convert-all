"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FileStack, Menu, X, ArrowRight } from "lucide-react";

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <FileStack className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-white">
            Convert<span className="text-cyan-400">All</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link href="/pdf-to-word" className="text-sm font-medium text-slate-300 hover:text-white transition">
            PDF Tools
          </Link>
          <Link href="/jpg-to-png" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Image Tools
          </Link>
          <Link href="/mp4-to-mp3" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Video & Audio
          </Link>
          <Link href="/word-to-pdf" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Office
          </Link>
          <Link href="/compress-pdf" className="text-sm font-medium text-slate-300 hover:text-white transition">
            Compress
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:from-blue-500 hover:to-indigo-500"
          >
            Start Converting <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-5 md:hidden">
          <nav className="flex flex-col gap-4">
            <Link
              href="/pdf-to-word"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-cyan-400"
            >
              PDF Tools
            </Link>
            <Link
              href="/jpg-to-png"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-cyan-400"
            >
              Image Tools
            </Link>
            <Link
              href="/mp4-to-mp3"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-cyan-400"
            >
              Video & Audio
            </Link>
            <Link
              href="/word-to-pdf"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-cyan-400"
            >
              Office Tools
            </Link>
            <Link
              href="/compress-pdf"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-slate-200 hover:text-cyan-400"
            >
              Compress Tools
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
};
