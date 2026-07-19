import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'node_modules'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended, reactHooks.configs.flat['recommended-latest']],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.es2023 },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': 'off',
      // React Compiler experimental rules: disabled until the project opts into the compiler
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/use-memo': 'off',
      'react-hooks/void-use-memo': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
      'react-hooks/incompatible-library': 'off',
      'react-hooks/globals': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/error-boundaries': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/gating': 'off',
      'react-hooks/config': 'off',
    },
  },
  {
    files: ['vite.config.ts', 'playwright.config.ts', 'e2e/**/*.ts', 'src/test/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  /*
   * Single-source control enforcement.
   *
   * Raw form elements are banned outside src/shared/ui/controls/ so the design
   * system cannot silently decay. Native <select> and <input type="date"> in
   * particular render OS-drawn widgets that ignore our design tokens entirely.
   */
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/shared/ui/controls/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXOpeningElement[name.name="select"]',
          message:
            'Use <Select> or <MultiSelect> from @/shared/ui/controls. Native <select> renders an unstyleable OS dropdown.',
        },
        {
          selector: 'JSXOpeningElement[name.name="input"]',
          message:
            'Use <TextField>, <NumberField>, <DatePicker> or <Checkbox> from @/shared/ui/controls.',
        },
        {
          selector: 'JSXOpeningElement[name.name="textarea"]',
          message: 'Use <TextArea> from @/shared/ui/controls.',
        },
        {
          selector: 'JSXOpeningElement[name.name="button"]',
          message: 'Use <Button> or <IconButton> from @/shared/ui/controls.',
        },
      ],
    },
  },
);
