import {
  Extractor,
  ExtractorConfig,
  ExtractorResult,
} from '@microsoft/api-extractor';
import * as minimist from 'minimist';
function main(args: Record<string, string>) {
  // Load and parse the api-extractor.json file
  const extractorConfig: ExtractorConfig = ExtractorConfig.loadFileAndPrepare(
    args.config
  );

  // Invoke API Extractor
  const extractorResult: ExtractorResult = Extractor.invoke(extractorConfig, {
    // Equivalent to the "--local" command-line parameter
    localBuild: true,

    // Equivalent to the "--verbose" command-line parameter
    showVerboseMessages: true,
  });

  if (extractorResult.succeeded) {
    console.error(`API Extractor completed successfully`);
    process.exitCode = 0;
  } else {
    console.error(
      `API Extractor completed with ${extractorResult.errorCount} errors` +
        ` and ${extractorResult.warningCount} warnings`
    );
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main(minimist(process.argv));
}
