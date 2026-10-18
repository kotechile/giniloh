/**
 * The icon set the two equity calculators use, as inline SVG.
 *
 * They arrived importing `lucide-react`, which is not a dependency of this site (upstream removed
 * it when the header and cards moved to inline SVG). A local icon module keeps the clean install
 * honest — `npm ci` in the deploy image only sees package.json — and matches the rest of the site.
 */
import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1.7}
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			{...props}
		>
			{children}
		</svg>
	);
}

export const AlertTriangle = (p: IconProps) => (
	<Svg {...p}>
		<path d="M10.3 3.9 1.9 18a2 2 0 0 0 1.7 3h16.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
		<path d="M12 9v4M12 17h.01" />
	</Svg>
);

export const ArrowRight = (p: IconProps) => (
	<Svg {...p}>
		<path d="M5 12h14M13 6l6 6-6 6" />
	</Svg>
);

export const Briefcase = (p: IconProps) => (
	<Svg {...p}>
		<rect x="2" y="7" width="20" height="14" rx="2" />
		<path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20" />
	</Svg>
);

export const Building2 = (p: IconProps) => (
	<Svg {...p}>
		<path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 9h2a2 2 0 0 1 2 2v10" />
		<path d="M9 7h2M9 11h2M9 15h2" />
	</Svg>
);

export const Calculator = (p: IconProps) => (
	<Svg {...p}>
		<rect x="4" y="2" width="16" height="20" rx="2" />
		<path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
	</Svg>
);

export const Check = (p: IconProps) => (
	<Svg {...p}>
		<path d="M4 12.5 9 17.5 20 6.5" />
	</Svg>
);

export const CheckCircle2 = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M8 12.5 11 15.5 16.5 9" />
	</Svg>
);

export const Clock = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M12 7v5l3 2" />
	</Svg>
);

export const Copy = (p: IconProps) => (
	<Svg {...p}>
		<rect x="9" y="9" width="12" height="12" rx="2" />
		<path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
	</Svg>
);

export const DollarSign = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 2v20M17 6.5C17 4.6 14.8 3.5 12 3.5S7 4.6 7 6.5s2 2.6 5 3.3 5 1.5 5 3.4-2.2 3.3-5 3.3-5-1.1-5-3" />
	</Svg>
);

export const HelpCircle = (p: IconProps) => (
	<Svg {...p}>
		<circle cx="12" cy="12" r="9" />
		<path d="M9.2 9a3 3 0 1 1 4.4 2.7c-.9.6-1.6 1.1-1.6 2.3M12 17h.01" />
	</Svg>
);

export const Layers = (p: IconProps) => (
	<Svg {...p}>
		<path d="m12 2 9 5-9 5-9-5 9-5Z" />
		<path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
	</Svg>
);

export const Lock = (p: IconProps) => (
	<Svg {...p}>
		<rect x="4" y="10" width="16" height="11" rx="2" />
		<path d="M8 10V7a4 4 0 0 1 8 0v3" />
	</Svg>
);

export const Percent = (p: IconProps) => (
	<Svg {...p}>
		<path d="M19 5 5 19" />
		<circle cx="7" cy="7" r="2.5" />
		<circle cx="17" cy="17" r="2.5" />
	</Svg>
);

export const ShieldAlert = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4Z" />
		<path d="M12 8v4M12 16h.01" />
	</Svg>
);

export const ShieldCheck = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 2 4 6v6c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-4Z" />
		<path d="m9 12 2 2 4-4" />
	</Svg>
);

export const Sliders = (p: IconProps) => (
	<Svg {...p}>
		<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
		<circle cx="16" cy="6" r="2" />
		<circle cx="10" cy="12" r="2" />
		<circle cx="18" cy="18" r="2" />
	</Svg>
);

export const Sparkles = (p: IconProps) => (
	<Svg {...p}>
		<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z" />
		<path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
	</Svg>
);

export const TrendingUp = (p: IconProps) => (
	<Svg {...p}>
		<path d="M3 17l6-6 4 4 8-8" />
		<path d="M15 7h6v6" />
	</Svg>
);

export const Wallet = (p: IconProps) => (
	<Svg {...p}>
		<path d="M20 7V5a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6" />
		<path d="M16 12h2v3h-2a1.5 1.5 0 0 1 0-3Z" />
	</Svg>
);
