import { runServerCleanup } from "../lib/cleanup";

async function main() {
  console.log("[Cleanup Task] Starting server file cleanup...");
  const result = await runServerCleanup();
  console.log(`[Cleanup Task] Complete! Deleted ${result.deletedJobs} expired jobs and ${result.deletedFiles} expired directories.`);
}

main().catch((err) => {
  console.error("[Cleanup Task] Failed:", err);
  process.exit(1);
});
