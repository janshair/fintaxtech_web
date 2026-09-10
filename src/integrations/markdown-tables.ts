import { blogCopy } from '../content/blog';
import { defineHastPlugin } from 'satteri';

// Build-time markup: tables remain readable and keyboard-scrollable without JavaScript.
export default defineHastPlugin({
  name: 'accessible-tables',
  element: {
    filter: ['table', 'th'],
    visit(node, context) {
      if (node.tagName === 'th') {
        // Preserve an intentionally blank first header visually, while naming its column for assistive technology.
        const parent = context.parent(node);
        const index = context.indexOf(node);
        const isFirstCell =
          parent &&
          index !== undefined &&
          !parent.children.slice(0, index).some((child) => child.type === 'element');
        if (isFirstCell && !context.textContent(node).trim() && !node.properties.ariaLabel)
          context.appendChild(node, {
            type: 'element',
            tagName: 'span',
            properties: { className: ['sr-only'] },
            children: [{ type: 'text', value: blogCopy.tableRowHeading }],
          });
        return;
      }
      context.wrapNode(node, {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-scroll'],
          tabIndex: 0,
          role: 'region',
          ariaLabel: blogCopy.table,
        },
        children: [],
      });
    },
  },
});
