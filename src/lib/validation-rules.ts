// ============================================================================
// BABIRYE - Comprehensive Validation Rule Definitions & Engine
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

// ============================================================================
// Core Interfaces
// ============================================================================

/** Result of validating a single value against a rule. */
export interface ValidationResult {
  /** Whether the value passed validation. */
  valid: boolean;
  /** Error messages for hard failures. */
  errors: string[];
  /** Warning messages for soft issues (value is technically valid but suspicious). */
  warnings: string[];
}

/** A named validation rule that can be applied to any value. */
export interface ValidationRule {
  /** Unique rule identifier (e.g., 'emailFormat', 'portRange'). */
  name: string;
  /** Human-readable description of what this rule validates. */
  description: string;
  /** Validate a value, returning a ValidationResult. */
  validate: (value: unknown) => ValidationResult;
}

// ============================================================================
// Validation Engine
// ============================================================================

/**
 * Validation engine that manages a collection of named rules
 * and can validate data objects against them.
 *
 * @example
 * ```ts
 * const engine = createValidationEngine([emailFormat, portRange]);
 * const result = engine.validate({ email: 'bad', port: 0 });
 * const messages = getValidationMessages(result);
 * ```
 */
export class ValidationEngine {
  private rules = new Map<string, ValidationRule>();

  /** Add a rule to the engine. Replaces any existing rule with the same name. */
  addRule(rule: ValidationRule): this {
    this.rules.set(rule.name, rule);
    return this;
  }

  /** Remove a rule by name. Returns true if the rule existed. */
  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /** Get a rule by name, or undefined if not registered. */
  getRule(name: string): ValidationRule | undefined {
    return this.rules.get(name);
  }

  /** Get all registered rule names. */
  getRuleNames(): string[] {
    return Array.from(this.rules.keys());
  }

  /**
   * Validate a single value against a named rule.
   * Returns a failed result with an error if the rule doesn't exist.
   */
  validateRule(name: string, value: unknown): ValidationResult {
    const rule = this.rules.get(name);
    if (!rule) {
      return { valid: false, errors: [`Rule "${name}" is not registered`], warnings: [] };
    }
    return rule.validate(value);
  }

  /**
   * Validate a data object against multiple named rules.
   * Each key in `data` is validated against the rule at the same index in `ruleNames`.
   *
   * @example
   * ```ts
   * engine.validate({ email: 'test@x.com', port: 8080 }, ['emailFormat', 'portRange']);
   * ```
   */
  validate(data: Record<string, unknown>, ruleNames: string[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const keys = Object.keys(data);

    for (let i = 0; i < ruleNames.length; i++) {
      const ruleName = ruleNames[i];
      const key = keys[i];
      const value = key !== undefined ? data[key] : undefined;
      const result = this.validateRule(ruleName, value);

      if (!result.valid) {
        errors.push(...result.errors.map((e) => `${key}: ${e}`));
      }
      warnings.push(...result.warnings.map((w) => `${key}: ${w}`));
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}

// ============================================================================
// Pre-built Validation Rules
// ============================================================================

/** Validates email format with RFC 5322 compliant regex. */
export const emailFormat: ValidationRule = {
  name: 'emailFormat',
  description: 'Validates that the value is a properly formatted email address',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || !value.trim()) {
      return { valid: false, errors: ['Email is required and must be a string'], warnings: [] };
    }
    const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!regex.test(value.trim()) || value.length > 254) {
      return { valid: false, errors: ['Invalid email format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates password strength (min 12 chars, upper + lower + digit + special). */
export const passwordStrength: ValidationRule = {
  name: 'passwordStrength',
  description: 'Requires minimum 12 characters with uppercase, lowercase, digit, and special character',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Password must be a string'], warnings: [] };
    }
    const errors: string[] = [];
    const warnings: string[] = [];
    if (value.length < 12) errors.push('Password must be at least 12 characters');
    if (!/[A-Z]/.test(value)) errors.push('Password must contain at least one uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('Password must contain at least one lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('Password must contain at least one digit');
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(value)) {
      errors.push('Password must contain at least one special character');
    }
    if (value.length >= 12 && value.length < 16) {
      warnings.push('Consider using 16+ characters for stronger security');
    }
    return { valid: errors.length === 0, errors, warnings };
  },
};

/** Validates port range (1-65535). */
export const portRange: ValidationRule = {
  name: 'portRange',
  description: 'Validates that the value is a valid network port (1-65535)',
  validate: (value: unknown): ValidationResult => {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 65535) {
      return { valid: false, errors: ['Port must be an integer between 1 and 65535'], warnings: [] };
    }
    const warnings: string[] = [];
    if (num < 1024) warnings.push('Ports below 1024 require elevated privileges');
    return { valid: true, errors: [], warnings };
  },
};

/** Validates URL format (http/https only). */
export const urlFormat: ValidationRule = {
  name: 'urlFormat',
  description: 'Validates that the value is a valid HTTP(S) URL',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || !value.trim()) {
      return { valid: false, errors: ['URL is required and must be a string'], warnings: [] };
    }
    try {
      const parsed = new URL(value.trim());
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return { valid: false, errors: ['Only HTTP and HTTPS URLs are allowed'], warnings: [] };
      }
      return { valid: true, errors: [], warnings: [] };
    } catch {
      return { valid: false, errors: ['Invalid URL format'], warnings: [] };
    }
  },
};

