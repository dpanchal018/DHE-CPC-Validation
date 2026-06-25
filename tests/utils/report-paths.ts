import path from 'path';

export function getValidationResultsDir(): string {
  return (
    process.env.VALIDATION_RESULTS_DIR ??
    path.join(process.cwd(), 'output', 'validation-results')
  );
}
