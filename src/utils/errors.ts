export class AtlasError extends Error {
  /** A property to determine if any of the extended errors are atlas-specific errors */
  public readonly type = 'AtlasError';
  /** The error (class) name */
  public readonly name: string;
  /** The error code, specifically for these types of errors */
  public readonly code?: string;

  constructor(code: string, message = '', options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    this.code = code;
  }
}

export class AtlasValidationError extends AtlasError {
  constructor(
    code: 'STATS_FILE_NOT_FOUND' | 'STATS_FILE_INCOMPATIBLE',
    public readonly statsFile: string,
    public readonly incompatibleVersion?: string
  ) {
    super(
      code,
      code === 'STATS_FILE_NOT_FOUND'
        ? `Stats file not found: ${statsFile}`
        : `Stats file is incompatible with this version.`
    );
  }
}

export function handleError(error: Error) {
  if (error instanceof AtlasError) {
    console.error(`${error.message} (${error.code})`);
    return true;
  }

  throw error;
}
