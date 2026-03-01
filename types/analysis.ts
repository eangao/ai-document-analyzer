export type DocumentType =
  | "contract"
  | "invoice"
  | "report"
  | "letter"
  | "legal"
  | "financial"
  | "other";

export type RiskSeverity = "high" | "medium" | "low";

export type FinancialCategory = "payment" | "penalty" | "total" | "discount";

export type ObligationStatus = "active" | "completed" | "pending" | "overdue";

export interface Entity {
  name: string;
  type: string;
  confidence: number;
  context: string;
}

export interface KeyDate {
  date: string;
  description: string;
  importance: RiskSeverity;
}

export interface FinancialItem {
  description: string;
  amount: number;
  currency: string;
  category: FinancialCategory;
}

export interface Obligation {
  party: string;
  description: string;
  deadline: string;
  status: ObligationStatus;
}

export interface RiskFlag {
  title: string;
  description: string;
  severity: RiskSeverity;
}

export interface KeyTerm {
  term: string;
  definition: string;
  category: string;
}

export interface DocumentAnalysis {
  summary: string;
  documentType: DocumentType;
  keyEntities: Entity[];
  keyDates: KeyDate[];
  financialItems: FinancialItem[];
  obligations: Obligation[];
  riskFlags: RiskFlag[];
  keyTerms: KeyTerm[];
  actionItems: string[];
}
