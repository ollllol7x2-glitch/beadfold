function channel(value: number) {
  const normalized = value / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
}

export function contrastRatio(foreground: string, background: string): number {
  const parse = (hex: string) => {
    const value = hex.replace('#', '');
    return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
  };
  const [fr = 0, fg = 0, fb = 0] = parse(foreground);
  const [br = 0, bg = 0, bb = 0] = parse(background);
  const first = 0.2126 * channel(fr) + 0.7152 * channel(fg) + 0.0722 * channel(fb);
  const second = 0.2126 * channel(br) + 0.7152 * channel(bg) + 0.0722 * channel(bb);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}
