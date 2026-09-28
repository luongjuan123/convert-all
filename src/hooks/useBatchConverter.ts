import { useState, useRef, useCallback, useEffect } from "react";
import { BatchItem, BatchItemStage, ConverterOption } from "@/components/converter/types";
import { siteConfig } from "@/config/site";

const MAX_CONCURRENT_UPLOADS = 3;
const MAX_CONCURRENT_CONVERSIONS = 2;

async function safeParseJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (!res.ok) {
      return { error: `Server error (${res.status} ${res.statusText || "Request Failed"}).` };
    }
    return { error: "Received unexpected non-JSON response from server." };
  }
}

export function useBatchConverter(defaultTargetFormat?: string, toolSlug?: string) {
  const [items, setItems] = useState<BatchItem[]>([]);
  const itemsRef = useRef<BatchItem[]>([]);
  itemsRef.current = items;

  const activeUploadsCount = useRef<number>(0);
  const activeConversionsCount = useRef<number>(0);
  const queueRunning = useRef<boolean>(false);

  // Update item by ID
  const updateItem = useCallback((id: string, updater: Partial<BatchItem> | ((prev: BatchItem) => BatchItem)) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (typeof updater === "function") {
          return updater(item);
        }
        return { ...item, ...updater };
      })
    );
  }, []);

  // Process next items in queue
  const processQueue = useCallback(() => {
    if (queueRunning.current) return;
    queueRunning.current = true;

    try {
      const currentItems = itemsRef.current;

      // 1. Check if any "waiting_convert" item can be converted
      const convertingCount = currentItems.filter((i) => i.stage === "converting").length;
      if (convertingCount < MAX_CONCURRENT_CONVERSIONS) {
        const nextToConvert = currentItems.find(
          (i) => i.stage === "verifying" && i.jobId && (i as any)._readyToConvert
        );
        if (nextToConvert) {
          executeConversion(nextToConvert.id, nextToConvert.attemptId);
        }
      }

      // 2. Check if any "queued" item can start upload
      const uploadingCount = currentItems.filter(
        (i) => i.stage === "session" || i.stage === "uploading"
      ).length;

      if (uploadingCount < MAX_CONCURRENT_UPLOADS) {
        const nextToUpload = currentItems.find((i) => i.stage === "queued");
        if (nextToUpload) {
          executeUploadFlow(nextToUpload.id, nextToUpload.attemptId);
        }
      }
    } finally {
      queueRunning.current = false;
    }
  }, []);

  // Add files to batch
  const addFiles = useCallback(
    async (files: File[]) => {
      const newItems: BatchItem[] = files.map((file) => {
        const id = crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}_${Math.random()}`;
        return {
          id,
          attemptId: 1,
          file,
          converterId: "",
          availableConverters: [],
          options: {
            quality: 85,
            audioBitrate: "192k",
            videoPreset: "balanced",
          },
          stage: "pending" as BatchItemStage,
          progress: 0,
          uploadStats: {
            uploadedBytes: 0,
            totalBytes: file.size,
            speedMbPerSec: 0,
            remainingSeconds: 0,
          },
        };
      });

      setItems((prev) => [...prev, ...newItems]);

      // Pre-fetch available converters for each item
      for (const item of newItems) {
        if (item.file.size > siteConfig.maxUploadSizeBytes) {
          const maxGb = (siteConfig.maxUploadSizeBytes / (1024 * 1024 * 1024)).toFixed(1);
          const fileMb = (item.file.size / (1024 * 1024)).toFixed(1);
          updateItem(item.id, {
            stage: "failed",
            errorStage: "upload",
            error: `File size (${fileMb} MB) exceeds maximum upload limit of ${maxGb} GB.`,
          });
          continue;
        }

        // Fetch session options or compatible converters
        fetch("/api/upload/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            size: item.file.size,
            mimeType: item.file.type || "application/octet-stream",
          }),
        })
          .then((res) => safeParseJson(res))
          .then((data) => {
            if (data.availableConverters && data.availableConverters.length > 0) {
              const converters: ConverterOption[] = data.availableConverters;
              let chosenId = converters[0].id;
              if (defaultTargetFormat) {
                const targetFmt = defaultTargetFormat.toLowerCase().replace(".", "");
                const matched = converters.find(
                  (c) => c.outputFormat.toLowerCase() === targetFmt || c.id.endsWith(targetFmt)
                );
                if (matched) chosenId = matched.id;
              }
              updateItem(item.id, {
                availableConverters: converters,
                converterId: chosenId,
              });
            } else if (data.error) {
              updateItem(item.id, {
                stage: "failed",
                errorStage: "session",
                error: data.error,
              });
            }
          })
          .catch(() => {});
      }
    },
    [defaultTargetFormat, updateItem]
  );

  // Execute Upload Flow for an item
  const executeUploadFlow = async (itemId: string, attemptId: number) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item || item.attemptId !== attemptId) return;

    updateItem(itemId, { stage: "session", progress: 5, error: undefined, errorStage: null });

    try {
      // 1. Session request
      const sessionRes = await fetch("/api/upload/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: item.file.name,
          size: item.file.size,
          mimeType: item.file.type || "application/octet-stream",
          converterId: item.converterId || undefined,
        }),
      });

      const sessionData = await safeParseJson(sessionRes);
      const current = itemsRef.current.find((i) => i.id === itemId);
      if (!current || current.attemptId !== attemptId || current.stage === "cancelled") return;

      if (!sessionRes.ok || sessionData.error) {
        throw { stage: "session", message: sessionData.error || "Failed to authorize upload session." };
      }

      const jobId = sessionData.jobId;
      const uploadUrl = sessionData.uploadUrl;
      const availableConverters = sessionData.availableConverters || current.availableConverters;
      const selectedConvId = current.converterId || (sessionData.converter ? sessionData.converter.id : availableConverters[0]?.id);

      updateItem(itemId, {
        jobId,
        availableConverters,
        converterId: selectedConvId,
        stage: "uploading",
        progress: 10,
      });

      // 2. Perform direct upload to GCS via XHR
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        updateItem(itemId, { xhr });

        let lastTime = Date.now();
        let lastLoaded = 0;

        xhr.upload.onprogress = (event) => {
          const checkItem = itemsRef.current.find((i) => i.id === itemId);
          if (!checkItem || checkItem.attemptId !== attemptId) return;

          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 80) + 10; // 10% to 90%
            const currentTime = Date.now();
            const timeDiff = (currentTime - lastTime) / 1000;

            let speedMbPerSec = 0;
            let remainingSeconds = 0;

            if (timeDiff >= 0.5) {
              const bytesDiff = event.loaded - lastLoaded;
              speedMbPerSec = bytesDiff / (1024 * 1024 * timeDiff);
              const remainingBytes = event.total - event.loaded;
              remainingSeconds = speedMbPerSec > 0 ? Math.round(remainingBytes / (speedMbPerSec * 1024 * 1024)) : 0;
              lastTime = currentTime;
              lastLoaded = event.loaded;
            }

            updateItem(itemId, (prev) => ({
              ...prev,
              progress: percentComplete,
              uploadStats: {
                uploadedBytes: event.loaded,
                totalBytes: event.total,
                speedMbPerSec: speedMbPerSec > 0 ? speedMbPerSec : prev.uploadStats.speedMbPerSec,
                remainingSeconds: remainingSeconds > 0 ? remainingSeconds : prev.uploadStats.remainingSeconds,
              },
            }));
          }
        };

        xhr.onload = () => {
          const checkItem = itemsRef.current.find((i) => i.id === itemId);
          if (!checkItem || checkItem.attemptId !== attemptId) return;

          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else if (xhr.status === 403) {
            reject({ stage: "upload", message: "Upload authorization expired or was forbidden by storage policy." });
          } else if (xhr.status === 413) {
            reject({ stage: "upload", message: "File size exceeds storage limits (HTTP 413)." });
          } else {
            reject({ stage: "upload", message: `Direct upload failed with status ${xhr.status}.` });
          }
        };

        xhr.onerror = () => {
          reject({ stage: "upload", message: "Network error during direct storage upload." });
        };

        xhr.ontimeout = () => {
          reject({ stage: "upload", message: "Upload connection timed out." });
        };

        xhr.onabort = () => {
          reject({ stage: "cancelled", message: "Upload cancelled by user." });
        };

        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", item.file.type || "application/octet-stream");
        xhr.setRequestHeader("Origin", window.location.origin);
        xhr.send(item.file);
      });

      // 3. Complete / Verification
      const verifyItem = itemsRef.current.find((i) => i.id === itemId);
      if (!verifyItem || verifyItem.attemptId !== attemptId || verifyItem.stage === "cancelled") return;

      updateItem(itemId, { stage: "verifying", progress: 95 });

      const completeRes = await fetch("/api/upload/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, filename: item.file.name }),
      });

      const completeData = await safeParseJson(completeRes);
      if (!completeRes.ok || !completeData.success) {
        throw { stage: "verification", message: completeData.error || "Storage object verification failed." };
      }

      // Mark ready for conversion slot
      updateItem(itemId, (prev) => ({
        ...prev,
        progress: 100,
        _readyToConvert: true,
      } as any));

      processQueue();
    } catch (err: any) {
      const cur = itemsRef.current.find((i) => i.id === itemId);
      if (!cur || cur.attemptId !== attemptId) return;

      if (err.stage === "cancelled" || cur.stage === "cancelled") {
        updateItem(itemId, { stage: "cancelled", progress: 0 });
      } else {
        updateItem(itemId, {
          stage: "failed",
          errorStage: err.stage || "upload",
          error: err.message || "Failed to process file.",
        });
      }
      processQueue();
    }
  };

  // Execute Conversion Flow for an item
  const executeConversion = async (itemId: string, attemptId: number) => {
    const item = itemsRef.current.find((i) => i.id === itemId);
    if (!item || item.attemptId !== attemptId || !item.jobId) return;

    updateItem(itemId, { stage: "converting", progress: 25, error: undefined, errorStage: null });

    try {
      const convertRes = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: item.jobId,
          converterId: item.converterId || undefined,
          options: item.options,
        }),
      });

      const convertData = await safeParseJson(convertRes);
      const checkItem = itemsRef.current.find((i) => i.id === itemId);
      if (!checkItem || checkItem.attemptId !== attemptId) return;

      if (!convertRes.ok || convertData.status !== "completed") {
        throw new Error(convertData.error || "Conversion failed. File may be damaged or unsupported.");
      }

      updateItem(itemId, {
        stage: "completed",
        progress: 100,
        resultData: {
          outputFilename: convertData.outputFilename,
          outputSize: convertData.outputSize,
          outputMimeType: convertData.outputMimeType,
          downloadUrl: convertData.downloadUrl,
          previewUrl: convertData.previewUrl || `/api/preview/${item.jobId}`,
          artifacts: convertData.artifacts,
        },
      });
    } catch (err: any) {
      const checkItem = itemsRef.current.find((i) => i.id === itemId);
      if (!checkItem || checkItem.attemptId !== attemptId) return;

      updateItem(itemId, {
        stage: "failed",
        errorStage: "conversion",
        error: err.message || "Conversion failed.",
      });
    } finally {
      processQueue();
    }
  };

  // Convert all valid pending/queued items
  const startConversion = useCallback(
    (targetIds?: string[]) => {
      setItems((prev) =>
        prev.map((item) => {
          if (targetIds && !targetIds.includes(item.id)) return item;
          if (item.stage === "pending" || item.stage === "failed") {
            return {
              ...item,
              stage: "queued",
              progress: 0,
              attemptId: item.attemptId + 1,
              error: undefined,
              errorStage: null,
            };
          }
          return item;
        })
      );
    },
    []
  );

  // Trigger queue check whenever items change stage
  useEffect(() => {
    processQueue();
  }, [items, processQueue]);

  // Cancel item
  const cancelItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item) return;

      if (item.xhr) {
        try {
          item.xhr.abort();
        } catch {}
      }

      if (item.jobId) {
        fetch("/api/upload/cancel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId: item.jobId }),
        }).catch(() => {});
      }

      updateItem(id, { stage: "cancelled", progress: 0, xhr: null });
      processQueue();
    },
    [updateItem, processQueue]
  );

  // Cancel all active
  const cancelAll = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (
        item.stage === "session" ||
        item.stage === "uploading" ||
        item.stage === "verifying" ||
        item.stage === "queued"
      ) {
        cancelItem(item.id);
      }
    });
  }, [cancelItem]);

  // Retry item
  const retryItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (!item) return;

      updateItem(id, {
        stage: "queued",
        attemptId: item.attemptId + 1,
        progress: 0,
        error: undefined,
        errorStage: null,
        xhr: null,
      });
      processQueue();
    },
    [updateItem, processQueue]
  );

  // Retry all failed
  const retryAllFailed = useCallback(() => {
    itemsRef.current.forEach((item) => {
      if (item.stage === "failed") {
        retryItem(item.id);
      }
    });
  }, [retryItem]);

  // Remove item
  const removeItem = useCallback(
    (id: string) => {
      const item = itemsRef.current.find((i) => i.id === id);
      if (item && (item.stage === "uploading" || item.stage === "session")) {
        cancelItem(id);
      }
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    [cancelItem]
  );

  // Clear completed
  const clearCompleted = useCallback(() => {
    setItems((prev) => prev.filter((i) => i.stage !== "completed"));
  }, []);

  // Set target format for specific item
  const setItemConverter = useCallback(
    (id: string, converterId: string) => {
      updateItem(id, { converterId });
    },
    [updateItem]
  );

  // Set target format for all pending items
  const setBatchTargetFormat = useCallback((format: string) => {
    const cleanFmt = format.toLowerCase().replace(".", "");
    setItems((prev) =>
      prev.map((item) => {
        if (item.stage !== "pending") return item;
        const matched = item.availableConverters.find(
          (c) => c.outputFormat.toLowerCase() === cleanFmt || c.id.endsWith(cleanFmt)
        );
        if (matched) {
          return { ...item, converterId: matched.id };
        }
        return item;
      })
    );
  }, []);

  // Update options (quality, bitrate, preset)
  const setItemOptions = useCallback(
    (id: string, newOptions: Partial<BatchItem["options"]>) => {
      updateItem(id, (prev) => ({
        ...prev,
        options: { ...prev.options, ...newOptions },
      }));
    },
    [updateItem]
  );

  // Aggregate stats
  const totalCount = items.length;
  const completedCount = items.filter((i) => i.stage === "completed").length;
  const failedCount = items.filter((i) => i.stage === "failed").length;
  const pendingCount = items.filter((i) => i.stage === "pending").length;
  const runningCount = items.filter(
    (i) => i.stage === "session" || i.stage === "uploading" || i.stage === "verifying" || i.stage === "converting" || i.stage === "queued"
  ).length;

  return {
    items,
    addFiles,
    startConversion,
    cancelItem,
    cancelAll,
    retryItem,
    retryAllFailed,
    removeItem,
    clearCompleted,
    setItemConverter,
    setBatchTargetFormat,
    setItemOptions,
    counts: {
      total: totalCount,
      completed: completedCount,
      failed: failedCount,
      pending: pendingCount,
      running: runningCount,
    },
  };
}
