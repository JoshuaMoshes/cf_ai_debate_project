// minimal types so TS builds without extra deps
interface VectorizeMatch {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}
interface VectorizeQueryResult {
  matches?: VectorizeMatch[];
}
interface VectorizeIndex {
  query: (vector: number[], opts?: any) => Promise<VectorizeQueryResult>;
  insert: (items: { id: string; values: number[]; metadata?: any }[]) => Promise<any>;
  // helper if your runtime exposes it, otherwise we do manual embed+query in workflow
  queryFromText?: (ai: any, model: string, text: string, opts?: any) => Promise<VectorizeQueryResult>;
}
