import expo from 'eslint-config-expo/flat.js';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...expo,
  {
    // eslint-config-expo 58 turned on the React Compiler rules as errors. The compiler isn't
    // enabled here (no experiments.reactCompiler) and the RN app is frozen pending the SwiftUI
    // cutover, so keep them visible as warnings rather than rewriting working hooks.
    rules: {
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/',
      '.expo/',
      'coverage/',
      '.worktrees/',
      'workers/',
      'docs/',
    ],
  },
];
