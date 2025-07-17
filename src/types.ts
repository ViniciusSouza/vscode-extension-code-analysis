export type SemgrepResult = {
  check_id: string,
    end: { line: number, col: number, offset: number },
    start: { line: number, col: number, offset: number },
    extra: { 
      engine_kind:string,
      message: string,
      severity: string,
      lines: string,
      validation_state: string,
      fingerprint: string,
      metadata: object
    }
}

export type SemgrepScanResult = {
  version: string,
  results: SemgrepResult[],
  paths: string[],
  skipped_rules: object[],
  time: object
}

export type CamadaZeroScanResult = {
  summary: { totalFiles: number, totalIssues: number },
  issues: SemgrepResult[],
  statistics: object
}