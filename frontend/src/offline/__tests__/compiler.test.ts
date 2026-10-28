import { readFileSync } from 'node:fs'
import { transformSync } from '@babel/core'
import { describe, expect, it } from 'vitest'
import { reactCompilerBabelPlugins } from '../../../babel-react-compiler.js'

describe('non-React café data modules in the actual build compiler', () => {
  it('does not inject render-only memo hooks into APIs called by background work', () => {
    for (const file of ['../cafeCache.ts', '../../utils/api.ts', '../../hooks/useSessionExpiry.ts', '../../stores/dataStore.ts', '../../stores/cafeStore.ts', '../../pwa/install.ts']) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      const output = transformSync(source, { filename: 'data.ts', parserOpts: { plugins: ['typescript'] }, plugins: reactCompilerBabelPlugins })!.code!
      expect(output).not.toContain('react/compiler-runtime')
      expect(output).not.toContain('useMemoCache')
    }
  })
})
