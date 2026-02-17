import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

const HELPERS_PATH = join(__dirname, '..', 'provision-helpers.sh')

/**
 * Run a bash snippet that sources provision-helpers.sh and executes a command.
 */
function runHelper(script: string): string {
  return execSync(`bash -c 'source "${HELPERS_PATH}" && ${script}'`, {
    encoding: 'utf-8',
  }).trim()
}

describe('provision-helpers.sh', () => {
  describe('generate_secret', () => {
    it('produces a 64-character hex string', () => {
      const secret = runHelper('generate_secret')
      expect(secret).toHaveLength(64)
      expect(secret).toMatch(/^[0-9a-f]{64}$/)
    })

    it('produces unique values on each call', () => {
      const secret1 = runHelper('generate_secret')
      const secret2 = runHelper('generate_secret')
      expect(secret1).not.toBe(secret2)
    })
  })

  describe('check_prerequisites', () => {
    it('succeeds when all tools are available', () => {
      // This should not throw because gh, vercel, openssl, pnpm should be
      // installed in the dev environment
      expect(() => runHelper('check_prerequisites')).not.toThrow()
    })
  })

  describe('substitute_template', () => {
    it('replaces placeholders with values', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'provision-test-'))
      const inputFile = join(tempDir, 'template.env')
      const outputFile = join(tempDir, 'output.env')

      try {
        writeFileSync(
          inputFile,
          [
            'SITE_NAME=__SITE_NAME__',
            'FROM_EMAIL=__FROM_EMAIL__',
            'POSTGRES_URL=__POSTGRES_URL__',
          ].join('\n'),
        )

        runHelper(
          `substitute_template "${inputFile}" "${outputFile}" "__SITE_NAME__=My Site" "__FROM_EMAIL__=test@example.com" "__POSTGRES_URL__=postgresql://localhost:5432/testdb"`,
        )

        const result = readFileSync(outputFile, 'utf-8')
        expect(result).toContain('SITE_NAME=My Site')
        expect(result).toContain('FROM_EMAIL=test@example.com')
        expect(result).toContain('POSTGRES_URL=postgresql://localhost:5432/testdb')
        expect(result).not.toContain('__SITE_NAME__')
        expect(result).not.toContain('__FROM_EMAIL__')
        expect(result).not.toContain('__POSTGRES_URL__')
      } finally {
        rmSync(tempDir, { recursive: true })
      }
    })

    it('handles values with special characters', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'provision-test-'))
      const inputFile = join(tempDir, 'template.env')
      const outputFile = join(tempDir, 'output.env')

      try {
        writeFileSync(inputFile, 'POSTGRES_URL=__POSTGRES_URL__\n')

        runHelper(
          `substitute_template "${inputFile}" "${outputFile}" "__POSTGRES_URL__=postgresql://user:p@ss@host:5432/db?sslmode=require"`,
        )

        const result = readFileSync(outputFile, 'utf-8')
        expect(result).toContain(
          'POSTGRES_URL=postgresql://user:p@ss@host:5432/db?sslmode=require',
        )
      } finally {
        rmSync(tempDir, { recursive: true })
      }
    })

    it('preserves unmatched placeholders', () => {
      const tempDir = mkdtempSync(join(tmpdir(), 'provision-test-'))
      const inputFile = join(tempDir, 'template.env')
      const outputFile = join(tempDir, 'output.env')

      try {
        writeFileSync(
          inputFile,
          ['SITE_NAME=__SITE_NAME__', 'OTHER=__OTHER__'].join('\n'),
        )

        runHelper(
          `substitute_template "${inputFile}" "${outputFile}" "__SITE_NAME__=My Site"`,
        )

        const result = readFileSync(outputFile, 'utf-8')
        expect(result).toContain('SITE_NAME=My Site')
        expect(result).toContain('OTHER=__OTHER__')
      } finally {
        rmSync(tempDir, { recursive: true })
      }
    })
  })

  describe('provision-client.sh argument parsing', () => {
    const SCRIPT_PATH = join(__dirname, '..', 'provision-client.sh')

    it('shows help with --help flag', () => {
      const output = execSync(`bash "${SCRIPT_PATH}" --help 2>&1`, {
        encoding: 'utf-8',
      })
      expect(output).toContain('Usage:')
      expect(output).toContain('--client-name')
      expect(output).toContain('--org')
      expect(output).toContain('--team')
    })

    it('fails when --client-name is missing', () => {
      expect(() =>
        execSync(`bash "${SCRIPT_PATH}" --org test --team test 2>&1`, {
          encoding: 'utf-8',
        }),
      ).toThrow()
    })

    it('fails when --org is missing', () => {
      expect(() =>
        execSync(`bash "${SCRIPT_PATH}" --client-name test --team test 2>&1`, {
          encoding: 'utf-8',
        }),
      ).toThrow()
    })

    it('fails when --team is missing', () => {
      expect(() =>
        execSync(`bash "${SCRIPT_PATH}" --client-name test --org test 2>&1`, {
          encoding: 'utf-8',
        }),
      ).toThrow()
    })
  })
})
