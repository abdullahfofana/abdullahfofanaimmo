export type SuggestionImpact = 'high' | 'medium' | 'experimental';

export interface ProjectSuggestion {
  id: string;
  title: string;
  summary: string;
  impact: SuggestionImpact;
  effort: 'low' | 'medium' | 'high';
  tags: string[];
  details: string;
}

export const projectSuggestions: ProjectSuggestion[] = [
  {
    id: 'hyperlocal-matching',
    title: 'Hyperlocal Buyer & Seller Matching',
    summary: 'Pair listings with active buyer intents using proximity, price fit, and behavior signals.',
    impact: 'high',
    effort: 'high',
    tags: ['AI', 'Matching', 'Personalization'],
    details:
      'Extend the SearchIntent backend to score matches in real-time, surface urgency badges to sellers, and notify buyers when a perfect-fit property appears within their saved radius.',
  },
  {
    id: 'immersive-tours',
    title: 'Immersive Media Layer',
    summary: 'Upgrade listings with 360° tours, guided audio, and rich media storytelling.',
    impact: 'medium',
    effort: 'medium',
    tags: ['Experience', 'Media'],
    details:
      'Leverage WebGL-friendly viewers and lightweight narration scripts so prospects can explore every room virtually, boosting dwell time and lead quality without requiring heavy native modules.',
  },
  {
    id: 'smart-finance',
    title: 'Smart Financing Companion',
    summary: 'Interactive affordability calculators, lender pre-approvals, and fee transparency.',
    impact: 'high',
    effort: 'medium',
    tags: ['Fintech', 'Trust'],
    details:
      'Bundle mortgage estimators, notary fee guides, and savings goal trackers inside the add-property and buyer flows to reduce friction for first-time homeowners in Côte d’Ivoire.',
  },
  {
    id: 'seller-workflow',
    title: 'Pro Seller Workflow Automation',
    summary: 'Pipeline tracking, task reminders, and compliance docs for power listers.',
    impact: 'experimental',
    effort: 'low',
    tags: ['Productivity', 'Pro'],
    details:
      'Add lightweight kanban stages (draft, pending media, awaiting payment, published) plus automated nudges so agencies keep every listing audit-ready.',
  },
];
