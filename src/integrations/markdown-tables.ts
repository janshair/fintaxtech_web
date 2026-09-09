import { blogCopy } from '../content/blog';
import { defineHastPlugin } from 'satteri';

// Build-time markup: tables remain readable and keyboard-scrollable without JavaScript.
export default defineHastPlugin({
  name: 'accessible-tables',
  element: {
    filter: ['table'],
    visit(node, context) {
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
