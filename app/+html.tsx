import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const figmaAnimationsCSS = `
  /* === HEAVENLY REAL ESTATE MOTION SYSTEM === */
  :root {
    --ease-heavenly: cubic-bezier(0.16, 1, 0.3, 1);
    --ease-smooth: cubic-bezier(0.22, 1, 0.36, 1);
    --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  /* 1. Staggered Progressive Page & Section Entrances */
  @keyframes heavenlyFadeUp {
    0% {
      opacity: 0;
      transform: translateY(22px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes heavenlyFadeIn {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }

  @keyframes heavenlyScaleIn {
    0% {
      opacity: 0;
      transform: scale(0.96) translateY(10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .heavenly-stagger-1 {
    animation: heavenlyFadeUp 0.6s var(--ease-heavenly) 0.05s both;
  }
  .heavenly-stagger-2 {
    animation: heavenlyFadeUp 0.65s var(--ease-heavenly) 0.12s both;
  }
  .heavenly-stagger-3 {
    animation: heavenlyFadeUp 0.7s var(--ease-heavenly) 0.18s both;
  }
  .heavenly-stagger-4 {
    animation: heavenlyFadeUp 0.75s var(--ease-heavenly) 0.25s both;
  }
  .heavenly-stagger-5 {
    animation: heavenlyFadeUp 0.8s var(--ease-heavenly) 0.32s both;
  }

  /* 2. Property Card Lift & Elevation Glow */
  .immoci-property-card {
    transition: transform 0.38s var(--ease-heavenly), 
                box-shadow 0.38s var(--ease-heavenly), 
                border-color 0.38s var(--ease-heavenly) !important;
    cursor: pointer !important;
    will-change: transform, box-shadow;
  }
  .immoci-property-card:hover {
    transform: translateY(-6px) !important;
    box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12), 0 8px 16px -4px rgba(5, 150, 105, 0.08) !important;
    border-color: rgba(5, 150, 105, 0.4) !important;
  }
  .immoci-property-card:active {
    transform: translateY(-2px) scale(0.99) !important;
    transition-duration: 0.12s !important;
  }

  /* 3. Image Cinematic Smooth Zoom */
  .immoci-card-image {
    transition: transform 0.6s var(--ease-heavenly) !important;
    transform-origin: center center;
    will-change: transform;
  }
  .immoci-property-card:hover .immoci-card-image {
    transform: scale(1.055) !important;
  }

  /* 4. Title & Badge Soft Accents */
  .immoci-card-title {
    transition: color 0.25s ease !important;
  }
  .immoci-property-card:hover .immoci-card-title {
    color: #059669 !important;
  }

  /* 5. Micro-Interactive Favorite Heart Button */
  .immoci-favorite-btn {
    transition: transform 0.25s var(--ease-spring), 
                background-color 0.2s ease, 
                border-color 0.2s ease,
                box-shadow 0.2s ease !important;
  }
  .immoci-favorite-btn:hover {
    transform: scale(1.15) !important;
    background-color: #FFFFFF !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12) !important;
  }
  .immoci-favorite-btn:active {
    transform: scale(0.9) !important;
  }

  /* 6. Smooth Button & Link Micro-Interactions */
  .heavenly-button {
    transition: transform 0.22s var(--ease-heavenly),
                box-shadow 0.22s var(--ease-heavenly),
                background-color 0.2s ease,
                opacity 0.2s ease !important;
    will-change: transform;
  }
  .heavenly-button:hover {
    transform: translateY(-1.5px) !important;
    box-shadow: 0 8px 20px -4px rgba(5, 150, 105, 0.25) !important;
  }
  .heavenly-button:active {
    transform: translateY(0.5px) scale(0.98) !important;
    transition-duration: 0.1s !important;
  }

  /* 7. Navigation Indicator and Links */
  .heavenly-nav-item {
    transition: color 0.2s ease, background-color 0.2s ease, transform 0.2s var(--ease-heavenly) !important;
  }
  .heavenly-nav-item:hover {
    transform: translateY(-1px) !important;
    background-color: rgba(255, 255, 255, 0.9) !important;
  }
  .heavenly-nav-item:active {
    transform: translateY(0) !important;
  }

  /* 8. Glowing Pulsating Status Indicator Dots */
  @keyframes pulseGlowGreen {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.6); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(5, 150, 105, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
  }
  @keyframes pulseGlowBlue {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.6); }
    70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(2, 132, 199, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(2, 132, 199, 0); }
  }
  .immoci-dot-sale {
    animation: pulseGlowGreen 2.4s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }
  .immoci-dot-rent {
    animation: pulseGlowBlue 2.4s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }

  /* 9. See All Button Slide & Glow */
  .immoci-see-all-btn {
    transition: all 0.25s var(--ease-heavenly) !important;
  }
  .immoci-see-all-btn:hover {
    transform: translateX(4px) !important;
    border-color: #059669 !important;
    box-shadow: 0 4px 14px rgba(5, 150, 105, 0.15) !important;
  }
  .immoci-see-all-btn:hover svg {
    transform: translateX(3px) !important;
    transition: transform 0.2s ease !important;
  }

  /* 10. Dropdown & Popover Entrance */
  .heavenly-dropdown {
    animation: heavenlyScaleIn 0.24s var(--ease-heavenly) both;
    transform-origin: top right;
  }

  /* 11. Form Inputs Smooth Focus */
  input:focus, textarea:focus, select:focus {
    outline: none !important;
  }

  /* 12. Accessibility: Reduced Motion */
  @media (prefers-reduced-motion: reduce) {
    *, ::before, ::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
      transform: none !important;
    }
  }
`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: figmaAnimationsCSS }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
