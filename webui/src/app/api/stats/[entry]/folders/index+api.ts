import path from 'path';

import type { ModuleMetadata } from '~/app/api/stats/[entry]/modules/index+api';
import { getSource } from '~/utils/atlas';
import { StatsEntry } from '~core/data/types';

export type FolderGraphData = {
  metadata: {
    platform: 'android' | 'ios' | 'web';
    size: number;
    modulesCount: number;
    folderPath: string;
    folderName: string;
  };
  data: {
    size: number;
    modulesCount: number;
    modules: ModuleMetadata[];
  };
};

export async function POST(request: Request, params: Record<'entry', string>) {
  const folderRef: string | undefined = (await request.json()).path;
  if (!folderRef) {
    return Response.json(
      { error: `Folder ID not provided, expected a "path" property.` },
      { status: 406 }
    );
  }

  let entry: StatsEntry;

  try {
    entry = await getSource().getEntry(params.entry);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 406 });
  }

  const folder = collectFolderInfo(entry, folderRef);
  return folder
    ? Response.json(folder)
    : Response.json({ error: `Folder "${folderRef}" not found.` }, { status: 404 });
}

function collectFolderInfo(entry: StatsEntry, folderRef: string): FolderGraphData | null {
  const modules: ModuleMetadata[] = [];

  for (const [moduleRef, module] of entry.modules) {
    if (moduleRef.startsWith(folderRef)) {
      modules.push({ ...module, source: undefined, output: undefined });
    }
  }

  if (!modules.length) {
    return null;
  }

  const size = modules.reduce((size, module) => size + module.size, 0);

  return {
    metadata: {
      platform: entry.platform as any,
      size,
      modulesCount: modules.length,
      folderPath: folderRef,
      folderName: path.basename(folderRef),
    },
    data: {
      modules,
      size,
      modulesCount: modules.length,
    },
  };
}
