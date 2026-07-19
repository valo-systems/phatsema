import { createContext, type RefObject } from 'react';

/**
 * Keeps nested popovers inside a modal's accessible tree. Without this target,
 * modal focus management correctly hides body-level portals from assistive
 * technology.
 */
export const OverlayPortalContext = createContext<RefObject<HTMLElement | null> | undefined>(undefined);
