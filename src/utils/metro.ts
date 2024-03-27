import type { ConfigT as MetroConfig, InputConfigT as MetroInputConfig } from 'metro-config';

const atlasSerializerSymbol = Symbol('expo-atlas-serializer');
const originalSerializerSymbol = Symbol('expo-atlas-original-serializer');

type MetroSerializerParams = Parameters<NonNullable<MetroConfig['serializer']['customSerializer']>>
type AtlasSerializer = (...params: MetroSerializerParams) => void;

/**
 * Attach a custom serializer, marked as being an Expo Atlas serializer.
 * If there was a previous serializer, it will be overwritten to avoid conflicts.
 */
export function attachMetroSerializer(
  config: MetroConfig | MetroInputConfig,
  serializer: AtlasSerializer
) {
  // @ts-expect-error
  if (!config.serializer) config.serializer = {};

  let prevSerializer = config.serializer?.customSerializer;

  // Already attached, overwrite the serializer
  if (prevSerializer?.[atlasSerializerSymbol]) {
    prevSerializer = prevSerializer[originalSerializerSymbol];
  }

  // @ts-expect-error
  config.serializer.customSerializer = (entryPoint, preModules, graph, options) => {
    serializer(entryPoint, preModules, graph, options);
    return prevSerializer?.(entryPoint, preModules, graph, options);
  };

  // Mark this serializer as being atlas
  config.serializer.customSerializer![atlasSerializerSymbol] = true;
  config.serializer.customSerializer![originalSerializerSymbol] = prevSerializer;
}
