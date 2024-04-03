import { useGlobalSearchParams, useRouter } from 'expo-router';
import { type FormEvent, type KeyboardEvent, useState, useCallback } from 'react';

import { Button } from '~/ui/Button';
import { Checkbox } from '~/ui/Checkbox';
import { Input } from '~/ui/Input';
import { Label } from '~/ui/Label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '~/ui/Sheet';
import { debounce } from '~/utils/debounce';

export type ModuleFilters = typeof DEFAULT_FILTERS;

const DEFAULT_FILTERS = {
  modules: 'project,node_modules',
  include: '',
  exclude: '',
};

export function useStatsModuleFilters(): { filters: ModuleFilters; filtersEnabled: boolean } {
  const filters = useGlobalSearchParams<Partial<ModuleFilters>>();
  return {
    filtersEnabled: !!filters.modules || !!filters.include || !!filters.exclude,
    filters: {
      modules: filters.modules || DEFAULT_FILTERS.modules,
      include: filters.include || DEFAULT_FILTERS.include,
      exclude: filters.exclude || DEFAULT_FILTERS.exclude,
    },
  };
}

type StatsModuleFilterProps = {
  disableNodeModules?: boolean;
};

export function StatsModuleFilter(props: StatsModuleFilterProps) {
  const router = useRouter();
  const { filters, filtersEnabled } = useStatsModuleFilters();

  console.log({ filters, filtersEnabled });

  // NOTE(cedric): we want to programmatically close the dialog when the form is submitted, so make it controlled
  const [dialogOpen, setDialogOpen] = useState(false);

  function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    setDialogOpen(false);
  }

  function onInputEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault();
      setDialogOpen(false);
    }
  }

  const onModuleChange = useCallback((includeNodeModules: boolean) => {
    router.setParams({
      modules: includeNodeModules ? undefined : 'project',
    });
  }, []);

  const onIncludeChange = useCallback(
    debounce((value: string) => {
      router.setParams({ include: value || undefined });
    }, 300),
    []
  );

  const onExcludeChange = useCallback(
    debounce((value: string) => {
      router.setParams({ exclude: value || undefined });
    }, 300),
    []
  );

  const onClearFilters = useCallback(() => {
    setDialogOpen(false);
    router.setParams({
      modules: undefined,
      include: undefined,
      exclude: undefined,
    });
  }, []);

  return (
    <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary">Filter</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Filter modules</SheetTitle>
          <SheetDescription>
            Filter the graph to show only the modules you want to see.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={onFormSubmit} className="border-default border-t my-4">
          <fieldset className={`flex my-4 mt-8 ${props.disableNodeModules ? 'opacity-25' : ''}`}>
            <Label className="flex-1 whitespace-nowrap" htmlFor="filter-node_modules">
              Show <span className="font-bold">node_modules</span>
            </Label>
            <Checkbox
              id="filter-node_modules"
              defaultChecked={filters.modules.includes('node_modules')}
              name="filterNodeModules"
              onCheckedChange={onModuleChange}
              disabled={props.disableNodeModules}
            />
          </fieldset>

          <fieldset className="py-4">
            <Label className="whitespace-nowrap" htmlFor="filter-include">
              File glob to include
            </Label>
            <Input
              id="filter-include"
              name="filterInclude"
              type="text"
              className="mt-2"
              placeholder="e.g. app/**/*.{ts}"
              defaultValue={filters.include}
              onChange={(event) => onIncludeChange(event.currentTarget.value)}
              onKeyDown={onInputEnter}
            />
          </fieldset>

          <fieldset className="py-4">
            <Label className="whitespace-nowrap" htmlFor="filter-exclude">
              File glob to exclude
            </Label>
            <Input
              id="filter-exclude"
              name="filterExclude"
              type="text"
              className="mt-2"
              placeholder="e.g. react-native/**"
              defaultValue={filters.exclude}
              onChange={(event) => onExcludeChange(event.currentTarget.value)}
              onKeyDown={onInputEnter}
            />
          </fieldset>

          <div className="mt-[25px] flex justify-between">
            <Button variant="quaternary" type="submit" onClick={() => setDialogOpen(false)}>
              Close filters
            </Button>

            <Button
              variant="secondary"
              type="submit"
              onClick={onClearFilters}
              disabled={!filtersEnabled}
            >
              Clear filters
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

export function statsModuleFiltersToUrlParams(filters: ModuleFilters) {
  const params = new URLSearchParams({ modules: filters.modules });

  if (filters.include) params.set('include', filters.include);
  if (filters.exclude) params.set('exclude', filters.exclude);

  return params.toString();
}

export function statsModuleFiltersFromUrlParams(params: URLSearchParams): ModuleFilters {
  return {
    modules: params.get('modules') || DEFAULT_FILTERS.modules,
    include: params.get('include') || DEFAULT_FILTERS.include,
    exclude: params.get('exclude') || DEFAULT_FILTERS.exclude,
  };
}
