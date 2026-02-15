'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Warning, ShieldCheck, X, Eye, EyeSlash } from '@phosphor-icons/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { detectPII, getPIIWarning, type PIIDetection } from '@/lib/pii-detector';

interface SecurityBannerProps {
  text?: string;
  onRiskDetected?: (riskLevel: 'low' | 'medium' | 'high') => void;
  showDetection?: boolean;
}

export function SecurityBanner({ text = '', onRiskDetected, showDetection = false }: SecurityBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  // Usar ref para evitar que onRiskDetected sea una dependencia del effect
  const onRiskDetectedRef = useRef(onRiskDetected);
  useEffect(() => {
    onRiskDetectedRef.current = onRiskDetected;
  }, [onRiskDetected]);
  
  // Calcular detecciones de forma derivada (sin useState)
  const detections = useMemo<PIIDetection[]>(() => {
    if (text && showDetection) {
      return detectPII(text);
    }
    return [];
  }, [text, showDetection]);
  
  // Calcular nivel de riesgo de forma derivada
  const riskLevel = useMemo<'low' | 'medium' | 'high'>(() => {
    if (detections.length === 0) return 'low';
    
    const hasRut = detections.find(d => d.type === 'rut' && d.found);
    const hasCard = detections.find(d => d.type === 'credit_card' && d.found);
    const hasSalary = detections.find(d => d.type === 'salary' && d.found);
    
    if (hasRut || hasCard || hasSalary) {
      return 'high';
    } else if (detections.some(d => d.found)) {
      return 'medium';
    }
    return 'low';
  }, [detections]);
  
  // Notificar cuando cambie el nivel de riesgo - solo efectos secundarios
  useEffect(() => {
    if (onRiskDetectedRef.current && showDetection) {
      // Usar setTimeout para evitar llamar durante el render
      const timer = setTimeout(() => {
        onRiskDetectedRef.current?.(riskLevel);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [riskLevel, showDetection]);
  
  const warning = getPIIWarning(detections);
  
  if (dismissed && !warning) {
    return null;
  }
  
  return (
    <div className="space-y-2">
      {/* Banner fijo de seguridad */}
      {!dismissed && (
        <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
          <ShieldCheck weight="regular" className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            Recordatorio de Seguridad
          </AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-300 text-xs">
            <p>
              <strong>No pegues datos sensibles:</strong> RUT, datos clínicos, sueldos, 
              datos bancarios, direcciones personales, listas de clientes/pacientes.
            </p>
            <p className="mt-1">
              <strong>Anonimiza siempre:</strong> Usa &quot;Cliente A&quot;, &quot;Persona B&quot;, etc.
            </p>
          </AlertDescription>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-2 h-6 w-6 p-0"
            onClick={() => setDismissed(true)}
          >
            <X weight="regular" className="h-4 w-4" />
          </Button>
        </Alert>
      )}
      
      {/* Detección de PII en tiempo real */}
      {warning && showDetection && (
        <Alert variant="destructive" className="relative">
          <Warning weight="fill" className="h-4 w-4" />
          <AlertTitle className="text-sm font-medium flex items-center gap-2">
            Posibles Datos Sensibles Detectados
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeSlash weight="regular" className="h-3 w-3" /> : <Eye weight="regular" className="h-3 w-3" />}
              {showDetails ? 'Ocultar' : 'Ver detalles'}
            </Button>
          </AlertTitle>
          {showDetails && (
            <AlertDescription className="text-xs mt-2">
              <pre className="whitespace-pre-wrap text-xs">{warning}</pre>
              <div className="flex flex-wrap gap-1 mt-2">
                {detections.filter(d => d.found).map(d => (
                  <Badge key={d.type} variant="destructive" className="text-xs">
                    {d.description}
                  </Badge>
                ))}
              </div>
            </AlertDescription>
          )}
        </Alert>
      )}
    </div>
  );
}
