'use client';

import { useEffect, useState } from 'react';
import {
  Books,
  Star,
  ChartBar,
  Plus,
  MagnifyingGlass,
  GridFour,
  List,
  WarningCircle,
  ArrowClockwise,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SecurityBanner } from '@/components/prompt-manager/security-banner';
import { PromptComposer } from '@/components/prompt-manager/prompt-composer';
import { FloatingSidebar } from '@/components/prompt-manager/floating-sidebar';
import { StatsDashboard } from '@/components/prompt-manager/stats-dashboard';
import { PromptEditor } from '@/components/prompt-manager/prompt-editor';
import { useStore, useHydrated } from '@/lib/store';
import { parseTags, CATEGORY_STYLE } from '@/lib/prompt-utils';
import { cn } from '@/lib/utils';
import type { Prompt } from '@/types';
import { toast } from 'sonner';

export default function PromptManagerPage() {
  const {
    prompts,
    categories,
    activeTab,
    setActiveTab,
    selectedPrompt,
    setSelectedPrompt,
    isComposerOpen,
    setComposerOpen,
    isEditorOpen,
    setEditorOpen,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    promptsLoadingState,
    error,
    initialize,
    fetchPrompts,
    fetchStats,
    getFilteredPrompts,
    currentUser,
  } = useStore();
  
  const isHydrated = useHydrated();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  
  // Inicializar una sola vez después de la hidratación
  useEffect(() => {
    if (isHydrated) {
      initialize();
    }
  }, [isHydrated, initialize]);
  
  // Obtener prompts filtrados usando la función del store
  const filteredPrompts = getFilteredPrompts();
  
  // Manejar selección de prompt
  const handleSelectPrompt = (prompt: Prompt) => {
    setSelectedPrompt(prompt);
    setComposerOpen(true);
  };
  
  // Abrir editor para nuevo prompt
  const handleNewPrompt = () => {
    setEditingPrompt(null);
    setEditorOpen(true);
  };
  
  // Abrir editor para editar
  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setEditorOpen(true);
  };
  
  // Guardar prompt
  const handleSavePrompt = async () => {
    await fetchPrompts();
    await fetchStats();
  };
  
  // Publicar prompt
  const handlePublishPrompt = async (promptId: string) => {
    try {
      const res = await fetch(`/api/prompts/${promptId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      
      if (!res.ok) throw new Error('Error al publicar');
      
      toast.success('Prompt publicado correctamente');
      await fetchPrompts();
      await fetchStats();
    } catch (error) {
      logger.error('Error publishing prompt', { error: error instanceof Error ? error.message : String(error) });
      toast.error('Error al publicar');
    }
  };
  
  // Dar feedback
  const handleFeedback = async (promptId: string, feedback: 'thumbs_up' | 'thumbs_down') => {
    try {
      await fetch(`/api/prompts/${promptId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      
      await fetchPrompts();
    } catch (error) {
      logger.error('Error submitting feedback', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  // Tab label para breadcrumb
  const getTabLabel = (tab: typeof activeTab) => {
    switch (tab) {
      case 'library': return 'Todos';
      case 'favorites': return 'Favoritos';
      case 'stats': return 'Estadísticas';
      default: return tab;
    }
  };
  
  // Estados de carga
  const isLoading = !isHydrated || promptsLoadingState === 'loading';
  const hasError = promptsLoadingState === 'error';
  
  // Mostrar loading mientras se hidrata o cargan datos
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Books weight="regular" className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Prompt Manager</h1>
                  <p className="text-xs text-muted-foreground">
                    Biblioteca / {getTabLabel(activeTab)} • {prompts.length} prompts
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                {currentUser?.name || 'Usuario'}
              </Badge>
              <Button onClick={handleNewPrompt}>
                <Plus weight="regular" className="h-4 w-4 mr-2" />
                Nuevo Prompt
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Banner de seguridad */}
      <div className="container mx-auto px-4 pt-4">
        <SecurityBanner />
      </div>
      
      {/* Error banner */}
      {hasError && (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 p-4 rounded-lg border border-destructive/50 bg-destructive/10">
            <WarningCircle weight="fill" className="h-5 w-5 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Error al cargar prompts</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => initialize()}
            >
              <ArrowClockwise weight="regular" className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="container mx-auto px-4 py-4 flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="library" className="gap-1" aria-label="Biblioteca">
                <Books weight="regular" className="h-4 w-4" />
                <span className="hidden sm:inline">Biblioteca</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="gap-1" aria-label="Favoritos">
                <Star weight="regular" className="h-4 w-4" />
                <span className="hidden sm:inline">Favoritos</span>
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1" aria-label="Estadísticas">
                <ChartBar weight="regular" className="h-4 w-4" />
                <span className="hidden sm:inline">Estadísticas</span>
              </TabsTrigger>
            </TabsList>
            
            {activeTab !== 'stats' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    data-testid="search-input"
                    placeholder="Buscar prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={selectedCategory || '__all__'} onValueChange={(v) => setSelectedCategory(v === '__all__' ? null : v)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="flex border rounded-lg" data-testid="view-toggle">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                    data-testid="view-toggle-grid"
                  >
                    <GridFour weight="regular" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                    data-testid="view-toggle-list"
                  >
                    <List weight="regular" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                <p className="text-muted-foreground">Cargando prompts...</p>
              </div>
            </div>
          )}
          
          {/* Tab: Biblioteca */}
          <TabsContent value="library" className="m-0">
            {!isLoading && (
              <>
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPrompts.map(prompt => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onSelect={() => handleSelectPrompt(prompt)}
                        onEdit={() => handleEditPrompt(prompt)}
                        onPublish={() => handlePublishPrompt(prompt.id)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredPrompts.map(prompt => (
                      <PromptListItem
                        key={prompt.id}
                        prompt={prompt}
                        onSelect={() => handleSelectPrompt(prompt)}
                        onEdit={() => handleEditPrompt(prompt)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                )}
                
                {filteredPrompts.length === 0 && (
                  <div className="text-center py-12">
                    <Books weight="regular" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium">No se encontraron prompts</h3>
                    <p className="text-muted-foreground mt-1">
                      {searchQuery ? 'Intenta con otra búsqueda' : 'Crea tu primer prompt para comenzar'}
                    </p>
                    <Button className="mt-4" onClick={handleNewPrompt}>
                      <Plus weight="regular" className="h-4 w-4 mr-2" />
                      Crear Prompt
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Tab: Favoritos */}
          <TabsContent value="favorites" className="m-0">
            {!isLoading && (
              <>
                {filteredPrompts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPrompts.map(prompt => (
                      <PromptCard
                        key={prompt.id}
                        prompt={prompt}
                        onSelect={() => handleSelectPrompt(prompt)}
                        onEdit={() => handleEditPrompt(prompt)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Star weight="regular" className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-medium">No tienes favoritos</h3>
                    <p className="text-muted-foreground mt-1">
                      Marca prompts como favoritos para acceder rápidamente
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          {/* Tab: Estadísticas */}
          <TabsContent value="stats" className="m-0">
            <StatsDashboard />
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Footer */}
      <footer className="border-t mt-auto py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Prompt Manager © 2025 • 
            Usa este panel para copiar prompts a tu IA favorita (ChatGPT, Copilot, Gemini)
          </p>
          <p className="text-xs mt-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded border">Ctrl</kbd> + 
            <kbd className="px-1.5 py-0.5 bg-muted rounded border">Shift</kbd> + 
            <kbd className="px-1.5 py-0.5 bg-muted rounded border">P</kbd> para abrir panel rápido
          </p>
        </div>
      </footer>
      
      {/* Sidebar flotante */}
      <FloatingSidebar onSelectPrompt={handleSelectPrompt} />
      
      {/* Composer modal */}
      <PromptComposer
        prompt={selectedPrompt}
        open={isComposerOpen}
        onOpenChange={setComposerOpen}
      />
      
      {/* Editor modal */}
      <PromptEditor
        prompt={editingPrompt}
        open={isEditorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSavePrompt}
      />
    </div>
  );
}

// Componente de tarjeta de prompt (vista grid)
function PromptCard({
  prompt,
  onSelect,
  onEdit: _onEdit,
  onPublish,
  onFeedback: _onFeedback,
}: {
  prompt: Prompt;
  onSelect: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onFeedback: (feedback: 'thumbs_up' | 'thumbs_down') => void;
}) {
  const tags = parseTags(prompt.tags);
  const rating = prompt.thumbsUp + prompt.thumbsDown > 0
    ? Math.round((prompt.thumbsUp / (prompt.thumbsUp + prompt.thumbsDown)) * 100)
    : null;

  return (
    <div
      data-testid="prompt-card"
      className="group rounded-lg border bg-card hover:border-primary/50 transition-all cursor-pointer overflow-hidden"
      onClick={onSelect}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{prompt.category.name}</span>
          </div>
          <div className="flex items-center gap-1">
            {prompt.isFavorite && (
              <Star weight="fill" className="h-4 w-4 fill-primary text-primary" />
            )}
            {prompt.status !== 'published' && (
              <Badge variant="outline" className="text-xs">
                {prompt.status}
              </Badge>
            )}
          </div>
        </div>
        
        <h3 className="font-medium line-clamp-1 mb-1">{prompt.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {prompt.description}
        </p>
        
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground font-mono tabular-nums">+{tags.length - 3}</span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
            <span>{prompt.useCount} usos</span>
            {rating !== null && (
              <>
                <span>•</span>
                <span className="text-success">{rating}% útil</span>
              </>
            )}
          </div>

          <Badge
            variant={prompt.riskLevel === 'high' ? 'destructive' : 'secondary'}
            className="text-xs font-mono tabular-nums"
          >
            v{prompt.version}
          </Badge>
        </div>
      </div>
      
      <div className="border-t bg-muted/30 p-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onPublish && prompt.status === 'draft' && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); onPublish(); }}
          >
            Publicar
          </Button>
        )}
        <Button 
          variant="default" 
          size="sm"
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
          Usar
        </Button>
      </div>
    </div>
  );
}

// Componente de lista de prompt (vista lista)
function PromptListItem({
  prompt,
  onSelect,
  onEdit: _onEdit,
  onFeedback: _onFeedback,
}: {
  prompt: Prompt;
  onSelect: () => void;
  onEdit: () => void;
  onFeedback: (feedback: 'thumbs_up' | 'thumbs_down') => void;
}) {
  const tags = parseTags(prompt.tags);

  return (
    <div
      className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{prompt.title}</h3>
          {prompt.isFavorite && (
            <Star weight="fill" className="h-4 w-4 fill-primary text-primary flex-shrink-0" />
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">{prompt.description}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge className={cn("text-xs", CATEGORY_STYLE)}>
          {prompt.category.name}
        </Badge>
        <Badge variant="outline" className="text-xs font-mono tabular-nums">v{prompt.version}</Badge>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">{prompt.useCount} usos</span>
      </div>
      
      <Button variant="default" size="sm" className="flex-shrink-0">
        Usar
      </Button>
    </div>
  );
}
