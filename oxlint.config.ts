import { defineConfig } from "oxlint"

export default defineConfig({
  categories: {
    correctness: "warn",
  },
  ignorePatterns: [".agents/**"],
  // https://oxc.rs/docs/guide/usage/linter/rules.html
  rules: {
    "eslint/no-unused-expressions": [
      "warn",
      {
        allowTaggedTemplates: true,
      },
    ],
  },
})
