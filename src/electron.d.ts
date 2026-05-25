export {};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    desktopMemo?: {
      closeWindow: () => void;
      startDrag: (point: { screenX: number; screenY: number }) => void;
      moveDrag: (point: { screenX: number; screenY: number }) => void;
      endDrag: () => void;
      onCollapsedChange: (
        callback: (state: { collapsed: boolean; edge: string | null }) => void,
      ) => () => void;
    };
  }
}
