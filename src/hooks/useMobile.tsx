/**
 * @module useMobile
 * @description Hook para detectar se o usuário está em dispositivo móvel
 *
 * Utiliza matchMedia API para detectar breakpoint de 768px (padrão Tailwind).
 * Reage a mudanças de tamanho de tela em tempo real.
 */

import * as React from "react";

const MOBILE_BREAKPOINT = 768;

/**
 * Detecta se o dispositivo é móvel baseado na largura da tela
 *
 * @returns true se largura < 768px, false caso contrário
 *
 * @example
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *   return (
 *     <div>
 *       {isMobile ? <MobileMenu /> : <DesktopMenu />}
 *     </div>
 *   );
 * }
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
