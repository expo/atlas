import type { AtlasBundle, AtlasModule } from '~core/data/types';

export type TreemapNode = {
  /** If the current node is the root of the treemap */
  isRoot?: true;
  /** The current path of the node */
  name: string;
  /** The size, in percentage, of all modules within this node (based on `module.size`) */
  value: number;
  /** Possible files/folders within this node */
  children?: TreemapNode[];
  /** The size, in bytes, of all modules within this node (based on `module.size`) */
  moduleSize: number;
  /** The amount of module files within this node group */
  moduleFiles: number;
  /** The full path of this node group, based on `module.path` segments */
  modulePath: string;
  /** If this group is the root path of a module, the module name */
  modulePackage?: string;
  /** The treemap item style, set for individual packages */
  itemStyle?: { color: string };
};

/**
 * Iterate over all children within the tree.
 * Note, this won't visit the root node, as no parent is available for this node.
 */
export function traverse(
  node: TreemapNode,
  visitor: (child: TreemapNode, parent: TreemapNode) => any
) {
  if (!node.children?.length) return;
  for (const child of node.children) {
    visitor(child, node);
    traverse(child, visitor);
  }
}

/**
 * Apply final transformaitons to the module tree, to visualize the treemap better.
 * These modifications include:
 *   - Merging `@<org>` -> `<package>` nodes into `@<org>/<package>` node
 *   - Merging single child nodes into their parent node
 *   - Sorting all nodes by module size
 *   - Assigning colors to package nodes and their children
 */
export function finalizeModuleTree(node: TreemapNode): TreemapNode {
  return assignPackageColors(
    sortNodesByModuleSize(simplifySingleChildNodes(simplifyOrgPackageNodes(node)))
  );
}

/**
 * Create a nested treemap from the list of modules.
 * This will group the modules by `module.path` segments, and add metadata to each node.
 */
export function createModuleTree(
  bundle: Pick<AtlasBundle, 'sharedRoot'>,
  modules: AtlasModule[]
): TreemapNode {
  const totalSize = modules.reduce((total, module) => total + module.size, 0);
  const sharedRoot = bundle.sharedRoot.replace(/\\/g, '/'); // Format as posix path
  const root: TreemapNode = {
    isRoot: true,
    name: sharedRoot,
    value: 100, // 100%
    moduleSize: totalSize,
    moduleFiles: modules.length,
    // NOTE(cedric): technically, this should be the bundle's shared root,
    // but that kind of clutters the treemap's tooltip a bit
    modulePath: '',
    modulePackage: undefined,
  };

  for (const module of modules) {
    module.relativePath.split('/').reduce((node, segment, index, segments) => {
      let child = node.children?.find((child) => child.name === segment);

      if (!child) {
        // Create the child for segment paths if not found
        child = {
          name: segment,
          value: 0,
          moduleSize: 0,
          moduleFiles: 0,
          modulePath: segments.slice(0, index + 1).join('/'),
          modulePackage: undefined,
        };
        // Add them to the current node
        node.children = node.children || [];
        node.children.push(child);
      }

      // Update the current segment node size with module info
      child.moduleSize += module.size;
      child.moduleFiles += 1;
      child.value = (child.moduleSize / totalSize) * 100;

      // Update the package property, if the current segment is the root of the package
      const prevSegment = segments[index - 1] || '';
      if (
        module.package &&
        (segment === module.package || `${prevSegment}/${segment}` === module.package)
      ) {
        child.modulePackage = module.package;
      }

      // Return the updated child node, for next segment path iteration
      return child;
    }, root);
  }

  return root;
}

/**
 * Simplify single child nodes by merging the child into it's parent node.
 * This simplifies the amount of boxes needed to render the treemap.
 *
 * It converts groups like these:
 *   - @expo/vector-icons -> src -> [file.js, other.js]
 *     ↪ @expo/vector-icons/src -> [file.js, other.js]
 *   - components -> AwesomeThing -> AwesomeThing.js
 *     ↪ components/AwesomeThing/AwesomeThing.js
 */
