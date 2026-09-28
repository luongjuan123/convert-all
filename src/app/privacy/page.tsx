import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how we handle your privacy, file uploads, temporary storage, automatic file destruction, and advertising policies.",
};

export default function PrivacyPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-slate-400 mt-2">Last updated: August 25, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. File Handling & Temporary Storage</h2>
          <p>
            When you upload a file to {siteConfig.name}, your file is processed solely for the purpose of executing the requested file format conversion.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>We do NOT store your files permanently.</li>
            <li>We do NOT inspect, analyze, sell, or share your file content.</li>
            <li>Uploaded source files and converted output files are automatically destroyed from our servers within 1 hour.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. No Account Registration Required</h2>
          <p>
            {siteConfig.name} is completely anonymous and free. We do not require account registration, usernames, passwords, or email addresses.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Advertising & Cookies (Google AdSense)</h2>
          <p>
            We display non-intrusive banner advertisements served by Google AdSense to monetize and maintain this free service.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Third-party vendors, including Google, use cookies or device identifiers to serve ads based on user visits to this or other websites.</li>
            <li>Users can opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline">Google Ad Settings</a>.</li>
            <li>We support Google Consent Mode v2 to respect user privacy signals regarding advertising storage and personalization.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">4. Server Logs</h2>
          <p>
            Our infrastructure logs standard operational technical metadata (such as IP address, user agent, requested converter ID, file size, processing duration, and success/failure status) strictly for rate-limiting, abuse prevention, and operational security.
          </p>
        </section>
      </div>
    </div>
  );
}
