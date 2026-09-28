import React from "react";
import { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service and usage conditions for using our free online file conversion tools.",
};

export default function TermsPage() {
  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 text-slate-300">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-4xl font-extrabold text-white tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-400 mt-2">Last updated: August 25, 2026</p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed">
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">1. Acceptable Use</h2>
          <p>
            By accessing and using {siteConfig.name}, you agree that you have full ownership rights or explicit authorization to upload and convert your files.
          </p>
          <p>
            You MUST NOT upload illegal, copyright-infringing, malware-infected, or harmful material.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">2. Service Availability & Limits</h2>
          <p>
            This service is provided "AS IS" without warranties of any kind. We enforce technical rate limits, file size limits (up to 200MB), and conversion timeouts to prevent service abuse.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-white">3. Limitation of Liability</h2>
          <p>
            {siteConfig.name} is not responsible for any file loss, corrupted outputs, or damages resulting from the use of our automated conversion tools. Users are encouraged to maintain backups of their original documents.
          </p>
        </section>
      </div>
    </div>
  );
}
