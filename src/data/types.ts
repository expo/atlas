import type { MixedOutput } from 'metro';

export interface AtlasSource {
  /** List all available entries */
  listEntries(): PartialAtlasEntry[] | Promise<PartialAtlasEntry[]>;
  /** Load the full entry, by reference */
  getEntry(ref: string): AtlasEntry | Promise<AtlasEntry>;
}

export type PartialAtlasEntry = Pick<AtlasEntry, 'id' | 'platform' | 'projectRoot' | 'entryPoint'>;

export type AtlasEntry = {
  /** The unique reference or ID to this entry */
  id: string;
  /** The platform for which the bundle was created */
  platform: 'android' | 'ios' | 'web';
  /** The absolute path to the root of the project */
  projectRoot: string;
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

export type AtlasModule = {
  /** The absoluate path of this module */
  path: string;
  /** The name of the package this module belongs to, if from an external package */
  package?: string;
  /** The original module size, in bytes */
  size: number;
  /** Absolute file paths of modules imported inside this module */
  imports: string[];
  /** Absolute file paths of modules importing this module */
  importedBy: string[];
  /** The original source code, as a buffer or string */
  source?: string;
  /** The transformed output source code */
  output?: MixedOutput[];
};
