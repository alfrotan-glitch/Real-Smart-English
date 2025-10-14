// components/IconShell.tsx
// Small, accessible SVG wrapper with forwardRef + memo.
// - If `title` is provided and not decorative => aria-labelledby + <title>
// - If no title (or decorative) => aria-hidden
// - Single source of truth for size; width/height derived from `size`

import React, { forwardRef, memo, useId } from 'react';

type IconShellProps = Omit<React.SVGProps<SVGSVGElement>, 'width' | 'height' | 'children' | 'ref'> & {
  /** Pixel size for both width and height */
  size?: number;
  /** Accessible label. If omitted or `decorative` is true, icon is aria-hidden */
  title?: string;
  /** Force decorative mode even if title exists */
  decorative?: boolean;
  children?: React.ReactNode;
};

export const IconShell = memo(
  forwardRef<SVGSVGElement, IconShellProps>(function IconShell(
    { size = 24, title, decorative = false, children, className, ...rest },
    ref
  ) {
    const titleId = useId();
    const labelled = Boolean(title && !decorative);

    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        role="img"
        focusable={false}
        shapeRendering="geometricPrecision"
        // If you really want vectorEffect, apply it on <path> strokes, not the svg root.
        aria-hidden={labelled ? undefined : true}
        aria-labelledby={labelled ? titleId : undefined}
        className={className}
        {...rest}
      >
        {labelled && <title id={titleId}>{title}</title>}
        {children}
      </svg>
    );
  })
);
