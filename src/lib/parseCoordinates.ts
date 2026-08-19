import { Coordinate } from '@/types/map';

export interface ParseWarning {
  line: string;
  issue: string;
}

export interface ParseResult {
  coordinates: Omit<Coordinate, 'id'>[];
  warnings: ParseWarning[];
}

const isNumberToken = (token: string) => /^[+-]?\d+(\.\d+)?$/.test(token);

/**
 * Parses lines in the format "label, x, y, z".
 * Commas are optional / can be partially missing, e.g.:
 *   "Snowy Mountain Village -1354 117 -1"
 *   "Log cabin, 144 71, 100"
 */
export const parseCoordinateLines = (text: string): ParseResult => {
  const coordinates: Omit<Coordinate, 'id'>[] = [];
  const warnings: ParseWarning[] = [];

  if (!text.trim()) return { coordinates, warnings };

  const lines = text.trim().split('\n').filter(line => line.trim());

  for (const line of lines) {
    const tokens = line
      .split(/[,\s]+/)
      .map(t => t.trim())
      .filter(Boolean);

    // Take the trailing numeric tokens as x, y, z
    let numStart = tokens.length;
    while (numStart > 0 && isNumberToken(tokens[numStart - 1]) && tokens.length - numStart < 3) {
      numStart--;
    }
    const numbers = tokens.slice(numStart);
    const label = tokens.slice(0, numStart).join(' ').trim();

    if (numbers.length < 3) {
      warnings.push({ line, issue: 'Missing coordinates (needs label, x, y, z)' });
      continue;
    }

    if (!label) {
      warnings.push({ line, issue: 'Missing label' });
      continue;
    }

    const [x, y, z] = numbers.map(n => parseInt(n, 10));

    if (isNaN(x) || isNaN(y) || isNaN(z)) {
      warnings.push({ line, issue: 'Invalid coordinates (must be numbers)' });
      continue;
    }

    if (Math.abs(y) > 500) {
      warnings.push({ line, issue: 'Y coordinate seems unusually high/low for Minecraft' });
    }

    coordinates.push({ x, y, z, label });
  }

  return { coordinates, warnings };
};
