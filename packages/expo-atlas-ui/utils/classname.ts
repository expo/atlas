import { cx, type CxOptions } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';

export { cva, type VariantProps } from 'class-variance-authority';

/** Merge all classnames and optimize the styling for tailwind */
export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs));
}
