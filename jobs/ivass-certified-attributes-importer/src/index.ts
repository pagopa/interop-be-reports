import { env } from "./config/env.js";
import { SourceFileConfig } from "./config/sourcefile.config.js";
import { downloadCSV } from "./service/file-downloader.js";

const sourceFileConfig: SourceFileConfig = {
  sourceUrl: env.SOURCE_URL,
  outputDir: env.SOURCE_FILE_DOWNLOAD_DIR
}

await downloadCSV(sourceFileConfig)