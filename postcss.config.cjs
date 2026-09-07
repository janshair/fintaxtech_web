// Central responsive breakpoint definitions. Components use these names.
const breakpoints = {
  tablet: 'min-width: 48rem',
  desktop: 'min-width: 70rem',
  'selector-desktop': 'min-width: 64rem',
  compact: 'max-width: 24rem',
};
module.exports = {
  plugins: [
    {
      postcssPlugin: 'design-breakpoints',
      AtRule: {
        media(rule) {
          for (const [key, value] of Object.entries(breakpoints))
            rule.params = rule.params.replace('--' + key, value);
        },
      },
    },
  ],
};
