import { type HrefObject, type AllRoutes, Link } from 'expo-router';
import { Fragment } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '~/ui/Breadcrumb';

type BreadcrumbLinksProps = {
  entryId: string;
  links: {
    label: string;
    href?: HrefObject<any, AllRoutes>;
  }[];
};

export function BreadcrumbLinks(props: BreadcrumbLinksProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList className="mr-8">
        <BreadcrumbLink asChild>
          <Link
            className="text-lg font-bold text-default underline-offset-4 hover:underline"
            href={{ pathname: '/(atlas)/[entry]/', params: { entry: props.entryId } }}
          >
            Bundle
          </Link>
        </BreadcrumbLink>
        {props.links.map((link, index) => (
          <Fragment key={`link-${index}`}>
            <BreadcrumbSeparator className="text-secondary" />
            <BreadcrumbItem>
              {!link.href ? (
                <BreadcrumbPage className="text-lg">{link.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    className="text-lg text-default font-bold underline-offset-4 hover:underline"
                    href={{
                      pathname: link.href.pathname,
                      params: { entry: props.entryId, ...link.href.params },
                    }}
                  >
                    {link.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
