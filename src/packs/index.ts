import type { RulePack } from "@/core/types";
import { ERC_COP_SOLAR_GROUND } from "./erc-cop";
import { ESG24_PACKS } from "./esg24";
import { GENERAL_PACKS } from "./thai-general";
import { TAX_APP_PACKS } from "./tax-apps";

export { DOMAINS, APPS } from "./domains";

/** Every rule pack installed in this COP24 tenant. */
export const ALL_PACKS: RulePack[] = [
  ERC_COP_SOLAR_GROUND,
  ...ESG24_PACKS,
  ...GENERAL_PACKS,
  ...TAX_APP_PACKS,
];

export const packById = (id: string): RulePack | undefined => ALL_PACKS.find((p) => p.id === id);

export const obligationById = (id: string) => {
  for (const p of ALL_PACKS) {
    const o = p.obligations.find((x) => x.id === id);
    if (o) return { pack: p, obligation: o };
  }
  return undefined;
};
