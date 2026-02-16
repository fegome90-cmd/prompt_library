import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { normalizePrompts, filterPrompts, extractAllTags } from '@/lib/prompt-utils';
import { logger } from '@/lib/logger';
import type { Prompt, Category, CopiedPrompt, User, Stats } from '@/types';

// Estados de carga
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

interface PromptManagerState {
  // ========== DATOS ==========
  prompts: Prompt[];
  categories: Category[];
  currentUser: User | null;
  stats: Stats | null;
  
  // ========== ESTADOS DE CARGA ==========
  promptsLoadingState: LoadingState;
  categoriesLoadingState: LoadingState;
  error: string | null;
  _hasHydrated: boolean;
  
  // ========== UI STATE ==========
  sidebarOpen: boolean;
  selectedPrompt: Prompt | null;
  isComposerOpen: boolean;
  isEditorOpen: boolean;
  activeTab: 'library' | 'favorites' | 'stats';
  
  // ========== HISTORIAL ==========
  copiedHistory: CopiedPrompt[];
  
  // ========== FILTROS (SOLO UI) ==========
  searchQuery: string;
  selectedCategory: string | null;
  selectedTags: string[];
  
  // ========== SETTERS ==========
  setPrompts: (prompts: Prompt[]) => void;
  setCategories: (categories: Category[]) => void;
  setCurrentUser: (user: User | null) => void;
  setStats: (stats: Stats | null) => void;
  setError: (error: string | null) => void;
  setHasHydrated: (state: boolean) => void;
  
  setSidebarOpen: (open: boolean) => void;
  setSelectedPrompt: (prompt: Prompt | null) => void;
  setComposerOpen: (open: boolean) => void;
  setEditorOpen: (open: boolean) => void;
  setActiveTab: (tab: 'library' | 'favorites' | 'stats') => void;
  
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
  
  addToCopiedHistory: (item: CopiedPrompt) => void;
  clearCopiedHistory: () => void;
  
  toggleFavorite: (promptId: string) => Promise<void>;
  
  // ========== FETCH ACTIONS ==========
  fetchPrompts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchUser: () => Promise<void>;
  initialize: () => Promise<void>;
  
  // ========== DERIVED DATA (computed) ==========
  getFilteredPrompts: () => Prompt[];
  getAllTags: () => string[];
}

