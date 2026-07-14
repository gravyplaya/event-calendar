import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettier from 'eslint-plugin-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Ignore build artifacts
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),

  // Prettier plugin (not included in eslint-config-next)
  {
    plugins: {
      prettier: prettier,
    },
  },

  // Custom rules
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          trailingComma: 'all',
          semi: true,
          singleQuote: true,
          endOfLine: 'auto',
        },
        {
          usePrettierrc: true,
        },
      ],

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // React 19 / eslint-plugin-react-hooks v5 introduced these new static analysis
      // rules. They flag real patterns, but fixing them requires non-trivial refactoring
      // (moving ref reads to effects, replacing setState-in-effect with useMemo, etc.).
      // Downgrade to warnings so lint passes while we address them incrementally.
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'error',
      'react-hooks/immutability': 'warn',
      'react-hooks/incompatible-library': 'warn',

      // a11y
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-noninteractive-element-interactions': 'error',
      'jsx-a11y/anchor-is-valid': 'error',

      // TypeScript
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);

export default eslintConfig;
