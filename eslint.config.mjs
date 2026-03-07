import expo from 'eslint-config-expo/flat.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...expo,
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'coverage/',
      '.worktrees/',
      'docs/',
    ],
  },
];
