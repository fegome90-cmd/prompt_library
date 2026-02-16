// Tipos para el Prompt Manager

// Enum types matching Prisma schema
export type PromptStatus = 'draft' | 'review' | 'published' | 'deprecated'
export type RiskLevel = 'low' | 'medium' | 'high'
export type UserRole = 'owner' | 'editor' | 'reviewer' | 'user'

export interface VariableSchema {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select';
  help?: string;
  required?: boolean;
  options?: string[];
}

export interface PromptExample {
  input: Record<string, string>;
  output: string;
}

export interface Prompt {
  id: string;
  title: string;
  description: string;
  body: string;
  categoryId: string;
  category: {
    id: string;
    name: string;
    color?: string;
    icon?: string;
  };
  tags: string[];
  variablesSchema: VariableSchema[];
  outputFormat?: string;
  examples: PromptExample[];
  status: PromptStatus;
  riskLevel: RiskLevel;
  version: string;
  changelog?: string;
  useCount: number;
  thumbsUp: number;
  thumbsDown: number;
  isFavorite: boolean;
  author: {
    id: string;
    name: string;
    email: string;
  };
  reviewer?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deprecatedAt?: string;
  deletedAt?: string;
  deletedBy?: string;
  versions?: PromptVersion[];
}

export interface PromptVersion {
  id: string;
  promptId: string;
  version: string;
  body: string;
  variablesSchema: VariableSchema[];
  outputFormat?: string;
  changelog?: string;
  authorId: string;
  createdAt: string;
}

export interface PromptUsage {
  id: string;
  promptId: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  feedback?: 'thumbs_up' | 'thumbs_down';
  comment?: string;
  dataRiskLevel?: RiskLevel;
  variablesUsed?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  order: number;
  promptsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  promptId?: string;
  userId: string;
  user?: User;
  action: string;
  details: string;
  createdAt: string;
}

export interface Stats {
  overview: {
    totalPrompts: number;
    publishedPrompts: number;
    draftPrompts: number;
    reviewPrompts: number;
    deprecatedPrompts: number;
    totalCategories: number;
    totalUsage: number;
    totalThumbsUp: number;
    totalThumbsDown: number;
    avgRating: number;
    recentUsage: number;
  };
  topPrompts: Array<{
    id: string;
    title: string;
    category: string;
    useCount: number;
    thumbsUp: number;
    thumbsDown: number;
  }>;
  bestRatedPrompts: Array<{
    id: string;
    title: string;
    category: string;
    useCount: number;
    thumbsUp: number;
    thumbsDown: number;
  }>;
  problematicPrompts: Array<{
    id: string;
    title: string;
    category: string;
    useCount: number;
    thumbsUp: number;
    thumbsDown: number;
  }>;
  usageByCategory: Array<{
    category: string;
    color: string;
    promptsCount: number;
    totalUses: number;
  }>;
}

// Tipo para el historial de copiados
export interface CopiedPrompt {
  promptId: string;
  promptTitle: string;
  generatedText: string;
  variables: Record<string, string>;
  copiedAt: string;
}
