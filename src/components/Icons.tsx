import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };

const stroke = ({ size = 20, ...rest }: P) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...rest,
});

export const Sparkle = ({ size = 24, ...rest }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...rest}>
    <path d="M12 2C12.6 8 16 11.4 22 12C16 12.6 12.6 16 12 22C11.4 16 8 12.6 2 12C8 11.4 11.4 8 12 2Z" fill="currentColor" />
  </svg>
);

export const CalendarIcon = (p: P) => (
  <svg {...stroke(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const PinIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export const CameraIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M4 8h3l1.5-2h7L17 8h3v10H4z" />
    <circle cx="12" cy="13" r="3.2" />
    <path d="M2 12c0 3 4.5 5.5 10 5.5M22 12c0 2.4-2.9 4.5-7 5.2" />
  </svg>
);

export const PearlsIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M4 5c1.5 8 14.5 8 16 0" />
    <circle cx="6.2" cy="9.4" r="1.6" />
    <circle cx="9" cy="11.3" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="15" cy="11.3" r="1.6" />
    <circle cx="17.8" cy="9.4" r="1.6" />
    <circle cx="12" cy="17.5" r="2.6" />
  </svg>
);

export const StarIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
  </svg>
);

export const GiftIcon = (p: P) => (
  <svg {...stroke(p)}>
    <rect x="3" y="8" width="18" height="13" rx="1.5" />
    <path d="M3 12h18M12 8v13M12 8c-2-4-6-4-6-1.5S10 8 12 8zM12 8c2-4 6-4 6-1.5S14 8 12 8z" />
  </svg>
);

export const PlaneIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M2 16l20-8-4 10-6-3-3 4v-5l9-6" />
  </svg>
);

export const HeartIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M12 20s-7.5-4.5-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.5-7.5 10-7.5 10z" />
  </svg>
);

export const MenuIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </svg>
);

export const CloseIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const ChevronLeft = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

export const ClockIcon = (p: P) => (
  <svg {...stroke(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const ShirtIcon = (p: P) => (
  <svg {...stroke(p)}>
    <path d="M9 3l3 3 3-3 5 4-3 3v11H7V10L4 7z" />
  </svg>
);
