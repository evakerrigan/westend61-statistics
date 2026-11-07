/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

/** Extension version from `public/manifest.json` (see vite.config.ts). */
declare const __APP_VERSION__: string;
/** Build day, `YYYY-MM-DD` (see vite.config.ts). */
declare const __BUILD_DATE__: string;

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.svg?react' {
  import { type FunctionComponent, type SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}
