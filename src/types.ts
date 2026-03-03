export interface AITool {
  id: string;
  name: string;
  url: string;
  description: string;
  logo_url: string;
  rating: number;
  usage_level: 'low' | 'medium' | 'high';
  notes: string;
  category: string;
  tags: string[];
  is_favorite: boolean;
  usage_count: number;
  last_used_at: string | null;
  display_order: number;
  created_at: string;
}

export interface DashboardStats {
  totalTools: number;
  categoryStats: { category: string; count: number }[];
  unusedTools: AITool[];
  topTools: AITool[];
}
