import React from 'react';
import { cn } from './utils';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

const createIcon = (name: string, path: React.ReactNode) => {
  const Component = React.forwardRef<SVGSVGElement, IconProps>(({ size = 24, className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("lucide", `lucide-${name}`, className)}
      {...props}
    >
      {path}
    </svg>
  ));
  Component.displayName = `Icon${name}`;
  return Component;
};
export const MoreHorizontal = createIcon(
  'more-horizontal',
  <>
    <circle cx="6" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="18" cy="12" r="1" />
  </>
);
{/*export const MoreHorizontal = createIcon('more-horizontal', <><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></>);*/}
export const MessageSquare = createIcon('message-square', <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />);
export const MessageSquarePlus = createIcon('message-square-plus', <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M9 10h6" /><path d="M12 7v6" /></>);
export const Heart = createIcon('heart', <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />);
export const PenTool = createIcon('pen-tool', <><path d="m12 19 7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></>);
export const Activity = createIcon('activity', <path d="M22 12h-4l-3 9L9 3l-3 9H2" />);
export const Calendar = createIcon('calendar', <><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></>);
export const ChevronLeft = createIcon('chevron-left', <path d="m15 18-6-6 6-6" />);
export const ChevronRight = createIcon('chevron-right', <path d="m9 18 6-6-6-6" />);
export const ChevronDown = createIcon('chevron-down', <path d="m6 9 6 6 6-6" />);
export const ChevronUp = createIcon('chevron-up', <path d="m18 15-6-6-6 6" />);
export const Menu = createIcon('menu', <><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></>);
export const Zap = createIcon('zap', <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />);
export const Bell = createIcon('bell', <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>);
export const User = createIcon('user', <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>);
export const Send = createIcon('send', <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>);
export const Sparkles = createIcon('sparkles', <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" /></>);
export const Eraser = createIcon('eraser', <path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.41l10-10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-10 10a1 1 0 0 1-1.41 0Z" />);
export const RotateCcw = createIcon('rotate-ccw', <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />);
export const Loader2 = createIcon('loader-2', <path d="M21 12a9 9 0 1 1-6.219-8.56" />);
export const Check = createIcon('check', <path d="M20 6 9 17l-5-5" />);
export const RefreshCcw = createIcon('refresh-ccw', <><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" /><path d="M16 16h5v5" /></>);
export const Save = createIcon('save', <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></>);
export const Shield = createIcon('shield', <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />);
export const Wind = createIcon('wind', <path d="M17.7 7.7A7.1 7.1 0 0 0 5 10.8" />); // Simplified wind
export const Circle = createIcon('circle', <circle cx="12" cy="12" r="10" />);
export const Plus = createIcon('plus', <path d="M5 12h14M12 5v14" />);
export const X = createIcon('x', <path d="M18 6 6 18M6 6l12 12" />);
export const Clock = createIcon('clock', <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>);
export const FileText = createIcon('file-text', <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>);
export const ArrowLeft = createIcon('arrow-left', <><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></>);
export const Image = createIcon('image', <><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></>);
export const Mic = createIcon('mic', <><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" /></>);
export const Grid = createIcon('grid', <><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></>);

