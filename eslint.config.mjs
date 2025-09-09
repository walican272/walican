import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.js",
      "*.mjs",
      "scripts/**",
      "setup-database-v2.js",
      "create-tables-via-api.js",
      "execute-groups-sql.js",
      "execute-sql-migration.js",
      "verify-and-setup-types.js",
    ],
  },
];

export default eslintConfig;
