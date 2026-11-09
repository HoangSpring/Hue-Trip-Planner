import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'api/_server.generated/**'] },
  ...tseslint.configs.recommended,
)
