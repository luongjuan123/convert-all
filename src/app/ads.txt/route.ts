import { NextResponse } from "next/server";
import { adConfig, formatPublisherId } from "@/lib/advertising/ad-config";

export async function GET() {
  const pubInfo = formatPublisherId(adConfig.clientId);

  // Official Google AdSense ads.txt format
  const adsTxtContent = pubInfo.isValid
    ? `google.com, ${pubInfo.pubId}, DIRECT, f08c47fec0942fa0\n`
    : `# Google AdSense ads.txt template\n# Set your publisher ID in NEXT_PUBLIC_ADSENSE_CLIENT_ID\n# Example: google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n`;

  return new NextResponse(adsTxtContent, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}

