import React from "react";
export type LogoVariant = "icon" | "wordmark" | "horizontal" | "stacked";
export type LogoTheme = "light" | "dark"; // 'light' = on light background (navy text); 'dark' = on dark navy background (white text)
export type LogoSize = "xs" | "sm" | "md" | "lg" | "xl";
export interface LogoProps {
  /** * Type 1: 'icon' - Symbol only (twin-towers escrow & appreciation arrow) * Type 2: 'wordmark' - Logotype only ('Habitr^') * Type 3A: 'horizontal' - Icon + Wordmark side-by-side (Sidebars, Navbars) * Type 3B: 'stacked' - Icon above Wordmark centered (Auth hero, 404, Splash) */ variant?: LogoVariant;
  /** * Theme mode: * 'dark' -> for dark burgundy backgrounds (#722F37), uses light wordmark * 'light' -> for light cream backgrounds (e.g. #E8DCC6 Cosmic Latte, #B7A89A Mocha Cream), uses brown wordmark */ theme?: LogoTheme;
  /** * Predefined size presets */ size?: LogoSize;
  /** * Optional custom classes */ className?: string;
  /** * Optional badge chip next to wordmark (e.g. 'OS', 'ECOSYSTEM', 'VERIFIED') */ badge?: string;
  /** * Optional subtext / tagline below the logo */ tagline?: string;
  /** * Accessibility text */ alt?: string;
  /** * Click handler if clickable */ onClick?: () => void;
}
const SIZES: Record<
  LogoVariant,
  Record<LogoSize, { height: number; imgClass: string }>
> = {
  icon: {
    xs: { height: 22, imgClass: "h-5 w-auto" },
    sm: { height: 30, imgClass: "h-7 w-auto" },
    md: { height: 38, imgClass: "h-9 w-auto" },
    lg: { height: 48, imgClass: "h-12 w-auto" },
    xl: { height: 68, imgClass: "h-16 w-auto" },
  },
  wordmark: {
    xs: { height: 16, imgClass: "h-4 w-auto" },
    sm: { height: 22, imgClass: "h-5 w-auto" },
    md: { height: 28, imgClass: "h-7 w-auto" },
    lg: { height: 36, imgClass: "h-9 w-auto" },
    xl: { height: 48, imgClass: "h-12 w-auto" },
  },
  horizontal: {
    xs: { height: 24, imgClass: "h-6 w-auto" },
    sm: { height: 32, imgClass: "h-8 w-auto" },
    md: { height: 40, imgClass: "h-10 w-auto" },
    lg: { height: 50, imgClass: "h-12 w-auto" },
    xl: { height: 64, imgClass: "h-16 w-auto" },
  },
  stacked: {
    xs: { height: 48, imgClass: "h-12 w-auto" },
    sm: { height: 64, imgClass: "h-16 w-auto" },
    md: { height: 88, imgClass: "h-22 w-auto" },
    lg: { height: 120, imgClass: "h-28 w-auto" },
    xl: { height: 160, imgClass: "h-40 w-auto" },
  },
};
export const Logo: React.FC<LogoProps> = ({
  variant = "horizontal",
  theme = "light",
  size = "md",
  className = "",
  badge,
  tagline,
  alt = "Habitra Residential Operating System",
  onClick,
}) => {
  const sizeConfig = SIZES[variant][size];
  /* Resolve source asset based on variant and theme */
let src = ''; switch (variant) { case 'icon': src = '/brand/habitra-icon@2x.png'; break; case 'wordmark': src = theme === 'dark' ? '/brand/habitra-wordmark-light@2x.png' : '/brand/habitra-wordmark-dark@2x.png'; break; case 'horizontal': src = theme === 'dark' ? '/brand/habitra-logo-horizontal-light@2x.png' : '/brand/habitra-logo-horizontal@2x.png'; break; case 'stacked': src = theme === 'dark' ? '/brand/habitra-logo-stacked-light@2x.png' : '/brand/habitra-logo-stacked@2x.png'; break; } const containerClasses = [ 'inline-flex select-none', onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : '', tagline || variant === 'stacked' ? 'flex-col' : 'flex-row items-center', variant === 'stacked' ? 'justify-center items-center text-center' : 'items-start', className, ].filter(Boolean).join(' '); return ( <div className={containerClasses} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}> <div className="relative inline-flex items-center"> <img src={src} alt={alt} height={sizeConfig.height} className={`${sizeConfig.imgClass} object-contain transition-transform`} loading="eager" decoding="async" /> {badge && ( <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${ theme === 'dark' ? 'bg-brand-600 text-white border border-brand-600' : 'bg-brand-600 text-white border border-brand-600' }`} > {badge} </span> )} </div> {tagline && ( <p className={`mt-1 text-[11px] font-medium tracking-tight ${ theme === 'dark' ? 'text-white' : 'text-ink-900' }`} > {tagline} </p> )} </div> );
};
