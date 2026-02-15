'use client';

import { useEffect } from 'react';
import {
  TrendUp,
  TrendDown,
  Books,
  ThumbsUp,
  ThumbsDown,
  ChartBar,
  Warning,
  Sparkle,
} from '@phosphor-icons/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStore } from '@/lib/store';

export function StatsDashboard() {
  const { stats, fetchStats } = useStore();
  
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Cargando estadísticas...</div>
      </div>
    );
  }
  
  const { overview, topPrompts, bestRatedPrompts, problematicPrompts, usageByCategory } = stats;
  
  return (
    <div className="space-y-6">
      {/* KPIs principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          title="Prompts Publicados"
          value={overview.publishedPrompts}
          description={`${overview.draftPrompts} en borrador`}
          icon={<Books weight="regular" className="h-4 w-4" />}
        />
        <KPICard
          title="Usos Totales"
          value={overview.totalUsage}
          description={`${overview.recentUsage} esta semana`}
          icon={<ChartBar weight="regular" className="h-4 w-4" />}
        />
        <KPICard
          title="Satisfacción"
          value={`${overview.avgRating}%`}
          description={`${overview.totalThumbsUp + overview.totalThumbsDown} feedbacks`}
          icon={<ThumbsUp weight="regular" className="h-4 w-4" />}
        />
        <KPICard
          title="Categorías"
          value={overview.totalCategories}
          description="activas"
          icon={<Sparkle weight="regular" className="h-4 w-4" />}
        />
      </div>
      
      {/* Gráficos y listas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top prompts más usados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendUp weight="regular" className="h-4 w-4" />
              Más Usados
            </CardTitle>
            <CardDescription>Top 5 prompts por frecuencia de uso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPrompts.map((prompt, idx) => (
                <div key={prompt.id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-mono tabular-nums">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prompt.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono tabular-nums">
                      <span>{prompt.useCount} usos</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp weight="regular" className="h-3 w-3" /> {prompt.thumbsUp}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {topPrompts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin datos aún
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Mejor valorados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsUp weight="regular" className="h-4 w-4 text-primary" />
              Mejor Valorados
            </CardTitle>
            <CardDescription>Prompts con mejor feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bestRatedPrompts.map((prompt) => {
                const total = prompt.thumbsUp + prompt.thumbsDown;
                const rating = total > 0 ? Math.round((prompt.thumbsUp / total) * 100) : 0;
                return (
                  <div key={prompt.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{prompt.title}</p>
                      <span className="text-xs text-muted-foreground font-mono tabular-nums">{rating}%</span>
                    </div>
                    <Progress value={rating} className="h-1.5" />
                  </div>
                );
              })}
              {bestRatedPrompts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Necesitas más usos para mostrar ratings
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Prompts problemáticos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Warning weight="fill" className="h-4 w-4 text-red-500" />
              Requieren Atención
            </CardTitle>
            <CardDescription>Prompts con feedback negativo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {problematicPrompts.map((prompt) => (
                <div key={prompt.id} className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
                  <TrendDown weight="regular" className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{prompt.title}</p>
                    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-mono tabular-nums">
                      <ThumbsDown weight="regular" className="h-3 w-3" /> {prompt.thumbsDown} negativos
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">Revisar</Badge>
                </div>
              ))}
              {problematicPrompts.length === 0 && (
                <div className="text-center py-4">
                  <div className="text-success mb-2">✓</div>
                  <p className="text-sm text-muted-foreground">
                    ¡Todos los prompts tienen buena recepción!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Uso por categoría */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ChartBar weight="regular" className="h-4 w-4" />
              Por Categoría
            </CardTitle>
            <CardDescription>Distribución de uso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usageByCategory.map((cat) => {
                const maxUses = Math.max(...usageByCategory.map(c => c.totalUses), 1);
                const percentage = (cat.totalUses / maxUses) * 100;
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{cat.category}</span>
                      <span className="text-muted-foreground font-mono tabular-nums">
                        {cat.promptsCount} prompts • {cat.totalUses} usos
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: cat.color || '#888',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente de KPI
function KPICard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-2xl font-bold font-mono tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{title}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted text-muted-foreground">
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 font-mono tabular-nums">{description}</p>
      </CardContent>
    </Card>
  );
}