export function simplifySingleChildNodes(tree: TreemapNode): TreemapNode {
  function mergeIntoParent(node: TreemapNode, parent: TreemapNode) {
    // Recursively combine nested 1-child nodes
    if (node.children?.length === 1) {
      mergeIntoParent(node.children[0], node);
    }

    // Merge or pull the "useless" nodes into the parent node
    if (parent.children?.length === 1) {
      // If we are modifying the root node with only a single child, only inherit the name
      if (parent === tree && !node.children) {
        const nameSegments = node.name.split('/');
        const nameForOtherSegments = nameSegments.slice(0, -1).join('/');

        // NOTE(cedric): the `modulePath` of the root node is ignored, no need to edit
        node.name = nameSegments[nameSegments.length - 1];
        parent.name = !parent.isRoot
          ? `${parent.name}/${nameForOtherSegments}`
          : nameForOtherSegments;
      } else {
        parent.name = !parent.isRoot ? `${parent.name}/${node.name}` : node.name;
        parent.value = node.value;
        parent.children = node.children;
        parent.moduleSize = node.moduleSize;
        parent.modulePath = node.modulePath;
        parent.modulePackage = parent.modulePackage || node.modulePackage;
        parent.moduleFiles = node.moduleFiles; // This should always the same value
      }
    }
  }

  traverse(tree, (node, parent) => mergeIntoParent(node, parent));

  return tree;
}

/**
 * Simplify organisation packages by merging the `@<org>` -> `<package>` structure into a single group.
 * This simplifies the amount of boxes needed to render the treemap.
 *
 * It converts groups like these:
 *   - @expo -> vector-icons -> src
 *     ↪ @expo/vector-icons -> src
 *   - @react-navigation -> [core, stack, tabs]
 *     ↪ [@react-navigation/core, @react-navigation/stack, @react-navigation/tabs]
 */
export function simplifyOrgPackageNodes(tree: TreemapNode): TreemapNode {
  traverse(tree, (node, parent) => {
    // Merge two nodes that describe an organisation package (`@<org>` -> `<package>`)
    if (node.name.startsWith('@') && node.children) {
      parent.children = parent.children
        // Delete original `@<org>` node
        ?.filter((item) => item !== node)
        // Create new `@<org>/<package>` nodes
        .concat(
          node.children.map((child) => ({
            ...child,
            name: `${node.name}/${child.name}`,
            modulePath: `${node.modulePath}/${child.name}`,
          }))
        );
    }
  });

  return tree;
}

/**
 * Sort all children in each node, by the module size in descending order.
 * This is important when assigning color values to each package node.
 */
export function sortNodesByModuleSize(tree: TreemapNode): TreemapNode {
  traverse(tree, (node) => {
    node.children = node.children?.sort((a, b) => b.moduleSize - a.moduleSize);
  });

  return tree;
}

/**
 * Assign each package node, and it's children, the same color for a consistent visual representation.
 * This also assigns a new color to children nodes, if that children node is a sub-package.
 */
export function assignPackageColors(tree: TreemapNode) {
  const colors = ['#37434A', '#282A35', '#3C5056', '#263C5F', '#313158', '#4A325C'];
  const colorByPackage: Record<string, string> = {};

  let packageCounter = 0;

  function packageColor(packageName: string) {
    if (!colorByPackage[packageName]) {
      colorByPackage[packageName] = colors[packageCounter++ % colors.length];
    }

    return colorByPackage[packageName];
  }

  // Traverse won't iterate over the root node, add coloring if necessary
  if (tree.modulePackage) {
    tree.itemStyle = { color: packageColor(tree.modulePackage) };
  }

  traverse(tree, (node, parent) => {
    // Define the per-package color when a package node is found
    if (node.modulePackage && !node.itemStyle) {
      node.itemStyle = { color: packageColor(node.modulePackage) };
    }

    // If the parent has a color, apply it to the child, without overwriting nested package nodes
    if (!node.modulePackage && parent.itemStyle && !node.itemStyle) {
      node.itemStyle = parent.itemStyle;
    }
  });

  return tree;
}
