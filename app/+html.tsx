import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const figmaAnimationsCSS = `
  /* === IMMOCI FIGMA-GRADE ANIMATIONS === */
  
  /* 1. Property Card 3D Lift & Elevation Glow */
  .immoci-property-card {
    transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1), 
                box-shadow 0.38s cubic-bezier(0.16, 1, 0.3, 1), 
                border-color 0.38s cubic-bezier(0.16, 1, 0.3, 1) !important;
    cursor: pointer !important;
  }
  .immoci-property-card:hover {
    transform: translateY(-8px) scale(1.008) !important;
    box-shadow: 0 24px 44px -8px rgba(6, 78, 59, 0.18), 0 12px 20px -6px rgba(0, 0, 0, 0.08) !important;
    border-color: rgba(16, 185, 129, 0.5) !important;
  }

  /* 2. Image Motion & Cinematic Zoom */
  .immoci-card-image {
    transition: transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }
  .immoci-property-card:hover .immoci-card-image {
    transform: scale(1.08) !important;
  }

  /* 3. Title Color Highlight */
  .immoci-card-title {
    transition: color 0.25s ease !important;
  }
  .immoci-property-card:hover .immoci-card-title {
    color: #059669 !important;
  }

  /* 4. Quick View Reveal Action Pill */
  .immoci-hover-pill {
    opacity: 0 !important;
    transform: translateY(8px) scale(0.92) !important;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1) !important;
    pointer-events: none;
  }
  .immoci-property-card:hover .immoci-hover-pill {
    opacity: 1 !important;
    transform: translateY(0) scale(1) !important;
  }

  /* 5. Micro-Interactive Favorite Heart Button */
  .immoci-favorite-btn {
    transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), 
                background-color 0.25s ease, 
                border-color 0.25s ease !important;
  }
  .immoci-favorite-btn:hover {
    transform: scale(1.22) !important;
    background-color: rgba(239, 68, 68, 0.25) !important;
    border-color: rgba(239, 68, 68, 0.6) !important;
  }
  .immoci-favorite-btn:active {
    transform: scale(0.92) !important;
  }

  /* 6. Glowing Pulsating Status Indicator Dots */
  @keyframes pulseGlowGreen {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
  }
  @keyframes pulseGlowBlue {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7); }
    70% { transform: scale(1.15); box-shadow: 0 0 0 7px rgba(37, 99, 235, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
  }
  .immoci-dot-sale {
    animation: pulseGlowGreen 2s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }
  .immoci-dot-rent {
    animation: pulseGlowBlue 2s infinite cubic-bezier(0.4, 0, 0.6, 1) !important;
  }

  /* 7. Featured Shimmer Badge */
  @keyframes shimmerGlow {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .immoci-featured-shimmer {
    background: linear-gradient(90deg, #F59E0B 0%, #FDE68A 50%, #D97706 100%) !important;
    background-size: 200% auto !important;
    animation: shimmerGlow 3s infinite linear !important;
  }

  /* 8. See All Button Slide & Glow */
  .immoci-see-all-btn {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
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

  /* 9. Card Staggered Entrance */
  @keyframes cardFadeInUp {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .immoci-card-animate {
    animation: cardFadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
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
