import type { MixedOutput } from 'metro';

export interface AtlasSource {
  /** List the partial data of all available bundles */
  listBundles(): PartialAtlasBundle[] | Promise<PartialAtlasBundle[]>;
  /** Load the full entry, by reference */
  getBundle(ref: string): AtlasBundle | Promise<AtlasBundle>;
  /** Load the entry changes since last bundle collection, if any */
  getBundleDelta(ref: string): null | AtlasBundleDelta | Promise<null | AtlasBundleDelta>;
  /** Determine if the source is watching for (live) changes. */
  bundleDeltaEnabled(): boolean;
}

export type PartialAtlasBundle = Pick<
  AtlasBundle,
  'id' | 'platform' | 'projectRoot' | 'sharedRoot' | 'entryPoint'
>;

export type AtlasBundle = {
  /** The unique reference or ID to this entry */
  id: string;
  /** The platform for which the bundle was created */
  platform: 'android' | 'ios' | 'web' | 'server';
  /** The absolute path to the root of the project */
  projectRoot: string;
  /** The absolute path to the shared root of all imported modules */
  sharedRoot: string;
  /** The absolute path to the entry point used when creating the bundle */
  entryPoint: string;
  /** All known modules that are prepended for the runtime itself */
  runtimeModules: AtlasModule[];
  /** All known modules imported within the bundle, stored by absolute path */
  modules: Map<string, AtlasModule>;
  /** The sarialization options used for this bundle */
  serializeOptions?: Record<string, any>;
  /** The transformation options used for this bundle */
  transformOptions?: Record<string, any>;
};

export type AtlasBundleDelta = {
  /** When this delta or change was created */
  createdAt: Date;
  /** Both added and modified module paths */
  modifiedPaths: string[];
  /** Deleted module paths */
  deletedPaths: string[];
};

export type AtlasModule = {
  /** The absoluate path of this module */
  path: string;
  /** The name of the package this module belongs to, if from an external package */
  package?: string;
  /** The original module size, in bytes */
  size: number;
  /** Absolute file paths of modules imported inside this module */
  imports: AtlasModuleRef[];
  /** All modules importing this module */
  importedBy: AtlasModuleRef[];
  /** The original source code, as a buffer or string */
  source?: string;
  /** The transformed output source code */
  output?: MixedOutput[];
};

export type AtlasModuleRef = Pick<AtlasModule, 'path' | 'package'>;
