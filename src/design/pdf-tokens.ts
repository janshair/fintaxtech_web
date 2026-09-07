// PDF always uses the approved light palette and A4 dimensions (millimetres).
export const pdfTokens = {
  color: {
    text: [11, 13, 16],
    muted: [89, 97, 112],
    accent: [37, 99, 235],
    border: [216, 220, 227],
  },
  layout: {
    margin: 18,
    width: 174,
    bottom: 271,
    start: 22,
    footerRule: 278,
    footerText: 284,
    footerAddress: 289,
  },
  type: { body: 10, heading: 14, small: 9, footer: 7, brand: 18, lineHeight: 0.46 },
  space: { paragraph: 2, heading: 3 },
} as const;
