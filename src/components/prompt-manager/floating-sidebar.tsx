'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  MagnifyingGlass,
  Star,
  Clock,
  Books,
  X,
  Sparkle,
  Tag,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useStore, useHydrated } from '@/lib/store';
import { parseTags, CATEGORY_STYLE, filterPrompts, extractAllTags } from '@/lib/prompt-utils';
import { cn } from '@/lib/utils';
import type { Prompt } from '@/types';

interface FloatingSidebarProps {
  onSelectPrompt: (prompt: Prompt) => void;
}

// Formatear fecha de manera consistente (solo en cliente)
function formatDate(dateString: string): string {
  if (typeof window === 'undefined') return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function FloatingSidebar({ onSelectPrompt }: FloatingSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isHydrated = useHydrated();
  
  const {
    prompts,
    categories,
    copiedHistory,
    promptsLoadingState,
    error: _error,
    initialize,
  } = useStore();
  
  // Obtener todos los tags únicos
  const allTags = useMemo(() => isHydrated ? extractAllTags(prompts) : [], [prompts, isHydrated]);
  
  // Filtrar prompts localmente para la sidebar
  // Esto es independiente de los filtros de la página principal
  const [localSearch, setLocalSearch] = useState('');
  const [localCategory, setLocalCategory] = useState<string | null>(null);
  const [localTags, setLocalTags] = useState<string[]>([]);
  
  const filteredPrompts = useMemo(() => {
    if (!isHydrated) return [];
    return filterPrompts(prompts, {
      search: localSearch,
      category: localCategory,
      tags: localTags,
      onlyFavorites: false,
    });
  }, [prompts, localSearch, localCategory, localTags, isHydrated]);
  
  // Favoritos filtrados
  const filteredFavorites = useMemo(() => {
    if (!isHydrated) return [];
    return filterPrompts(prompts, {
      search: localSearch,
      category: localCategory,
      tags: localTags,
      onlyFavorites: true,
    });
  }, [prompts, localSearch, localCategory, localTags, isHydrated]);
  
  // Manejar atajo de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
        e.preventDefault();
        setIsExpanded(prev => !prev);
      }
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);
  
  // Click outside to close
  useEffect(() => {
    if (!isExpanded) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);
  
  // Toggle tag local
  const handleToggleTag = (tag: string) => {
    setLocalTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // Limpiar filtros locales
  const handleClearFilters = () => {
    setLocalSearch('');
    setLocalCategory(null);
    setLocalTags([]);
  };
  
  const hasActiveFilters = localSearch || localCategory || localTags.length > 0;
  const isLoading = !isHydrated || promptsLoadingState === 'loading';
  const hasError = promptsLoadingState === 'error';
  
  // No renderizar hasta que esté hidratado para evitar mismatch
  if (!isHydrated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50",
                "bg-primary hover:bg-primary/90",
                "transition-all duration-200"
              )}
              onClick={() => setIsExpanded(true)}
            >
              <Sparkle weight="regular" className="h-5 w-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Abrir Prompt Manager (Ctrl+Shift+P)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return (
    <>
      {/* Botón flotante cuando está colapsado */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className={cn(
                "fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg z-50",
                "bg-primary hover:bg-primary/90",
                "transition-all duration-200",
                isExpanded && "scale-0"
              )}
              onClick={() => setIsExpanded(true)}
            >
              <Sparkle weight="regular" className="h-5 w-5 text-white" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>Abrir Prompt Manager (Ctrl+Shift+P)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* Panel lateral expandible */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed right-0 top-0 h-full z-50 transition-transform duration-300",
          "bg-background border-l shadow-2xl",
          isExpanded ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: '420px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Sparkle weight="regular" className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Prompt Manager</h2>
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs text-muted-foreground"
              >
                Limpiar
              </Button>
            )}
            {hasError && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => initialize()}
                className="text-xs text-destructive"
              >
                <ArrowClockwise weight="regular" className="h-3 w-3 mr-1" />
                Reintentar
              </Button>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                  >
                    <X weight="regular" className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Cerrar (Esc)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Búsqueda */}
        <div className="p-3 border-b">
          <div className="relative">
            <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, descripción o tag..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* Categorías */}
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-2">Categorías</p>
          <ScrollArea className="max-h-16">
            <div className="flex flex-wrap gap-1">
              <Button
                variant={localCategory === null ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setLocalCategory(null)}
              >
                Todas
              </Button>
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={localCategory === cat.name ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setLocalCategory(cat.name)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Tags populares */}
        {allTags.length > 0 && (
          <div className="p-3 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Tag weight="regular" className="h-3 w-3" />
              Etiquetas
            </p>
            <ScrollArea className="max-h-20">
              <div className="flex flex-wrap gap-1">
                {allTags.slice(0, 20).map(tag => (
                  <Badge
                    key={tag}
                    variant={localTags.includes(tag) ? 'default' : 'secondary'}
                    className="cursor-pointer text-xs px-1.5 py-0"
                    onClick={() => handleToggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        {/* Tabs */}
        <Tabs defaultValue="all" className="flex-1">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-3">
            <TabsTrigger value="all" className="text-xs data-[state=active]:bg-background">
              <Books weight="regular" className="h-3 w-3 mr-1" />
              Todos ({filteredPrompts.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="text-xs data-[state=active]:bg-background">
              <Star weight="regular" className="h-3 w-3 mr-1" />
              Favoritos ({filteredFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-xs data-[state=active]:bg-background">
              <Clock weight="regular" className="h-3 w-3 mr-1" />
              Recientes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="p-2 space-y-2">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Cargando...</p>
                  </div>
                ) : hasError ? (
                  <div className="text-center py-8">
                    <X weight="regular" className="h-8 w-8 mx-auto mb-2 text-destructive" />
                    <p className="text-sm text-muted-foreground">Error al cargar</p>
                    <Button size="sm" variant="outline" onClick={() => initialize()} className="mt-2">
                      Reintentar
                    </Button>
                  </div>
                ) : (
                  <>
                    {filteredPrompts.map(prompt => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onClick={() => {
                          onSelectPrompt(prompt);
                          setIsExpanded(false);
                        }}
                        selectedTags={localTags}
                        onTagClick={handleToggleTag}
                      />
                    ))}
                    {filteredPrompts.length === 0 && (
                      <div className="text-center text-muted-foreground py-8">
                        <Books weight="regular" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No se encontraron prompts</p>
                        {hasActiveFilters && (
                          <Button
                            variant="link"
                            size="sm"
                            onClick={handleClearFilters}
                            className="mt-2"
                          >
                            Limpiar filtros
                          </Button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="favorites" className="m-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="p-2 space-y-2">
                {filteredFavorites.map(prompt => (
                  <PromptCard
                    key={prompt.id}
                    prompt={prompt}
                    onClick={() => {
                      onSelectPrompt(prompt);
                      setIsExpanded(false);
                    }}
                    selectedTags={localTags}
                    onTagClick={handleToggleTag}
                  />
                ))}
                {filteredFavorites.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Star weight="regular" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tienes favoritos aún</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="recent" className="m-0">
            <ScrollArea className="h-[calc(100vh-380px)]">
              <div className="p-2 space-y-2">
                {copiedHistory.slice(0, 10).map((item, idx) => {
                  const originalPrompt = prompts.find(p => p.id === item.promptId);
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => {
                        if (originalPrompt) {
                          onSelectPrompt(originalPrompt);
                          setIsExpanded(false);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.promptTitle}</p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono tabular-nums">
                            {formatDate(item.copiedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {copiedHistory.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock weight="regular" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay prompts recientes</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Footer con atajos */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-muted/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">Ctrl</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">Shift</kbd>
              +
              <kbd className="px-1.5 py-0.5 bg-background rounded border text-xs">P</kbd>
            </span>
            <span className="font-mono tabular-nums">{filteredPrompts.length} de {prompts.length} prompts</span>
          </div>
        </div>
      </div>
    </>
  );
}

// Componente de tarjeta de prompt
function PromptCard({ 
  prompt, 
  onClick,
  selectedTags,
  onTagClick 
}: { 
  prompt: Prompt; 
  onClick: () => void;
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}) {
  const category = prompt.category.name;
  const tags = parseTags(prompt.tags);

  return (
    <div
      className="p-3 rounded-lg border bg-card hover:bg-accent cursor-pointer transition-colors group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{prompt.title}</p>
            {prompt.isFavorite && (
              <Star weight="fill" className="h-3 w-3 fill-primary text-primary flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {prompt.description}
          </p>
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            <Badge className={cn("text-xs px-1.5 py-0", CATEGORY_STYLE)}>
              {category}
            </Badge>
            <Badge variant="outline" className="text-xs px-1.5 py-0 font-mono tabular-nums">
              v{prompt.version}
            </Badge>
            {prompt.riskLevel === 'high' && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                Riesgo
              </Badge>
            )}
          </div>
          {/* Tags clickeables */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 4).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'secondary'}
                  className="text-xs px-1 py-0 cursor-pointer hover:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick(tag);
                  }}
                >
                  #{tag}
                </Badge>
              ))}
              {tags.length > 4 && (
                <span className="text-xs text-muted-foreground font-mono tabular-nums">+{tags.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
