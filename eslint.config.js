const spfxReact = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  ...spfxReact,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname
      }
    }
  },
  {
    ignores: ['lib/**', 'dist/**', 'temp/**', 'release/**', 'sharepoint/**', 'config/**']
  }
];
