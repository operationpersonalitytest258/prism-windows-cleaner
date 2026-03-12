/** Shared result type from mole-core PowerShell scripts */
export interface MoleResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exit_code: number | null;
}
