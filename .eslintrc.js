module.exports = {
  root: true,
  extends: [
    'expo',
    '@react-native-community',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier', // Must be last to override other formatting rules
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: [
    'react',
    'react-hooks',
    'react-native',
    '@typescript-eslint',
    'import',
    'jest',
    'security',
  ],
  env: {
    'react-native/react-native': true,
    es6: true,
    node: true,
    jest: true,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
  },
  rules: {
    // General code quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'no-unused-vars': 'off', // Handled by TypeScript
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'eqeqeq': ['error', 'always'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    
    // TypeScript specific
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    
    // React specific
    'react/prop-types': 'off', // TypeScript handles this
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/display-name': 'warn',
    'react/jsx-key': 'error',
    'react/jsx-no-duplicate-props': 'error',
    'react/jsx-no-undef': 'error',
    'react/jsx-uses-vars': 'error',
    'react/no-deprecated': 'warn',
    'react/no-unsafe': 'error',
    'react/jsx-filename-extension': [
      'error',
      { extensions: ['.jsx', '.tsx'] },
    ],
    
    // React Hooks
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // React Native specific
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'warn',
    
    // Import/Export
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external', 
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-cycle': 'error',
    'import/no-self-import': 'error',
    'import/no-duplicates': 'error',
    
    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'warn',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-non-literal-require': 'warn',
    'security/detect-possible-timing-attacks': 'warn',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Performance
    'no-await-in-loop': 'warn',
    'no-inner-declarations': 'error',
    
    // Best practices
    'prefer-template': 'error',
    'object-shorthand': 'error',
    'no-useless-concat': 'error',
    'no-useless-escape': 'error',
    'no-regex-spaces': 'error',
    'array-callback-return': 'error',
    'consistent-return': 'error',
    'default-case': 'error',
    'no-fallthrough': 'error',
    'no-multi-str': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-self-compare': 'error',
    'no-unmodified-loop-condition': 'error',
    'no-unused-expressions': 'error',
    'radix': 'error',
  },
  overrides: [
    // Test files
    {
      files: ['**/__tests__/**/*', '**/*.{test,spec}.{js,ts,tsx}'],
      extends: ['plugin:jest/recommended'],
      env: {
        jest: true,
      },
      rules: {
        'jest/no-disabled-tests': 'warn',
        'jest/no-focused-tests': 'error',
        'jest/no-identical-title': 'error',
        'jest/prefer-to-have-length': 'warn',
        'jest/valid-expect': 'error',
        '@typescript-eslint/no-explicit-any': 'off', // More lenient in tests
      },
    },
    // Migration scripts
    {
      files: ['migration/**/*.js'],
      env: {
        node: true,
        es6: true,
      },
      rules: {
        'no-console': 'off', // Console logging needed for migration feedback
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // Configuration files
    {
      files: [
        '*.config.js',
        '*.config.ts',
        'babel.config.js',
        'metro.config.js',
        'jest.config.js',
      ],
      env: {
        node: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '.expo/',
    'android/',
    'ios/',
    '*.d.ts',
  ],
};