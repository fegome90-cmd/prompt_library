'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FloppyDisk,
  X,
  Plus,
  Trash,
  Info,
  Code,
} from '@phosphor-icons/react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useStore } from '@/lib/store';
import { parseTags, parseVariablesSchema } from '@/lib/prompt-utils';
import type { Prompt, VariableSchema } from '@/types';
import { toast } from 'sonner';
import { autoTag, analyzeComplexity } from '@/lib/auto-tagger';
import { validatePrompt, getScoreMessage, type ValidationResult } from '@/lib/prompt-validator';
import { logger } from '@/lib/logger';

interface PromptEditorProps {
  prompt?: Prompt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function PromptEditor({ prompt, open, onOpenChange, onSave }: PromptEditorProps) {
  const { categories, currentUser } = useStore();
  
  // Estado del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [variablesSchema, setVariablesSchema] = useState<VariableSchema[]>([]);
  const [outputFormat, setOutputFormat] = useState('');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [changelog, setChangelog] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showSuggestedTags, setShowSuggestedTags] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  
  // Validar en tiempo real cuando cambia el contenido
  useEffect(() => {
    const result = validatePrompt({ title, description, body, category });
    setValidationResult(result);
  }, [title, description, body, category]);
  
  // Sugerir tags cuando cambia el body (solo para nuevos prompts)
  useEffect(() => {
    if (!prompt && body.length > 30) {
      const suggestions = autoTag(`${title} ${description} ${body}`);
      setSuggestedTags(suggestions);
      if (suggestions.length > 0 && tags.length === 0) {
        setShowSuggestedTags(true);
      }
    }
  }, [body, title, description, prompt, tags.length]);
  
  // Inicializar formulario si se edita un prompt existente
  useEffect(() => {
    if (prompt) {
      setTitle(prompt.title);
      setDescription(prompt.description);
      setBody(prompt.body);
      setCategory(prompt.category);
      setTags(parseTags(prompt.tags));
      setVariablesSchema(parseVariablesSchema(prompt.variablesSchema));
      setOutputFormat(prompt.outputFormat || '');
      setRiskLevel(prompt.riskLevel);
      setChangelog('');
    } else {
      // Reset para nuevo prompt
      setTitle('');
      setDescription('');
      setBody('');
      setCategory('');
      setTags([]);
      setVariablesSchema([]);
      setOutputFormat('');
      setRiskLevel('low');
      setChangelog('');
    }
  }, [prompt]);
  
  // Añadir variable
  const addVariable = () => {
    setVariablesSchema([
      ...variablesSchema,
      { name: '', label: '', type: 'text', help: '', required: false },
    ]);
  };
  
  // Actualizar variable
  const updateVariable = (index: number, field: keyof VariableSchema, value: string | boolean | string[]) => {
    const updated = [...variablesSchema];
    updated[index] = { ...updated[index], [field]: value };
    setVariablesSchema(updated);
  };
  
  // Eliminar variable
  const removeVariable = (index: number) => {
    setVariablesSchema(variablesSchema.filter((_, i) => i !== index));
  };
  
  // Añadir tags sugeridos
  const addSuggestedTags = () => {
    const newTags = suggestedTags.filter(t => !tags.includes(t));
    setTags([...tags, ...newTags]);
    setShowSuggestedTags(false);
    toast.success(`${newTags.length} tags añadidos`);
  };
  
