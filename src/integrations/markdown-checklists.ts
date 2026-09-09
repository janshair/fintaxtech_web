import { defineHastPlugin } from 'satteri';

// Markdown checklists are static content. Give each disabled checkbox its adjacent text as an accessible name.
export default defineHastPlugin({
  name: 'accessible-checklists',
  element: {
    filter: ['input'],
    visit(node, context) {
      if (node.properties.type !== 'checkbox' || !node.properties.disabled) return;
      const parent = context.parent(node);
      if (parent?.type !== 'element' || !['li', 'p'].includes(parent.tagName)) return;
      const label = context.textContent(parent).trim();
      if (label) context.setProperty(node, 'ariaLabel', label);
    },
  },
});
