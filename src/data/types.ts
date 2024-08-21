import type { MixedOutput } from 'metro';

export interface AtlasSource {
  /** List the partial data of all available bundles */
  listBundles(): PartialAtlasBundle[] | Promise<PartialAtlasBundle[]>;
  /** Load the full entry, by reference */
  getBundle(ref: string): AtlasBundle | Promise<AtlasBundle>;

  hasHmrSupport(): boolean;
  getBundleHmr(ref: string): null | AtlasBundleHmr;
}

export type PartialAtlasBundle = Pick<
  AtlasBundle,
  'id' | 'platform' | 'projectRoot' | 'sharedRoot' | 'entryPoint' | 'environment'
>;

export type AtlasBundle = {
  /** The unique reference or ID to this entry */
  id: string;
  /** The platform for which the bundle was created */
  platform: 'android' | 'ios' | 'web';
  /** Target bundling environment */
  environment: 'client' | 'node' | 'react-server';
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

export type AtlasBundleHmr = {
  bundleId: AtlasBundle['id'];
  socketUrl: string | URL;
  entryPoints: string[];
};

export type AtlasModule = {
  /** The internal module ID given by Metro */
  id: number | string;
  /** The absoluate path of this module, in the platform-original format */
  absolutePath: string;
  /** The relative path of this module, to the shared root of the bundle, in posix format */
  relativePath: string;
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

export type AtlasModuleRef = Pick<AtlasModule, 'id' | 'absolutePath' | 'relativePath' | 'package'>;
