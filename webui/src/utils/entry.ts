import { ComponentProps } from 'react';

import { BreadcrumbLinks } from '~/components/BreadcrumbLinks';
import { PartialAtlasEntry } from '~core/data/types';

/**
 * Translate an absolute path to a relative path, based on the entry's project root.
 * This is a simple replace operation.
 */
export function relativeEntryPath(entry: Pick<PartialAtlasEntry, 'projectRoot'>, path: string) {
  return path.replace(entry.projectRoot + '/', '');
}

/**
 * Create a list of breadcrumbs, including label and possible links, for a given path.
 */
export function breadcrumbsForPath(
  entry: Pick<PartialAtlasEntry, 'id' | 'projectRoot'>,
  absolutePath: string
) {
  const relativePath = relativeEntryPath(entry, absolutePath);

  return relativePath.split('/').map((label, index, breadcrumbs) => {
    const isLastSegment = index === breadcrumbs.length - 1;
    const breadcrumb: ComponentProps<typeof BreadcrumbLinks>['links'][0] = { label };

    // NOTE(cedric): a bit of a workaround to avoid linking the module page, might need to change this
    if (!isLastSegment || !label.includes('.')) {
      breadcrumb.href = {
        pathname: '/(atlas)/[entry]/folders/[path]',
        params: {
          entry: entry.id,
          path: `${entry.projectRoot}/${breadcrumbs.slice(0, index + 1).join('/')}`,
        },
      };
    }

    return breadcrumb;
  });
}
