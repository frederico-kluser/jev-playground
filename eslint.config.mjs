import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored Motion UI registry sources (owned by `npx shadcn add @motion/*`,
    // rewritten on every add) and the generated motion theme. Do not lint/edit.
    "components/motion-ui/**",
    "motion.theme.ts",
  ]),
]);

export default eslintConfig;