export const useStore = create<PromptManagerState>()(
  persist(
    (set, get) => ({
      // ========== ESTADO INICIAL ==========
      prompts: [],
      categories: [],
      currentUser: null,
      stats: null,
      
      promptsLoadingState: 'idle',
      categoriesLoadingState: 'idle',
      error: null,
      _hasHydrated: false,
      
      sidebarOpen: false,
      selectedPrompt: null,
      isComposerOpen: false,
      isEditorOpen: false,
      activeTab: 'library',
      
      copiedHistory: [],
      
      searchQuery: '',
      selectedCategory: null,
      selectedTags: [],
      
      // ========== SETTERS ==========
      setPrompts: (prompts) => set({ prompts, promptsLoadingState: 'success' }),
      setCategories: (categories) => set({ categories, categoriesLoadingState: 'success' }),
      setCurrentUser: (currentUser) => set({ currentUser }),
      setStats: (stats) => set({ stats }),
      setError: (error) => set({ error, promptsLoadingState: error ? 'error' : 'idle' }),
      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
      
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setSelectedPrompt: (selectedPrompt) => set({ selectedPrompt }),
      setComposerOpen: (isComposerOpen) => set({ isComposerOpen }),
      setEditorOpen: (isEditorOpen) => set({ isEditorOpen }),
      setActiveTab: (activeTab) => set({ activeTab }),
      
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
      setSelectedTags: (selectedTags) => set({ selectedTags }),
      
      toggleTag: (tag) => {
        const { selectedTags } = get();
        const newTags = selectedTags.includes(tag)
          ? selectedTags.filter(t => t !== tag)
          : [...selectedTags, tag];
        set({ selectedTags: newTags });
      },
      
      clearFilters: () => set({ 
        searchQuery: '', 
        selectedCategory: null, 
        selectedTags: [] 
      }),
      
      addToCopiedHistory: (item) => set((state) => ({
        copiedHistory: [item, ...state.copiedHistory].slice(0, 10),
      })),
      
      clearCopiedHistory: () => set({ copiedHistory: [] }),
      
      toggleFavorite: async (promptId) => {
        const prompt = get().prompts.find(p => p.id === promptId);
        if (!prompt) return;
        
        const newValue = !prompt.isFavorite;
        
        // Optimistic update
        set((state) => ({
          prompts: state.prompts.map(p => 
            p.id === promptId ? { ...p, isFavorite: newValue } : p
          ),
        }));
        
        try {
          const res = await fetch(`/api/prompts/${promptId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ isFavorite: newValue }),
          });
          
          if (!res.ok) {
            // Revert on error
            set((state) => ({
              prompts: state.prompts.map(p => 
                p.id === promptId ? { ...p, isFavorite: !newValue } : p
              ),
            }));
            set({ error: 'Error al actualizar favorito' });
          }
        } catch (_error) {
          // Revert on error
          set((state) => ({
            prompts: state.prompts.map(p => 
              p.id === promptId ? { ...p, isFavorite: !newValue } : p
            ),
          }));
          set({ error: 'Error de conexión' });
        }
      },
      
      // ========== FETCH ACTIONS ==========
      fetchPrompts: async () => {
        set({ promptsLoadingState: 'loading', error: null });
        
        try {
          const res = await fetch('/api/prompts?status=published');
          
          if (!res.ok) {
            // WO-0014: Try to read error body for better debugging
            let errorDetail = res.statusText;
            try {
              const errorBody = await res.text();
              logger.error('[API Error] /api/prompts', { status: res.status, body: errorBody });
              const parsed = JSON.parse(errorBody);
              errorDetail = parsed.error || parsed.message || errorBody.substring(0, 200);
            } catch {
              // Ignore parse errors
            }
            throw new Error(`Error ${res.status}: ${errorDetail}`);
          }
          
          const data = await res.json();
          const prompts = normalizePrompts(data);
          
          set({ 
            prompts, 
            promptsLoadingState: 'success',
            error: null 
          });
        } catch (error) {
          logger.error('Error fetching prompts', { error: error instanceof Error ? error.message : String(error) });
          set({ 
            promptsLoadingState: 'error',
            error: error instanceof Error ? error.message : 'Error al cargar prompts',
            prompts: [] 
          });
        }
      },
      
      fetchCategories: async () => {
        set({ categoriesLoadingState: 'loading' });
        
        try {
          const res = await fetch('/api/categories');
          
          if (!res.ok) {
            // WO-0014: Try to read error body for better debugging
            let errorDetail = res.statusText;
            try {
              const errorBody = await res.text();
              logger.error('[API Error] /api/categories', { status: res.status, body: errorBody });
              const parsed = JSON.parse(errorBody);
              errorDetail = parsed.error || parsed.message || errorBody.substring(0, 200);
            } catch {
              // Ignore parse errors
            }
            throw new Error(`Error ${res.status}: ${errorDetail}`);
          }
          
          const data = await res.json();
          set({ 
            categories: Array.isArray(data) ? data : [],
            categoriesLoadingState: 'success' 
          });
        } catch (error) {
          logger.error('Error fetching categories', { error: error instanceof Error ? error.message : String(error) });
          set({ 
            categories: [], 
            categoriesLoadingState: 'error' 
          });
        }
      },
      
      fetchStats: async () => {
        try {
          const res = await fetch('/api/stats');
          
          if (!res.ok) {
            throw new Error(`Error ${res.status}`);
          }
          
          const data = await res.json();
          set({ stats: data });
        } catch (error) {
          logger.error('Error fetching stats', { error: error instanceof Error ? error.message : String(error) });
          set({ stats: null });
        }
      },
      
      fetchUser: async () => {
        try {
          const res = await fetch('/api/user');
          
          if (!res.ok) {
            throw new Error(`Error ${res.status}`);
          }
          
          const data = await res.json();
          set({ currentUser: data });
        } catch (error) {
          logger.error('Error fetching user', { error: error instanceof Error ? error.message : String(error) });
          set({ currentUser: null });
        }
      },
      
      initialize: async () => {
        const { fetchPrompts, fetchCategories, fetchStats, fetchUser } = get();

        try {
          // Ejecutar semilla primero (con logging de errores)
          try {
            const res = await fetch('/api/seed');
            if (!res.ok) {
              logger.error('[Store] Seed request failed', { status: res.status });
            }
          } catch (seedError) {
            logger.error('[Store] Seed network error', {
              error: seedError instanceof Error ? seedError.message : String(seedError)
            });
          }

          // Cargar todo en paralelo
          await Promise.all([
            fetchUser(),
            fetchCategories(),
            fetchPrompts(),
            fetchStats(),
          ]);
        } catch (error) {
          logger.error('Error during initialization', { error: error instanceof Error ? error.message : String(error) });
        }
      },
      
      // ========== DERIVED DATA ==========
      getFilteredPrompts: () => {
        const { prompts, searchQuery, selectedCategory, selectedTags, activeTab } = get();
        
        const onlyFavorites = activeTab === 'favorites';
        
        return filterPrompts(prompts, {
          search: searchQuery,
          category: selectedCategory,
          tags: selectedTags,
          onlyFavorites,
        });
      },
      
      getAllTags: () => {
        const { prompts } = get();
        return extractAllTags(prompts);
      },
    }),
    {
      name: 'prompt-manager-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        copiedHistory: state.copiedHistory,
        sidebarOpen: state.sidebarOpen,
        activeTab: state.activeTab,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Hook para verificar si el store está hidratado
export const useHydrated = () => {
  const hasHydrated = useStore((state) => state._hasHydrated);
  return hasHydrated;
};
