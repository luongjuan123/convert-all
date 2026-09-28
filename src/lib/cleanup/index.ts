import { storage } from "@/lib/storage";
import { getExpiredJobs, deleteJob } from "@/lib/jobs/store";

export async function runServerCleanup(): Promise<{ deletedJobs: number; deletedFiles: number }> {
  let deletedJobs = 0;
  const expiredJobs = getExpiredJobs();

  for (const job of expiredJobs) {
    await storage.deleteJobFiles(job.jobId);
    await deleteJob(job.jobId);
    deletedJobs++;
  }

  const deletedFiles = await storage.cleanExpiredFiles(60); // 60 minutes
  return { deletedJobs, deletedFiles };
}
