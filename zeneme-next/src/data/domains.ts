/**
 * Top-level assessment domains (2.1 - 2.5).
 *
 * Single source of truth for domain codes, labels, colours and question weights.
 * The weights are used both to render the progress bar and to derive sequential
 * question ranges when the backend does not supply a `domain` per question, so
 * they must not be duplicated at call sites.
 */

export interface DomainMeta {
  code: string;
  label: string;
  color: string;
  weight: number;
}

export const DOMAINS: DomainMeta[] = [
  { code: '2.1', label: '情绪觉察', color: '#f472b6', weight: 9 },
  { code: '2.2', label: '认知模式', color: '#34d399', weight: 14 },
  { code: '2.3', label: '关系模式', color: '#fb923c', weight: 12 },
  { code: '2.4', label: '性格类型', color: '#a78bfa', weight: 8 },
  { code: '2.5', label: '成长指数', color: '#38bdf8', weight: 6 },
];

export const DOMAIN_CODES = DOMAINS.map((d) => d.code);

export const DOMAIN_WEIGHTS = DOMAINS.map((d) => d.weight);

export const TOTAL_DOMAIN_WEIGHT = DOMAINS.reduce((sum, d) => sum + d.weight, 0);
