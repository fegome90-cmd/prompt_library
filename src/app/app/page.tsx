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
  Keyboard,
  CaretDown,
  CaretUp,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { trackEvent } from '@/lib/analytics';

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
    clearFilters,
    toggleFavorite,
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
  const [commandOpen, setCommandOpen] = useState(false);
  const [desktopControlsCollapsed, setDesktopControlsCollapsed] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Keyboard shortcut for command palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Inicializar una sola vez después de la hidratación
  useEffect(() => {
    if (isHydrated) {
      initialize();
      trackEvent('app_opened', {
        referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct',
      });
    }
  }, [isHydrated, initialize]);

  // Obtener prompts filtrados usando la función del store
  const filteredPrompts = getFilteredPrompts();
  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== null;

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
    await Promise.all([fetchPrompts(), fetchStats()]);
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
      await Promise.all([fetchPrompts(), fetchStats()]);
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_0%,hsl(var(--primary)/0.18),transparent_36%),radial-gradient(circle_at_80%_100%,hsl(var(--primary)/0.12),transparent_42%)]" />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:rounded-md focus:bg-background focus:text-foreground focus:border"
      >
        Saltar al contenido principal
      </a>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-[0_1px_0_hsl(var(--border))]">
        <div className="container mx-auto px-4 py-3 space-y-3 relative">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Books weight="regular" className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold tracking-tight truncate">Prompt Manager</h1>
                <p className="text-xs text-muted-foreground hidden sm:block uppercase tracking-[0.08em]">
                  Biblioteca / {getTabLabel(activeTab)} • {prompts.length} prompts
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {activeTab !== 'stats' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="hidden md:inline-flex"
                    aria-expanded={!desktopControlsCollapsed}
                    aria-controls="desktop-controls"
                    onClick={() => setDesktopControlsCollapsed((prev) => !prev)}
                  >
                    {desktopControlsCollapsed ? (
                      <CaretDown weight="regular" className="h-4 w-4" />
                    ) : (
                      <CaretUp weight="regular" className="h-4 w-4" />
                    )}
                    {desktopControlsCollapsed ? 'Mostrar controles' : 'Ocultar controles'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="md:hidden"
                    aria-label="Abrir filtros"
                    onClick={() => setMobileFiltersOpen(true)}
                  >
                    <SlidersHorizontal weight="regular" className="h-4 w-4" />
                  </Button>
                </>
              )}

              <Badge variant="outline" className="hidden lg:flex">
                {currentUser?.name || 'Usuario'}
              </Badge>
              <Button onClick={handleNewPrompt} size="sm">
                <Plus weight="regular" className="h-4 w-4 mr-1.5" />
                <span className="hidden sm:inline">Nuevo Prompt</span>
                <span className="sm:hidden">Nuevo</span>
              </Button>
            </div>
          </div>

          {activeTab !== 'stats' && (
            <div
              id="desktop-controls"
              className={cn(
                'hidden md:grid grid-cols-[minmax(0,1fr)_180px_auto] items-center gap-3 transition-all duration-200 p-2 rounded-xl border bg-card/40 backdrop-blur-sm',
                desktopControlsCollapsed && 'max-h-0 opacity-0 overflow-hidden pointer-events-none'
              )}
            >
              <div className="relative">
                <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="header-search"
                  placeholder="Buscar prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50"
                />
              </div>

              <Select value={selectedCategory || '__all__'} onValueChange={(v) => setSelectedCategory(v === '__all__' ? null : v)}>
                <SelectTrigger aria-label="Filtrar por categoría">
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

              <div className="flex items-center justify-end gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                )}
                <div className="flex border rounded-lg" data-testid="view-toggle">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-r-none"
                    onClick={() => setViewMode('grid')}
                    data-testid="view-toggle-grid"
                    aria-label="Vista cuadrícula"
                  >
                    <GridFour weight="regular" className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    className="rounded-l-none"
                    onClick={() => setViewMode('list')}
                    data-testid="view-toggle-list"
                    aria-label="Vista lista"
                  >
                    <List weight="regular" className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'stats' && (
            <div className="md:hidden flex items-center gap-2">
              <div className="relative flex-1">
                <MagnifyingGlass weight="regular" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="search-input"
                  placeholder="Buscar prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex border rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  aria-label="Vista cuadrícula"
                >
                  <GridFour weight="regular" className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  aria-label="Vista lista"
                >
                  <List weight="regular" className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Filtros de biblioteca</SheetTitle>
            <SheetDescription>Ajusta categoría y modo de visualización.</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-2 space-y-4">
            <div className="space-y-2">
              <label htmlFor="mobile-category-filter" className="text-sm font-medium">
                Categoría
              </label>
              <Select
                value={selectedCategory || '__all__'}
                onValueChange={(v) => setSelectedCategory(v === '__all__' ? null : v)}
              >
                <SelectTrigger id="mobile-category-filter" aria-label="Filtrar por categoría">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todas</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.name}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Vista</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setViewMode('grid')}
                >
                  <GridFour weight="regular" className="h-4 w-4 mr-2" />
                  Cuadrícula
                </Button>
                <Button
                  type="button"
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setViewMode('list')}
                >
                  <List weight="regular" className="h-4 w-4 mr-2" />
                  Lista
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  clearFilters();
                  setMobileFiltersOpen(false);
                }}
              >
                Limpiar
              </Button>
              <Button type="button" onClick={() => setMobileFiltersOpen(false)}>
                Aplicar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Command Palette */}
      <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
        <CommandInput placeholder="Buscar comandos..." />
        <CommandList>
          <CommandEmpty>No se encontró ningún comando.</CommandEmpty>
          <CommandGroup heading="Navegación">
            <CommandItem onSelect={() => { setActiveTab('library'); setCommandOpen(false); }}>
              <Books weight="regular" className="mr-2 h-4 w-4" />
              <span>Ir a Biblioteca</span>
              <CommandShortcut>⌘1</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setActiveTab('favorites'); setCommandOpen(false); }}>
              <Star weight="regular" className="mr-2 h-4 w-4" />
              <span>Ir a Favoritos</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => { setActiveTab('stats'); setCommandOpen(false); }}>
              <ChartBar weight="regular" className="mr-2 h-4 w-4" />
              <span>Ir a Estadísticas</span>
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Acciones">
            <CommandItem onSelect={() => { handleNewPrompt(); setCommandOpen(false); }}>
              <Plus weight="regular" className="mr-2 h-4 w-4" />
              <span>Crear nuevo prompt</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Vista">
            <CommandItem onSelect={() => { setViewMode('grid'); setCommandOpen(false); }}>
              <GridFour weight="regular" className="mr-2 h-4 w-4" />
              <span>Vista de cuadrícula</span>
            </CommandItem>
            <CommandItem onSelect={() => { setViewMode('list'); setCommandOpen(false); }}>
              <List weight="regular" className="mr-2 h-4 w-4" />
              <span>Vista de lista</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>

      {/* Keyboard shortcut hint */}
      <button
        onClick={() => setCommandOpen(true)}
        className="fixed bottom-4 right-4 flex items-center gap-2 px-3 py-2 rounded-lg border bg-background/95 backdrop-blur text-xs text-muted-foreground hover:bg-accent transition-colors z-50"
        aria-label="Abrir paleta de comandos"
      >
        <Keyboard weight="regular" className="h-4 w-4" />
        <span className="hidden sm:inline">Cmd+K</span>
      </button>

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
      <main id="main-content" className="container mx-auto px-4 py-4 flex-1">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4 relative z-10">
          <div className="flex items-center justify-between gap-3">
            <TabsList className="bg-card/60 border border-border/60">
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
          </div>

          {activeTab !== 'stats' && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2">
              <Badge variant="secondary" className="font-mono tabular-nums">
                {filteredPrompts.length} / {prompts.length} visibles
              </Badge>
              {selectedCategory && (
                <Badge variant="outline">Categoría: {selectedCategory}</Badge>
              )}
              {searchQuery.trim().length > 0 && (
                <Badge variant="outline">Búsqueda: "{searchQuery.trim()}"</Badge>
              )}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="ml-auto" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}

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
                        onToggleFavorite={() => void toggleFavorite(prompt.id)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPrompts.map(prompt => (
                      <PromptListItem
                        key={prompt.id}
                        prompt={prompt}
                        onSelect={() => handleSelectPrompt(prompt)}
                        onEdit={() => handleEditPrompt(prompt)}
                        onPublish={() => handlePublishPrompt(prompt.id)}
                        onToggleFavorite={() => void toggleFavorite(prompt.id)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                )}

                {filteredPrompts.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Books weight="regular" className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No se encontraron prompts</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      {hasActiveFilters
                        ? 'No hay resultados con los filtros actuales. Limpia filtros o intenta otra búsqueda.'
                        : 'Aún no tienes prompts. Crea tu primer prompt para comenzar a construir tu biblioteca.'}
                    </p>
                    {hasActiveFilters ? (
                      <Button variant="outline" onClick={clearFilters}>
                        Limpiar filtros
                      </Button>
                    ) : (
                      <Button onClick={handleNewPrompt}>
                        <Plus weight="regular" className="h-4 w-4 mr-2" />
                        Crear tu primer prompt
                      </Button>
                    )}
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
                        onPublish={() => handlePublishPrompt(prompt.id)}
                        onToggleFavorite={() => void toggleFavorite(prompt.id)}
                        onFeedback={(f) => handleFeedback(prompt.id, f)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Star weight="regular" className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No tienes favoritos</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      {hasActiveFilters
                        ? 'No hay favoritos que coincidan con los filtros activos.'
                        : 'Marca prompts como favoritos para acceder rápidamente desde aquí.'}
                    </p>
                    <div className="flex items-center gap-2">
                      {hasActiveFilters && (
                        <Button variant="outline" onClick={clearFilters}>
                          Limpiar filtros
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setActiveTab('library')}>
                        Explorar biblioteca
                      </Button>
                    </div>
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
      <footer className="border-t mt-auto py-4 relative z-10">
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
  onToggleFavorite,
  onFeedback: _onFeedback,
}: {
  prompt: Prompt;
  onSelect: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onToggleFavorite: () => void;
  onFeedback: (feedback: 'thumbs_up' | 'thumbs_down') => void;
}) {
  const tags = parseTags(prompt.tags);
  const rating = prompt.thumbsUp + prompt.thumbsDown > 0
    ? Math.round((prompt.thumbsUp / (prompt.thumbsUp + prompt.thumbsDown)) * 100)
    : null;

  return (
    <div
      data-testid="prompt-card"
      className="group rounded-2xl border border-border/70 bg-card/70 backdrop-blur-sm hover:border-primary/50 hover:-translate-y-0.5 hover:shadow-[0_12px_36px_hsl(var(--primary)/0.15)] transition-all cursor-pointer overflow-hidden"
      onClick={onSelect}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
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

        <h3 className="font-semibold tracking-tight line-clamp-1">{prompt.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {prompt.description}
        </p>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground font-mono tabular-nums">+{tags.length - 3}</span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          <Badge
            variant={prompt.riskLevel === 'high' ? 'destructive' : 'secondary'}
            className="text-xs font-mono tabular-nums"
          >
            v{prompt.version}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
            <span>{prompt.useCount} usos</span>
            {rating !== null && (
              <>
                <span>•</span>
                <span className="text-success">{rating}% útil</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="border-t bg-gradient-to-r from-muted/20 via-muted/10 to-transparent px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2"
            aria-label={prompt.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
          >
            <Star
              weight={prompt.isFavorite ? 'fill' : 'regular'}
              className={cn('h-4 w-4', prompt.isFavorite && 'fill-primary text-primary')}
            />
          </Button>
          {onPublish && prompt.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => { e.stopPropagation(); onPublish(); }}
            >
              Publicar
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            Usar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de lista de prompt (vista lista)
function PromptListItem({
  prompt,
  onSelect,
  onEdit: _onEdit,
  onPublish,
  onToggleFavorite,
  onFeedback: _onFeedback,
}: {
  prompt: Prompt;
  onSelect: () => void;
  onEdit: () => void;
  onPublish?: () => void;
  onToggleFavorite: () => void;
  onFeedback: (feedback: 'thumbs_up' | 'thumbs_down') => void;
}) {
  const tags = parseTags(prompt.tags);
  const rating = prompt.thumbsUp + prompt.thumbsDown > 0
    ? Math.round((prompt.thumbsUp / (prompt.thumbsUp + prompt.thumbsDown)) * 100)
    : null;

  return (
    <div
      className="flex items-center gap-3 p-4 rounded-xl border border-border/70 bg-card/40 hover:bg-accent/60 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium truncate">{prompt.title}</h3>
          {prompt.status !== 'published' && (
            <Badge variant="outline" className="text-xs">
              {prompt.status}
            </Badge>
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
        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono tabular-nums">
          <span>{prompt.useCount} usos</span>
          {rating !== null && (
            <>
              <span>•</span>
              <span className="text-success">{rating}% útil</span>
            </>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2 flex-shrink-0">
        <Badge className={cn("text-xs", CATEGORY_STYLE)}>
          {prompt.category.name}
        </Badge>
        <Badge variant="outline" className="text-xs font-mono tabular-nums">v{prompt.version}</Badge>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          aria-label={prompt.isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Star
            weight={prompt.isFavorite ? 'fill' : 'regular'}
            className={cn('h-4 w-4', prompt.isFavorite && 'fill-primary text-primary')}
          />
        </Button>
        {onPublish && prompt.status === 'draft' && (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={(e) => {
              e.stopPropagation();
              onPublish();
            }}
          >
            Publicar
          </Button>
        )}
        <Button
          variant="default"
          size="sm"
          className="flex-shrink-0 h-8"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Usar
        </Button>
      </div>
    </div>
  );
}
