import { Link } from 'expo-router';
import { ComponentProps, Fragment, PropsWithChildren, useCallback, useMemo } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/Breadcrumb';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '~/ui/Menu';
import { type PartialAtlasBundle } from '~core/data/types';

type BreadcrumbLinksProps = {
  /** The current opened bundle, used to generate the proper links */
  bundle: PartialAtlasBundle;
  /** The relative path to generate the breadcrumb links from */
  path: string;
};

export function BreadcrumbLinks(props: BreadcrumbLinksProps) {
  const links = useMemo(() => getBreadcrumbLinks(props), [props.bundle.id, props.path]);

  return (
    <Breadcrumb>
      <BreadcrumbList className="mr-8">
        <BreadcrumbLink asChild>
          <Link
            className="text-lg font-bold text-default underline-offset-4 hover:underline"
            href={{ pathname: '/(atlas)/[bundle]/', params: { bundle: props.bundle.id } }}
          >
            Bundle
          </Link>
        </BreadcrumbLink>
        {links.map((link) => (
          <Fragment key={link.filePath}>
            <BreadcrumbSeparator className="text-secondary" />
            <BreadcrumbItem>
              {!link.href ? (
                <BreadcrumbLinkMenu bundle={props.bundle} link={link}>
                  <BreadcrumbPage className="text-lg">{link.label}</BreadcrumbPage>
                </BreadcrumbLinkMenu>
              ) : (
                <BreadcrumbLinkMenu bundle={props.bundle} link={link}>
                  <BreadcrumbLink asChild>
                    <Link
                      className="text-lg text-default font-bold underline-offset-4 hover:underline"
                      href={link.href}
                    >
                      {link.label}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbLinkMenu>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

type BreadcrumbLinkMenuProps = PropsWithChildren<{
  bundle: PartialAtlasBundle;
  link: BreadcrumbLinkItem;
}>;

function BreadcrumbLinkMenu(props: BreadcrumbLinkMenuProps) {
  const onCopyRelativePath = useCallback(() => {
    navigator.clipboard.writeText(props.link.filePath);
  }, [props.link.filePath]);

  const onCopyAbsolutePath = useCallback(() => {
    navigator.clipboard.writeText(`${props.bundle.sharedRoot}/${props.link.filePath}`);
  }, [props.link.filePath, props.bundle.sharedRoot]);

  return (
    <ContextMenu>
      <ContextMenuTrigger>{props.children}</ContextMenuTrigger>
      <ContextMenuContent className="w-64">
        <ContextMenuItem onClick={onCopyRelativePath}>Copy relative path</ContextMenuItem>
        <ContextMenuItem onClick={onCopyAbsolutePath}>Copy absolute path</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

type BreadcrumbLinkItem = {
  key: string;
  label: string;
  filePath: string;
  href?: ComponentProps<typeof Link>['href'];
};

function getBreadcrumbLinks(props: BreadcrumbLinksProps): BreadcrumbLinkItem[] {
  return props.path.split('/').map((label, index, breadcrumbs) => {
    const isLastSegment = index === breadcrumbs.length - 1;
    const breadcrumb: BreadcrumbLinkItem = {
      label,
      key: `${index}-${label}`,
      filePath: breadcrumbs.slice(0, index + 1).join('/'),
    };

    // NOTE(cedric): a bit of a workaround to avoid linking to the current page, might need to change this
    if (!isLastSegment || !label.includes('.')) {
      breadcrumb.href = {
        pathname: '/(atlas)/[bundle]/folders/[path]',
        params: { bundle: props.bundle.id, path: breadcrumb.filePath },
      };
    }

    return breadcrumb;
  });
}
