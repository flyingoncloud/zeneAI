/**
 * Shared Dark-Blue Theme Tokens
 * Used by: MoodTracker, HistoryReports, InnerQuickTest (report view), SketchBriefReport, and future dark-themed pages.
 */
export const DK = {
  bgPage:       '#0B1020',
  bgPanel:      '#0E1630',
  bgPanel2:     '#0C1430',
  bgChart:      '#0C1430',      // alias of bgPanel2, used in chart areas
  blue:         '#5B7CFF',
  blue600:      '#4867FF',
  textPri:      '#EAF0FF',
  textSec:      'rgba(234,240,255,0.70)',
  textMut:      'rgba(234,240,255,0.45)',
  border:       'rgba(234,240,255,0.10)',
  divider:      'rgba(234,240,255,0.08)',
  gridLine:     'rgba(234,240,255,0.08)',
  gridDash:     'rgba(234,240,255,0.12)',
  hoverOverlay: 'rgba(255,255,255,0.04)',
} as const;