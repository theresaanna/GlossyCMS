import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/utilities/clientVideoCompression.ts',
        'src/utilities/clientAudioCompression.ts',
        'src/utilities/getMediaUrl.ts',
        'src/access/approvedOrAuthenticated.ts',
        'src/collections/Comments/hooks/revalidateComment.ts',
        'src/collections/Media/hooks/revalidateMedia.ts',
        'src/app/(frontend)/posts/\\[slug\\]/actions.ts',
        'src/components/Comments/**/*.{ts,tsx}',
        'src/components/GalleryGrid/**/*.{ts,tsx}',
        'src/components/Link/index.tsx',
        'src/Gallery/**/*.{ts,tsx}',
        'src/fields/link.ts',

      ],
    },
  },
})
