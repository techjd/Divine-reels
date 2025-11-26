// Types representing God entities surfaced via the API layer.
export interface GodSummary {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
}

export interface GodDetail extends GodSummary {
  description?: string;
  followerCount: number;
}

// Pagination wrapper returned by the gods list endpoint.
export interface PaginatedGods {
  items: GodDetail[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}
