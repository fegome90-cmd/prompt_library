// Detector local de PII (sin enviar nada a servidores)

export interface PIIDetection {
  type: string;
  pattern: string;
  description: string;
  found: boolean;
  matches: string[];
}

const PATTERNS: Array<{
  type: string;
  pattern: RegExp;
  description: string;
}> = [
  {
    type: 'email',
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    description: 'Dirección de correo electrónico',
  },
  {
    type: 'phone',
    pattern: /(?:\+?56|0056)?[\s-]?[9|2][\s-]?\d{4}[\s-]?\d{4}/g,
    description: 'Número de teléfono chileno',
  },
  {
    type: 'rut',
    pattern: /\b\d{1,2}\.?\d{3}\.?\d{3}-[0-9Kk]\b/g,
    description: 'RUT chileno',
  },
  {
    type: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    description: 'Número de tarjeta de crédito',
  },
  {
    type: 'ip_address',
    pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    description: 'Dirección IP',
  },
  {
    type: 'date_of_birth',
    pattern: /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/g,
    description: 'Posible fecha de nacimiento',
  },
  {
    type: 'salary',
    pattern: /\$[\d.,]+(?:\s*(?:pesos|USD|EUR|CLP))?/gi,
    description: 'Posible monto de salario',
  },
];

export function detectPII(text: string): PIIDetection[] {
  const results: PIIDetection[] = [];
  
  for (const { type, pattern, description } of PATTERNS) {
    const matches = text.match(pattern) || [];
    results.push({
      type,
      pattern: pattern.source,
      description,
      found: matches.length > 0,
      matches: [...new Set(matches)], // Eliminar duplicados
    });
  }
  
  return results;
}

export function hasHighRiskPII(text: string): boolean {
  const detections = detectPII(text);
  const highRiskTypes = ['rut', 'credit_card', 'salary'];
  
  return detections.some(d => highRiskTypes.includes(d.type) && d.found);
}

export function getPIIWarning(detections: PIIDetection[]): string | null {
  const found = detections.filter(d => d.found);
  
  if (found.length === 0) return null;
  
  const messages: string[] = ['⚠️ Se detectaron posibles datos sensibles:'];
  
  for (const d of found) {
    messages.push(`• ${d.description}: ${d.matches.slice(0, 3).join(', ')}${d.matches.length > 3 ? '...' : ''}`);
  }
  
  messages.push('\nConsidera anonimizar estos datos antes de continuar.');
  
  return messages.join('\n');
}

export function getRiskLevel(text: string): 'low' | 'medium' | 'high' {
  const detections = detectPII(text);
  const found = detections.filter(d => d.found);
  
  if (found.some(d => ['rut', 'credit_card', 'salary'].includes(d.type))) {
    return 'high';
  }
  
  if (found.some(d => ['email', 'phone'].includes(d.type))) {
    return 'medium';
  }
  
  return 'low';
}
