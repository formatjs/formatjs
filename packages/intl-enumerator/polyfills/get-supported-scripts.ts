import type { Script } from "../data/scripts";
import { scripts } from "../data/scripts";

export function getSupportedScripts(): Script[] {
  const ATOZ = "abcdefghijklmnopqrstuvwxyz";
  const supportedScripts: Script[] = [];

  for (const script of scripts) {
    if (script.length === 4) {
      supportedScripts.push(script);
    } else if (script.length === 6 && script[4] === '~') {
      const start = ATOZ.indexOf(script[3]);
      const end = ATOZ.indexOf(script[5]);

      for (let i = start; i <= end; i++) {
        const scr = script.substring(0, 3) + ATOZ[i] as Script;
        supportedScripts.push(scr);
      }
    }
  }

  return supportedScripts;
}