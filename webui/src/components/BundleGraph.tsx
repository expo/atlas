import type { TreemapSeriesOption } from 'echarts';
import { TreemapChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import type { CallbackDataParams, TooltipFormatterCallback } from 'echarts/types/dist/shared';
import EchartsReact from 'echarts-for-react/lib/core';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

import { formatFileSize } from '~/utils/formatString';
import type { TreemapNode } from '~/utils/treemap';
import type { PartialAtlasBundle } from '~core/data/types';

// Register used echarts components, to avoid loading unused code
echarts.use([TooltipComponent, TitleComponent, TreemapChart, CanvasRenderer]);

type BundleGraphProps = {
  bundle: PartialAtlasBundle;
  graph: TreemapNode;
};

export function BundleGraph(props: BundleGraphProps) {
  const router = useRouter();
  const options = useMemo(
    () => ({
      backgroundColor: 'transparent',
      title: {
        shown: false,
      },
      tooltip: {
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        formatter: getBundleGraphTooltip(props.graph),
      },
      series: [getBundleGraphSeries(props.graph)],
    }),
    [props.graph]
  );

  return (
    <EchartsReact
      className="h-full min-w " // Enable full height of parent container
      style={{ height: undefined }} // Disable fixed default inline height of 300px
      lazyUpdate
      option={options}
      echarts={echarts}
      onEvents={{
        click({ event, data }: { event: any; data: TreemapNode }) {
          if (event.event.altKey || event.event.ctrlKey || event.event.metaKey) {
            const path = data.value === 100 ? data.name : data.modulePath;

            router.push({
              pathname: !path
                ? '/(atlas)/[bundle]'
                : data.children?.length
                  ? '/(atlas)/[bundle]/folders/[path]'
                  : '/(atlas)/[bundle]/modules/[path]',
              params: {
                path,
                bundle: props.bundle.id,
              },
            });
          }
        },
      }}
    />
  );
}

/**
 * Get the data series of the bundle graph.
 * This instructs echarts to use a styled treemap with the given data.
 *
 * @see https://echarts.apache.org/en/option.html#series-treemap
 */
function getBundleGraphSeries(graph: TreemapNode): TreemapSeriesOption {
  return {
    // Global configuration
    type: 'treemap',
    width: '95%',
    height: '95%',
    breadcrumb: { show: false },
    // Data
    data: graph.children || [],
    name: graph.name,
    // Global styling
    upperLabel: {
      show: true,
      height: 30,
      overflow: 'truncate',
      padding: 8,
      color: '#fff',
      formatter: (params) =>
        `${params.name} - ${formatNodeValue(params as unknown as TreemapNode)}`,
    },
    label: {
      show: true,
      position: 'insideLeft',
      align: 'left',
      padding: 8,
      lineHeight: 18,
      formatter: (params) => `${params.name}\n${formatNodeValue(params as unknown as TreemapNode)}`,
    },
    itemStyle: {
      borderColor: '#fff',
      shadowColor: 'rgba(0,0,0,0.75)',
      shadowBlur: 0,
      shadowOffsetX: -0.5,
      shadowOffsetY: -0.5,

      gapWidth: 4,
      borderColorSaturation: 0.2,
    },
    color: ['#37434A'],
    // Per-level styling
    levels: [
      // Root node configuration
      {
        itemStyle: {
          borderColor: 'black',
        },
      },
      // Direct root-child configuration
      {
        itemStyle: {
          color: '#37434A',
          borderColorSaturation: 0.15,
          colorSaturation: 0.25,
          borderWidth: 4,
        },
      },
    ],
  };
}

type TreemapNodeType = 'package' | 'directory' | 'file';

/**
 * Determine the type of the node, can be:
 *   - package: when the node is a (root) package node
 *   - directory: when the node has one or more children
 *   - file: when the node is neither a package or directory
 */
function getNodeType(node: TreemapNode): TreemapNodeType {
  return node.modulePackage ? 'package' : node.children ? 'directory' : 'file';
}

/**
 * Format the node's value to a rounded percentage, using 2 decimals, or a `< 0.01%` string.
 * This also adds the percentage sign as suffix.
 */
function formatNodeValue(node: TreemapNode): string {
  if (node.value < 0.01) return '< 0.01%';
  return `${Math.round(node.value * 100) / 100}%`;
}

const ICON_BY_NODE_TYPE: Record<TreemapNodeType, string> = {
  file: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16"><path d="M320-240h320v-80H320v80Zm0-160h320v-80H320v80ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z"/></svg>`,
  directory: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h240l80 80h320q33 0 56.5 23.5T880-640v400q0 33-23.5 56.5T800-160H160Zm0-80h640v-400H447l-80-80H160v480Zm0 0v-480 480Z"/></svg>`,
  package: `<svg fill="white" xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16"><path d="M440-183v-274L200-596v274l240 139Zm80 0 240-139v-274L520-457v274Zm-40-343 237-137-237-137-237 137 237 137ZM160-252q-19-11-29.5-29T120-321v-318q0-22 10.5-40t29.5-29l280-161q19-11 40-11t40 11l280 161q19 11 29.5 29t10.5 40v318q0 22-10.5 40T800-252L520-91q-19 11-40 11t-40-11L160-252Zm320-228Z"/></svg>`,
};

/**
 * The formatter of the tooltip that renders the content when hovering over treemap data.
 * This currently renders html to string, so echarts can render it.
 *
 * @see https://echarts.apache.org/en/option.html#series-treemap.label.formatter
 */
function getBundleGraphTooltip(
  graph: TreemapNode
): TooltipFormatterCallback<CallbackDataParams & TreemapSeriesCallbackDataParams> {
  return (params) => {
    const node = params.data as TreemapNode;
    // NOTE(cedric): root only has `value` and `name`, while all nodes should have `modulePath`
    const isRoot = node.modulePath === undefined;
    // TODO(cedric): disable tooltip for root, the name is the absolute path and may be too large in some cases
    if (isRoot) return '';

    const type = isRoot ? 'directory' : getNodeType(node);
    const size = isRoot ? graph.moduleSize : node.moduleSize;
    const files = isRoot ? graph.moduleFiles : node.moduleFiles;
    // NOTE(cedric): quick workaround to _try_ break on `/` characters
    // see: https://stackoverflow.com/a/21780096
    const path = isRoot ? params.name : node.modulePath?.replaceAll('/', '/&#8203;');

    return `
      <div class="flex flex-col bg-screen text-default rounded-md leading-6 max-w-80">
        <div class="flex flex-row justify-between items-center mx-3 my-2 mb-0">
          <div class="inline-flex items-center ${type === 'package' ? 'font-bold' : ''}">
            ${ICON_BY_NODE_TYPE[type]}
            <span class="mx-2 text-wrap break-all ${isRoot ? 'leading-4' : ''}">${node.name}</span>
          </div>
          <span>${formatNodeValue(node)}</span>
        </div>
        <hr class="border-t border-t-secondary my-2 mx-2" />
        <span class="mx-3"><b>Size:</b> ${formatFileSize(size)}</span>
        ${
          files === 1
            ? `<span class="mx-3 text-quaternary">Files: ${files}</span>`
            : `<span class="mx-3"><b>Files:</b> ${files}</span>`
        }
        <code class="mx-3 mt-2 text-quaternary text-3xs leading-5 text-wrap break-words">${path}</code>
        <hr class="border-t border-t-secondary my-2 mx-2" />
        <span class="text-quaternary mx-3 my-2 mt-0">
          Open — <kbd class="ml-1 text-xs">⌘ + Click</kbd>
        </span>
      </div>
    `;
  };
}

/**
 * This type exists in `echarts`, but is not properly exposed.
 * @see https://github.com/apache/echarts/blob/c576f0c395ef9af87461fe93bcaa4490d89a331a/src/chart/treemap/TreemapSeries.ts#L78-L85
 */
interface TreemapSeriesCallbackDataParams {
  /**
   * @deprecated
   */
  treePathInfo?: TreePathInfo[];
  treeAncestors?: TreePathInfo[];
}

/**
 * This type exists in `echarts`, but is not properly exposed.
 * @see https://github.com/apache/echarts/blob/c576f0c395ef9af87461fe93bcaa4490d89a331a/src/chart/treemap/TreemapSeries.ts#L72-L76
 */
interface TreePathInfo {
  name: string;
  dataIndex: number;
  value: number | number[]; // Simplified from `TreemapSeriesDataValue`
}