/** Validates that a string is parseable JSON. */
export const jsonFormat: ValidationRule = {
  name: 'jsonFormat',
  description: 'Validates that the value is valid JSON',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Value must be a JSON string'], warnings: [] };
    }
    try {
      JSON.parse(value);
      return { valid: true, errors: [], warnings: [] };
    } catch {
      return { valid: false, errors: ['Invalid JSON format'], warnings: [] };
    }
  },
};

/** Validates API key format (alphanumeric with optional hyphens/underscores, min 16 chars). */
export const apiKeyFormat: ValidationRule = {
  name: 'apiKeyFormat',
  description: 'Validates API key format (16+ alphanumeric chars with hyphens/underscores)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || value.length < 16) {
      return { valid: false, errors: ['API key must be at least 16 characters'], warnings: [] };
    }
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      return { valid: false, errors: ['API key must contain only alphanumeric characters, hyphens, and underscores'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates domain name format. */
export const domainName: ValidationRule = {
  name: 'domainName',
  description: 'Validates a domain name (e.g., example.com, sub.domain.co.uk)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Domain must be a string'], warnings: [] };
    }
    const regex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!regex.test(value)) {
      return { valid: false, errors: ['Invalid domain name format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates IPv4 address format. */
export const ipv4Address: ValidationRule = {
  name: 'ipv4Address',
  description: 'Validates IPv4 address format (0.0.0.0 - 255.255.255.255)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['IPv4 address must be a string'], warnings: [] };
    }
    const regex = /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)$/;
    if (!regex.test(value)) {
      return { valid: false, errors: ['Invalid IPv4 address format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates IPv6 address format. */
export const ipv6Address: ValidationRule = {
  name: 'ipv6Address',
  description: 'Validates IPv6 address format',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['IPv6 address must be a string'], warnings: [] };
    }
    const regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::(?:[0-9a-fA-F]{1,4}:){0,5}[0-9a-fA-F]{1,4}$|^[0-9a-fA-F]{1,4}::(?:[0-9a-fA-F]{1,4}:){0,4}[0-9a-fA-F]{1,4}$|^::$/;
    if (!regex.test(value)) {
      return { valid: false, errors: ['Invalid IPv6 address format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates MAC address format (XX:XX:XX:XX:XX:XX or XX-XX-XX-XX-XX-XX). */
export const macAddress: ValidationRule = {
  name: 'macAddress',
  description: 'Validates MAC address format',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['MAC address must be a string'], warnings: [] };
    }
    const regex = /^([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}$/;
    if (!regex.test(value)) {
      return { valid: false, errors: ['Invalid MAC address format (expected XX:XX:XX:XX:XX:XX)'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates hex string format. */
export const hexString: ValidationRule = {
  name: 'hexString',
  description: 'Validates that a string contains only hexadecimal characters',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || !value.trim()) {
      return { valid: false, errors: ['Hex string is required and must be a string'], warnings: [] };
    }
    if (!/^[0-9a-fA-F]+$/.test(value)) {
      return { valid: false, errors: ['String contains non-hexadecimal characters'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates that a date range has start < end. Expects `{ start, end }`. */
export const dateRange: ValidationRule = {
  name: 'dateRange',
  description: 'Validates that start date is before end date',
  validate: (value: unknown): ValidationResult => {
    if (!value || typeof value !== 'object' || !('start' in value) || !('end' in value)) {
      return { valid: false, errors: ['Must provide { start, end } date objects'], warnings: [] };
    }
    const { start, end } = value as { start: unknown; end: unknown };
    const startMs = new Date(start as string).getTime();
    const endMs = new Date(end as string).getTime();
    if (isNaN(startMs) || isNaN(endMs)) {
      return { valid: false, errors: ['Start and end must be valid dates'], warnings: [] };
    }
    if (startMs >= endMs) {
      return { valid: false, errors: ['Start date must be before end date'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates task priority is between 1 and 10. */
export const taskPriority: ValidationRule = {
  name: 'taskPriority',
  description: 'Validates task priority range (1-10)',
  validate: (value: unknown): ValidationResult => {
    const num = Number(value);
    if (!Number.isInteger(num) || num < 1 || num > 10) {
      return { valid: false, errors: ['Priority must be an integer between 1 and 10'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates severity level string. */
export const severityLevel: ValidationRule = {
  name: 'severityLevel',
  description: 'Validates severity level (info, low, medium, high, critical)',
  validate: (value: unknown): ValidationResult => {
    const valid = ['info', 'low', 'medium', 'high', 'critical'];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: [`Severity must be one of: ${valid.join(', ')}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates task type string. */
export const taskType: ValidationRule = {
  name: 'taskType',
  description: 'Validates task type (forensic, offensive, defensive, micro_defensive, sensors, vip, potentials)',
  validate: (value: unknown): ValidationResult => {
    const valid = ['forensic', 'offensive', 'defensive', 'micro_defensive', 'sensors', 'vip', 'potentials'];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: [`Task type must be one of: ${valid.join(', ')}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates agent domain string against known domains. */
export const agentDomain: ValidationRule = {
  name: 'agentDomain',
  description: 'Validates agent domain against known BABIRYE domains',
  validate: (value: unknown): ValidationResult => {
    const valid = [
      'forensic-analysis', 'threat-hunting', 'vulnerability-assessment', 'incident-response',
      'threat-intelligence', 'malware-analysis', 'network-monitoring', 'compliance-audit',
      'red-team-operations', 'vip-protection', 'sensor-management', 'micro-defense',
      'offensive-ops', 'defensive-ops', 'council-advisory',
    ];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: ['Invalid agent domain'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates weapon category string. */
export const weaponCategory: ValidationRule = {
  name: 'weaponCategory',
  description: 'Validates weapon category',
  validate: (value: unknown): ValidationResult => {
    const valid = ['firearms', 'less-lethal', 'tactical-equipment', 'protective-gear', 'explosives', 'melee', 'archery', 'launchers'];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: [`Weapon category must be one of: ${valid.join(', ')}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates martial art style string. */
export const martialArtStyle: ValidationRule = {
  name: 'martialArtStyle',
  description: 'Validates martial art style',
  validate: (value: unknown): ValidationResult => {
    const valid = ['striking', 'grappling', 'hybrid', 'weapon-based', 'internal', 'military', 'self-defense', 'combat-sport'];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: [`Martial art style must be one of: ${valid.join(', ')}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates sensor type string. */
export const sensorType: ValidationRule = {
  name: 'sensorType',
  description: 'Validates sensor type',
  validate: (value: unknown): ValidationResult => {
    const valid = ['motion', 'thermal', 'audio', 'camera', 'rfid', 'ble', 'gps', 'seismic', 'chemical', 'radiation', 'pressure', 'humidity'];
    if (typeof value !== 'string' || !valid.includes(value)) {
      return { valid: false, errors: [`Sensor type must be one of: ${valid.join(', ')}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates sensor range is a positive number (meters). */
export const sensorRange: ValidationRule = {
  name: 'sensorRange',
  description: 'Validates sensor range is a positive number in meters',
  validate: (value: unknown): ValidationResult => {
    const num = Number(value);
    if (isNaN(num) || num <= 0 || num > 100000) {
      return { valid: false, errors: ['Sensor range must be a positive number up to 100,000 meters'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates temperature range value. */
export const temperatureRange: ValidationRule = {
  name: 'temperatureRange',
  description: 'Validates temperature is within realistic range (-273.15°C to 1000°C)',
  validate: (value: unknown): ValidationResult => {
    const num = Number(value);
    if (isNaN(num) || num < -273.15 || num > 1000) {
      return { valid: false, errors: ['Temperature must be between -273.15°C and 1000°C'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates geographic coordinates (lat, lng). Expects `{ lat, lng }`. */
export const coordinatesFormat: ValidationRule = {
  name: 'coordinatesFormat',
  description: 'Validates geographic coordinates (lat: -90 to 90, lng: -180 to 180)',
  validate: (value: unknown): ValidationResult => {
    if (!value || typeof value !== 'object' || !('lat' in value) || !('lng' in value)) {
      return { valid: false, errors: ['Must provide { lat, lng } numeric coordinates'], warnings: [] };
    }
    const { lat, lng } = value as { lat: unknown; lng: unknown };
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      return { valid: false, errors: ['Latitude must be between -90 and 90'], warnings: [] };
    }
    if (isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return { valid: false, errors: ['Longitude must be between -180 and 180'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates array does not exceed maximum length. */
export const arrayMaxLength: ValidationRule = {
  name: 'arrayMaxLength',
  description: 'Validates that an array does not exceed 1000 elements',
  validate: (value: unknown): ValidationResult => {
    if (!Array.isArray(value)) {
      return { valid: false, errors: ['Value must be an array'], warnings: [] };
    }
    if (value.length > 1000) {
      return { valid: false, errors: ['Array exceeds maximum length of 1000'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates object nesting depth does not exceed 10 levels. */
export const objectMaxDepth: ValidationRule = {
  name: 'objectMaxDepth',
  description: 'Validates that object nesting depth does not exceed 10 levels',
  validate: (value: unknown): ValidationResult => {
    const maxDepth = 10;
    const getDepth = (v: unknown, depth: number): number => {
      if (depth > maxDepth || v === null || typeof v !== 'object') return depth;
      let childMax = depth;
      for (const child of Object.values(v as Record<string, unknown>)) {
        childMax = Math.max(childMax, getDepth(child, depth + 1));
      }
      return childMax;
    };
    const depth = getDepth(value, 0);
    if (depth > maxDepth) {
      return { valid: false, errors: [`Object nesting depth (${depth}) exceeds maximum of ${maxDepth}`], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates string max length. */
export const stringMaxLength: ValidationRule = {
  name: 'stringMaxLength',
  description: 'Validates string does not exceed 10,000 characters',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Value must be a string'], warnings: [] };
    }
    if (value.length > 10_000) {
      return { valid: false, errors: ['String exceeds maximum length of 10,000 characters'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

// ============================================================================
// Security-Focused Rules
// ============================================================================

/** Checks for XML content patterns (potential XXE vector). */
export const xmlContent: ValidationRule = {
  name: 'xmlContent',
  description: 'Detects XML content that may be an XXE injection vector',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return { valid: true, errors: [], warnings: [] };
    const warnings: string[] = [];
    if (/<\?xml/i.test(value)) warnings.push('XML declaration detected — potential XXE vector');
    if (/<!DOCTYPE/i.test(value)) warnings.push('DOCTYPE declaration detected — potential XXE vector');
    if (/<!ENTITY/i.test(value)) warnings.push('ENTITY declaration detected — potential XXE vector');
    if (/<!\[CDATA\[/i.test(value)) warnings.push('CDATA section detected');
    return { valid: true, errors: [], warnings };
  },
};

/** Checks for SQL keywords that may indicate injection. */
export const sqlKeyword: ValidationRule = {
  name: 'sqlKeyword',
  description: 'Detects common SQL keywords that may indicate injection attempts',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return { valid: true, errors: [], warnings: [] };
    const warnings: string[] = [];
    const keywords = [/\bSELECT\b/i, /\bUNION\b/i, /\bDROP\b/i, /\bINSERT\b/i, /\bDELETE\b/i, /\bUPDATE\b/i, /\bOR\s+1\s*=\s*1/i];
    for (const kw of keywords) {
      if (kw.test(value)) {
        warnings.push(`Potential SQL keyword detected: ${kw.source}`);
      }
    }
    return { valid: true, errors: [], warnings };
  },
};

/** Checks for path traversal patterns. */
export const pathTraversal: ValidationRule = {
  name: 'pathTraversal',
  description: 'Detects path traversal patterns (e.g., ../, ..\\)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return { valid: true, errors: [], warnings: [] };
    const patterns = [/\.\.\//, /\.\.\\/, /\%2e%2e%2f/i, /\%2e%2e\//i, /\.\.%2f/i];
    for (const p of patterns) {
      if (p.test(value)) {
        return { valid: false, errors: ['Path traversal pattern detected'], warnings: [] };
      }
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Checks for command injection patterns. */
export const commandInjectionPattern: ValidationRule = {
  name: 'commandInjectionPattern',
  description: 'Detects command injection patterns (e.g., ; | & ` $() )',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') return { valid: true, errors: [], warnings: [] };
    const dangerous = /[;|&`$]\s*(?:ls|cat|rm|wget|curl|bash|sh|nc|python|perl|ruby|powershell|cmd)\b/;
    if (dangerous.test(value)) {
      return { valid: false, errors: ['Potential command injection pattern detected'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

// ============================================================================
// Format Rules
// ============================================================================

/** Validates hex color code (#RGB or #RRGGBB). */
export const hexColor: ValidationRule = {
  name: 'hexColor',
  description: 'Validates hex color code (#RGB or #RRGGBB)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['Hex color must be a string'], warnings: [] };
    }
    if (!/^#([0-9a-fA-F]{3}){1,2}$/.test(value)) {
      return { valid: false, errors: ['Invalid hex color format (expected #RGB or #RRGGBB)'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates Base64 encoded string. */
export const base64Format: ValidationRule = {
  name: 'base64Format',
  description: 'Validates Base64 encoded string format',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string' || !value.trim()) {
      return { valid: false, errors: ['Base64 string is required'], warnings: [] };
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(value)) {
      return { valid: false, errors: ['Invalid Base64 format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates JWT format (header.payload.signature). */
export const jwtFormat: ValidationRule = {
  name: 'jwtFormat',
  description: 'Validates JWT token format (three Base64URL segments separated by dots)',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['JWT must be a string'], warnings: [] };
    }
    const parts = value.split('.');
    if (parts.length !== 3) {
      return { valid: false, errors: ['JWT must have three segments (header.payload.signature)'], warnings: [] };
    }
    const b64UrlRegex = /^[A-Za-z0-9_-]+$/;
    for (const [i, part] of parts.entries()) {
      if (!b64UrlRegex.test(part)) {
        return { valid: false, errors: [`JWT segment ${i + 1} contains invalid Base64URL characters`], warnings: [] };
      }
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

/** Validates UUID v4 format. */
export const uuidFormat: ValidationRule = {
  name: 'uuidFormat',
  description: 'Validates UUID v4 format',
  validate: (value: unknown): ValidationResult => {
    if (typeof value !== 'string') {
      return { valid: false, errors: ['UUID must be a string'], warnings: [] };
    }
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!regex.test(value)) {
      return { valid: false, errors: ['Invalid UUID v4 format'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  },
};

// ============================================================================
// Convenience Functions
// ============================================================================

/** Registry of all pre-built rules, keyed by name. */
export const ALL_RULES: Record<string, ValidationRule> = {
  emailFormat, passwordStrength, portRange, urlFormat, jsonFormat,
  apiKeyFormat, domainName, ipv4Address, ipv6Address, macAddress,
  hexString, dateRange, taskPriority, severityLevel, taskType,
  agentDomain, weaponCategory, martialArtStyle, sensorType, sensorRange,
  temperatureRange, coordinatesFormat, arrayMaxLength, objectMaxDepth,
  stringMaxLength, xmlContent, sqlKeyword, pathTraversal,
  commandInjectionPattern, hexColor, base64Format, jwtFormat, uuidFormat,
};

/**
 * Validate a data object against multiple named rules from the built-in registry.
 *
 * @example
 * ```ts
 * const result = validateAll({ email: 'test@x.com', port: 8080 }, ['emailFormat', 'portRange']);
 * console.log(getValidationMessages(result));
 * ```
 */
export function validateAll(data: Record<string, unknown>, ruleNames: string[]): ValidationResult {
  const engine = createValidationEngine(ruleNames.map((n) => ALL_RULES[n]).filter(Boolean));
  return engine.validate(data, ruleNames);
}

/**
 * Create a ValidationEngine pre-loaded with the given rules.
 */
export function createValidationEngine(rules: ValidationRule[]): ValidationEngine {
  const engine = new ValidationEngine();
  for (const rule of rules) {
    engine.addRule(rule);
  }
  return engine;
}

/**
 * Extract human-readable messages from a ValidationResult.
 * Combines errors and warnings into a single string array.
 */
export function getValidationMessages(result: ValidationResult): string[] {
  return [
    ...result.errors.map((e) => `❌ ${e}`),
    ...result.warnings.map((w) => `⚠️  ${w}`),
  ];
}