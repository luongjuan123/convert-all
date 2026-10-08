import React from "react";
import Link from "next/link";
import { FileStack, ShieldCheck, Zap, Lock } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-4 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white">
                <FileStack className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-white">
                Convert<span className="text-cyan-400">All</span>
              </span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Fast, simple, and private online file conversion. Convert PDF, Image, Video, Audio, and Office documents for free without sign-up.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5 text-cyan-400" /> SSL Encrypted</span>
              <span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-cyan-400" /> Auto Delete</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Popular Tools</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/pdf-to-word" className="hover:text-cyan-400 transition">PDF to Word</Link></li>
              <li><Link href="/word-to-pdf" className="hover:text-cyan-400 transition">Word to PDF</Link></li>
              <li><Link href="/jpg-to-pdf" className="hover:text-cyan-400 transition">JPG to PDF</Link></li>
              <li><Link href="/heic-to-jpg" className="hover:text-cyan-400 transition">HEIC to JPG</Link></li>
              <li><Link href="/mp4-to-mp3" className="hover:text-cyan-400 transition">MP4 to MP3</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Converters</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/compress-pdf" className="hover:text-cyan-400 transition">Compress PDF</Link></li>
              <li><Link href="/merge-pdf" className="hover:text-cyan-400 transition">Merge PDF</Link></li>
              <li><Link href="/markdown-to-pdf" className="hover:text-cyan-400 transition">Markdown to PDF</Link></li>
              <li><Link href="/images-to-pdf" className="hover:text-cyan-400 transition">Images to PDF</Link></li>
              <li><Link href="/split-pdf" className="hover:text-cyan-400 transition">Split PDF</Link></li>
              <li><Link href="/compress-video" className="hover:text-cyan-400 transition">Compress Video</Link></li>
              <li><Link href="/wav-to-mp3" className="hover:text-cyan-400 transition">WAV to MP3</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Legal & Privacy</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="/privacy" className="hover:text-cyan-400 transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-cyan-400 transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800/60 pt-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} ConvertAll. All files are automatically deleted from servers within 1 hour. No registration required.
        </div>
      </div>
    </footer>
  );
};