  // Añadir tag manual
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };
  
  // Eliminar tag
  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };
  
  // Extraer variables del body automáticamente
  const extractVariables = () => {
    const matches = body.match(/\{(\w+)\}/g) || [];
    const uniqueNames = [...new Set(matches.map(m => m.slice(1, -1)))];
    
    const existingNames = variablesSchema.map(v => v.name);
    const newVars = uniqueNames
      .filter(name => !existingNames.includes(name))
      .map(name => ({
        name,
        label: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'text' as const,
        help: '',
        required: true,
      }));
    
    if (newVars.length > 0) {
      setVariablesSchema([...variablesSchema, ...newVars]);
      toast.success(`${newVars.length} variables detectadas`);
    } else {
      toast.info('No se encontraron nuevas variables');
    }
  };
  
  // Guardar prompt
  const handleSave = async () => {
    if (!title || !body || !category) {
      toast.error('Por favor completa título, cuerpo y categoría');
      return;
    }
    
    // Validar variables
    const invalidVars = variablesSchema.filter(v => !v.name || !v.label);
    if (invalidVars.length > 0) {
      toast.error('Completa el nombre y etiqueta de todas las variables');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const url = prompt ? `/api/prompts/${prompt.id}` : '/api/prompts';
      const method = prompt ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          body,
          category,
          tags,
          variablesSchema,
          outputFormat,
          riskLevel,
          changelog,
          authorId: currentUser?.id,
        }),
      });
      
      if (!response.ok) throw new Error('Error al guardar');
      
      toast.success(prompt ? 'Prompt actualizado' : 'Prompt creado');
      onSave();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el prompt');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {prompt ? 'Editar Prompt' : 'Nuevo Prompt'}
          </DialogTitle>
          <DialogDescription>
            {prompt 
              ? `Editando v${prompt.version} - Los cambios crearán una nueva versión`
              : 'Crea un nuevo prompt para tu biblioteca'
            }
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="preview">Vista Previa</TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Título */}
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Correo de bienvenida nuevo empleado"
                />
              </div>
              
              {/* Descripción */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descripción del propósito del prompt"
                />
              </div>
              
              {/* Categoría y Riesgo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nivel de Riesgo</Label>
                  <Select value={riskLevel} onValueChange={(v) => setRiskLevel(v as 'low' | 'medium' | 'high')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Bajo</SelectItem>
                      <SelectItem value="medium">Medio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Tags */}
              <div className="space-y-2">
                <Label>Tags</Label>
                
                {/* Tags sugeridos (solo para nuevos prompts) */}
                {showSuggestedTags && suggestedTags.length > 0 && (
                  <div className="bg-primary/10 rounded-lg p-3 mb-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Tags sugeridos:</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowSuggestedTags(false)}
                      >
                        <X weight="regular" className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {suggestedTags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary" 
                          className="cursor-pointer hover:bg-primary/20"
                          onClick={() => {
                            if (!tags.includes(tag)) {
                              setTags([...tags, tag]);
                            }
                          }}
                        >
                          + {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={addSuggestedTags}
                    >
                      Añadir todos
                    </Button>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Añadir tag..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    <Plus weight="regular" className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <X weight="regular"
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Score de validación */}
              {validationResult && (
                <div className={`rounded-lg p-3 border ${
                  validationResult.valid 
                    ? 'border-green-200 bg-green-50 dark:bg-green-950/20' 
                    : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Calidad del prompt</span>
                    <Badge className={getScoreMessage(validationResult.score).color}>
                      {validationResult.score}/100 - {getScoreMessage(validationResult.score).label}
                    </Badge>
                  </div>
                  
                  {/* Errores */}
                  {validationResult.errors.filter(e => e.severity === 'error').length > 0 && (
                    <div className="text-xs text-red-600 space-y-1 mb-2">
                      {validationResult.errors
                        .filter(e => e.severity === 'error')
                        .slice(0, 3)
                        .map((error, i) => (
                          <p key={i}>• {error.message}</p>
                        ))}
                    </div>
                  )}
                  
                  {/* Advertencias */}
                  {validationResult.errors.filter(e => e.severity === 'warning').length > 0 && (
                    <div className="text-xs text-yellow-600 space-y-1 mb-2">
                      {validationResult.errors
                        .filter(e => e.severity === 'warning')
                        .slice(0, 2)
                        .map((error, i) => (
                          <p key={i}>• {error.message}</p>
                        ))}
                    </div>
                  )}
                  
                  {/* Barra de progreso */}
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        validationResult.score >= 70 ? 'bg-green-500' :
                        validationResult.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${validationResult.score}%` }}
                    />
                  </div>
                </div>
              )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="body">Cuerpo del Prompt *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={extractVariables}>
                    <Code weight="regular" className="h-3 w-3 mr-1" />
                    Detectar variables
                  </Button>
                </div>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Escribe el prompt aquí. Usa {nombre_variable} para las variables."
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Usa llaves para variables: {"{nombre}"}, {"{departamento}"}
                </p>
              
              {/* Formato de salida */}
              <div className="space-y-2">
                <Label htmlFor="outputFormat">Formato de Salida Esperado</Label>
                <Textarea
                  id="outputFormat"
                  value={outputFormat}
                  onChange={(e) => setOutputFormat(e.target.value)}
                  placeholder="Describe el formato esperado de la respuesta..."
                  rows={2}
                />
              </div>
              
              {/* Changelog (solo edición) */}
              {prompt && (
                <div className="space-y-2">
                  <Label htmlFor="changelog">Descripción del Cambio</Label>
                  <Input
                    id="changelog"
                    value={changelog}
                    onChange={(e) => setChangelog(e.target.value)}
                    placeholder="¿Qué se modificó en esta versión?"
                  />
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="variables" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Variables del Prompt</h3>
                  <p className="text-sm text-muted-foreground">
                    Define las variables que el usuario deberá completar
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addVariable}>
                  <Plus weight="regular" className="h-4 w-4 mr-2" />
                  Añadir Variable
                </Button>
              </div>
              
              <div className="space-y-4">
                {variablesSchema.map((variable, index) => (
                  <Card key={index}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Variable: {variable.name || 'Nueva'}</CardTitle>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariable(index)}
                        >
                          <Trash weight="regular" className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre (sin espacios)</Label>
                        <Input
                          value={variable.name}
                          onChange={(e) => updateVariable(index, 'name', e.target.value.replace(/\s/g, '_'))}
                          placeholder="nombre_variable"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Etiqueta</Label>
                        <Input
                          value={variable.label}
                          onChange={(e) => updateVariable(index, 'label', e.target.value)}
                          placeholder="Nombre visible"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={variable.type}
                          onValueChange={(v) => updateVariable(index, 'type', v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto corto</SelectItem>
                            <SelectItem value="textarea">Texto largo</SelectItem>
                            <SelectItem value="select">Selección</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Ayuda</Label>
                        <Input
                          value={variable.help || ''}
                          onChange={(e) => updateVariable(index, 'help', e.target.value)}
                          placeholder="Descripción breve"
                        />
                      </div>
                      {variable.type === 'select' && (
                        <div className="col-span-2 space-y-2">
                          <Label>Opciones (separadas por coma)</Label>
                          <Input
                            value={(variable.options || []).join(', ')}
                            onChange={(e) => updateVariable(index, 'options', e.target.value.split(',').map(s => s.trim()))}
                            placeholder="Opción 1, Opción 2, Opción 3"
                          />
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={variable.required}
                          onCheckedChange={(checked) => updateVariable(index, 'required', checked)}
                        />
                        <Label className="font-normal">Requerido</Label>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {variablesSchema.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Info weight="regular" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No hay variables definidas</p>
                    <p className="text-sm mt-1">
                      Usa el botón &quot;Detectar variables&quot; o añade manualmente
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="preview" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vista Previa del Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 rounded-lg p-4 min-h-[200px]">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {body || 'Escribe el cuerpo del prompt para ver la vista previa...'}
                    </pre>
                  </div>
                  
                  {variablesSchema.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium mb-2">Variables detectadas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {variablesSchema.map(v => (
                          <Badge key={v.name} variant="outline">
                            {'{'}{v.name}{'}'} - {v.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <FloppyDisk weight="regular" className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
