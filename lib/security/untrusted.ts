/**
 * Wraps untrusted text so the model treats it as data, not instructions.
 * Callers must never concatenate this with system instructions.
 */
export function wrapUntrusted(label: string, text: string | null | undefined): string {
  if (!text) return '';
  const safe = text.replace(/```/g, '``\u200b`').slice(0, 20_000);
  return `<untrusted-data source="${label}">\n${safe}\n</untrusted-data>`;
}

const INJECTION_PATTERNS = [
  /ignore (all|previous|prior|above)( (previous|prior|above))? (instructions|rules|prompts)/i,
  /reveal (your|the) (system )?prompt/i,
  /approve .{0,40}100% ?itc/i,
  /disregard .{0,30}cra/i,
  /you are now .{0,40}(unrestricted|jailbroken|dan)/i,
  /system\s*:\s*/i,
  /\[INST\]|<<SYS>>|<\|im_start\|>/i,
  /override (the )?(safety|policy|rules)/i,
  /do not follow (the )?(cra|tax) rules/i,
  /pretend (you are|to be) (a |an )?(unfiltered|unrestricted)/i,
];

/** Structural signals often present in injection attempts inside receipt text. */
function hasStructuralInjectionSignals(text: string): boolean {
  const hasRolePlay = /\b(system message|important system|developer mode)\b/i.test(text);
  const hasInstructionVerb =
    /\b(ignore|disregard|override|forget|bypass)\b/i.test(text) &&
    /\b(instruction|rule|prompt|policy|guideline)\b/i.test(text);
  return hasRolePlay || hasInstructionVerb;
}

export function containsInjectionAttempt(text: string | null | undefined): boolean {
  if (!text) return false;
  if (INJECTION_PATTERNS.some((re) => re.test(text))) return true;
  return hasStructuralInjectionSignals(text);
}

/**
 * Log a redacted detection for guardrail training / audit.
 * Does not throw; callers decide routing.
 */
export function logInjectionDetection(source: string, text: string): void {
  const snippet = text.slice(0, 200).replace(/\s+/g, ' ');
  console.warn(
    JSON.stringify({
      event: 'prompt_injection_detected',
      source,
      snippet,
      length: text.length,
      ts: new Date().toISOString(),
    }),
  );
}
