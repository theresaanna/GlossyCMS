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
        // Utilities
        'src/utilities/clientVideoCompression.ts',
        'src/utilities/clientAudioCompression.ts',
        'src/utilities/getMediaUrl.ts',
        'src/utilities/formatAuthors.ts',
        'src/utilities/formatDateTime.ts',
        'src/utilities/toKebabCase.ts',
        'src/utilities/deepMerge.ts',
        'src/utilities/getURL.ts',
        'src/utilities/generatePreviewPath.ts',
        'src/utilities/stripe.ts',
        'src/utilities/vercel-api.ts',

        // Access control
        'src/access/approvedOrAuthenticated.ts',

        // Collection hooks
        'src/collections/Comments/hooks/revalidateComment.ts',
        'src/collections/Comments/hooks/notifyCommentRecipients.ts',
        'src/collections/Media/hooks/revalidateMedia.ts',
        'src/collections/Posts/hooks/revalidatePost.ts',
        'src/collections/Posts/hooks/populateAuthors.ts',
        'src/collections/Pages/hooks/revalidatePage.ts',
        'src/collections/ProvisionedSites/hooks/validateSubdomain.ts',

        // Global hooks
        'src/Footer/hooks/revalidateFooter.ts',
        'src/SiteSettings/hooks/revalidateSiteSettings.ts',
        'src/AdultContent/hooks/revalidateAdultContent.ts',
        'src/hooks/populatePublishedAt.ts',
        'src/hooks/revalidateRedirects.ts',

        // App routes
        'src/app/(frontend)/posts/\\[slug\\]/actions.ts',

        // Components
        'src/components/Comments/**/*.{ts,tsx}',
        'src/components/GalleryGrid/**/*.{ts,tsx}',
        'src/components/Link/index.tsx',

        // Other
        'src/Gallery/**/*.{ts,tsx}',
        'src/fields/link.ts',
      ],
    },
  },
})
