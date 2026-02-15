'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Copy, Check, Sparkle, Warning, ArrowLeft, Star, Info } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SecurityBanner } from './security-banner';
import { useStore } from '@/lib/store';
import { getRiskLevel } from '@/lib/pii-detector';
import { parseTags, parseVariablesSchema } from '@/lib/prompt-utils';
import { logger } from '@/lib/logger';
import type { Prompt, VariableSchema } from '@/types';
import { toast } from 'sonner';

interface PromptComposerProps {
  prompt: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PromptComposer({ prompt, open, onOpenChange }: PromptComposerProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showHighRiskWarning, setShowHighRiskWarning] = useState(false);
  
  const { addToCopiedHistory, toggleFavorite } = useStore();
  
  // Parsear variables del prompt
  const parsedSchema: VariableSchema[] = useMemo(() => {
    if (!prompt?.variablesSchema) return [];
    return parseVariablesSchema(prompt.variablesSchema);
  }, [prompt?.variablesSchema]);
  
  // Resetear variables cuando cambia el prompt
  useEffect(() => {
    if (prompt && parsedSchema.length > 0) {
      const initialVars: Record<string, string> = {};
      parsedSchema.forEach(v => {
        initialVars[v.name] = '';
      });
      setVariables(initialVars);
      setGeneratedText('');
      setCopied(false);
    }
  }, [prompt, parsedSchema]);
  
  // Generar el texto del prompt
  const generateText = useCallback(() => {
    if (!prompt) return '';
    
    let text = prompt.body;
    
    for (const [key, value] of Object.entries(variables)) {
      text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), value || `[${key}]`);
    }
    
    return text;
  }, [prompt, variables]);
  
  useEffect(() => {
    setGeneratedText(generateText());
  }, [generateText]);
  
  // Detectar riesgo en tiempo real (callback para componentes hijos)
  const handleRiskDetected = (_risk: 'low' | 'medium' | 'high') => {
    // Risk is computed directly via overallRisk - no state needed
  };
  
  // Verificar riesgo de todas las variables combinadas
  const allVariablesText = Object.values(variables).join(' ');
  const overallRisk = getRiskLevel(allVariablesText);
  
  // Copiar al portapapeles
  const handleCopy = async () => {
    if (overallRisk === 'high' && !showHighRiskWarning) {
      setShowHighRiskWarning(true);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      
      // Registrar en historial
      if (prompt) {
        addToCopiedHistory({
          promptId: prompt.id,
          promptTitle: prompt.title,
          generatedText,
          variables: { ...variables },
          copiedAt: new Date().toISOString(),
        });
      }
      
      // Registrar uso en backend
      if (prompt) {
        await fetch(`/api/prompts/${prompt.id}/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            feedback: null,
            dataRiskLevel: overallRisk,
            variablesUsed: variables,
          }),
        });
      }
      
      toast.success('¡Prompt copiado al portapapeles!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Error al copiar', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Error al copiar');
    }
  };
  
  const handleVariableChange = (name: string, value: string) => {
    setVariables(prev => ({ ...prev, [name]: value }));
  };
  
  const getRiskBadge = () => {
    const colors = {
      low: 'bg-success/10 text-success',
      medium: 'bg-warning/10 text-warning',
      high: 'bg-destructive/10 text-destructive',
    };

    const labels = {
      low: 'Bajo riesgo',
      medium: 'Riesgo medio',
      high: 'Alto riesgo',
    };

    return (
      <Badge className={colors[overallRisk]} data-testid="risk-badge">
        {labels[overallRisk]}
      </Badge>
    );
  };
  
  if (!prompt) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="composer-dialog">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Sparkle weight="regular" className="h-5 w-5 text-primary" />
                {prompt.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {prompt.description}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getRiskBadge()}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(prompt.id)}
              >
                <Star weight={prompt.isFavorite ? 'fill' : 'regular'} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Banner de seguridad */}
          <SecurityBanner 
            text={allVariablesText} 
            showDetection={true}
            onRiskDetected={handleRiskDetected}
          />
          
          {/* Advertencia de alto riesgo */}
          {showHighRiskWarning && (
            <Alert variant="destructive">
              <Warning weight="fill" className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>¡Atención!</strong> Se detectaron datos de alto riesgo. 
                Por seguridad, anonimiza los datos antes de continuar.
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => setShowHighRiskWarning(false)}>
                    Entendido, continuar
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setShowHighRiskWarning(false)}>
                    Ignorar y copiar
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Panel de variables */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  Variables
                  <Badge variant="outline" className="text-xs font-mono tabular-nums">
                    {Object.values(variables).filter(v => v).length}/{parsedSchema.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[300px] overflow-y-auto">
                {parsedSchema.map((variable) => (
                  <div key={variable.name} className="space-y-1.5">
                    <Label htmlFor={variable.name} className="text-sm flex items-center gap-1">
                      {variable.label}
                      {variable.required && <span className="text-red-500">*</span>}
                    </Label>
                    
                    {variable.type === 'text' && (
                      <Input
                        id={variable.name}
                        placeholder={variable.help}
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                      />
                    )}
                    
                    {variable.type === 'textarea' && (
                      <Textarea
                        id={variable.name}
                        placeholder={variable.help}
                        value={variables[variable.name] || ''}
                        onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                        rows={3}
                      />
                    )}
                    
                    {variable.type === 'select' && variable.options && (
                      <Select
                        value={variables[variable.name] || ''}
                        onValueChange={(value) => handleVariableChange(variable.name, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={variable.help} />
                        </SelectTrigger>
                        <SelectContent>
                          {variable.options.map(opt => (
                            <SelectItem key={opt} value={opt}>
                              {opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    
                    {variable.help && variable.type !== 'select' && (
                      <p className="text-xs text-muted-foreground">{variable.help}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            {/* Panel de preview */}
            <Card data-testid="preview-panel">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Info weight="regular" className="h-4 w-4" />
                    Vista Previa
                  </span>
                  <span className="text-xs text-muted-foreground font-mono tabular-nums">
                    {generatedText.length} caracteres
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/*
                  WO-0006: XSS Prevention
                  React automatically escapes content in JSX expressions.
                  generatedText is rendered as text, not HTML, so XSS is prevented.
                  Do NOT use dangerouslySetInnerHTML here.
                */}
                <div className="bg-muted/50 rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {generatedText || 'Completa las variables para ver el prompt...'}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Metadatos del prompt */}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{prompt.category}</Badge>
            <Badge variant="outline" className="font-mono tabular-nums">v{prompt.version}</Badge>
            {parseTags(prompt.tags).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>
        
        {/* Footer con acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Copia y pega este prompt en ChatGPT, Copilot o tu IA preferida
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="close-button">
              <ArrowLeft weight="regular" className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
            <Button onClick={handleCopy} disabled={!generatedText} data-testid="copy-button">
              {copied ? (
                <>
                  <Check weight="regular" className="h-4 w-4 mr-2" />
                  ¡Copiado!
                </>
              ) : (
                <>
                  <Copy weight="regular" className="h-4 w-4 mr-2" />
                  Copiar Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
