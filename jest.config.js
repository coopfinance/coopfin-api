/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "node",
  // class-validator / class-transformer decorators need the reflect-metadata polyfill.
  setupFiles: ["reflect-metadata"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"],
  // Transpile-only so unit tests don't fail on unrelated pre-existing type
  // errors elsewhere in the graph; `tsc`/`nest build` still enforces types.
  transform: {
    "^.+\\.ts$": ["ts-jest", { isolatedModules: true }],
  },
};
