import path from "path";
import { ConverterHandler, ConversionResult, ConversionOptions } from "@/lib/types/converter";
import { pdfConverters } from "./converters/pdf";
import { imageConverters } from "./converters/image";
import { videoConverters } from "./converters/video";
import { audioConverters } from "./converters/audio";
import { officeConverters } from "./converters/office";

const ALL_CONVERTERS: ConverterHandler[] = [
  ...pdfConverters,
  ...imageConverters,
  ...videoConverters,
  ...audioConverters,
  ...officeConverters,
];

const converterRegistry = new Map<string, ConverterHandler>();

ALL_CONVERTERS.forEach((converter) => {
  converterRegistry.set(converter.id, converter);
});

export function getConverter(converterId: string): ConverterHandler | undefined {
  return converterRegistry.get(converterId);
}

export function findCompatibleConverters(filename: string): ConverterHandler[] {
  const ext = path.extname(filename).toLowerCase();
  if (!ext) return [];

  return ALL_CONVERTERS.filter((c) =>
    c.inputExtensions.map((e) => e.toLowerCase()).includes(ext)
  );
}

export function findConverterByExt(inputExt: string, outputExt: string): ConverterHandler | undefined {
  const inExt = inputExt.startsWith(".") ? inputExt.toLowerCase() : `.${inputExt.toLowerCase()}`;
  const outExt = outputExt.startsWith(".") ? outputExt.toLowerCase() : `.${outputExt.toLowerCase()}`;

  return ALL_CONVERTERS.find(
    (c) =>
      c.inputExtensions.map((e) => e.toLowerCase()).includes(inExt) &&
      (c.outputExtension.toLowerCase() === outExt || c.outputFormat.toLowerCase() === outExt.replace(".", ""))
  );
}

export async function convertFile(
  converterId: string,
  inputPath: string,
  outputPath: string,
  options?: ConversionOptions
): Promise<ConversionResult> {
  const handler = getConverter(converterId);
  if (!handler) {
    return { success: false, error: `No converter registered for ID '${converterId}'` };
  }

  try {
    return await handler.convert(inputPath, outputPath, options);
  } catch (err: any) {
    console.error(`Error running converter ${converterId}:`, err);
    return { success: false, error: err.message || "An unexpected conversion error occurred." };
  }
}

export { ALL_CONVERTERS };
