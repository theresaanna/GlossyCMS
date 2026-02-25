import type { Payload } from 'payload'

/**
 * Ensure a default home page exists in the Pages collection.
 * Called on init so that every instance (including the primary) has an
 * editable home page, even if the original migration was already marked
 * as run before the page was created.
 */
export async function ensureHomePage(payload: Payload): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    return
  }

  await payload.create({
    collection: 'pages',
    depth: 0,
    overrideAccess: true,
    context: { disableRevalidate: true },
    data: {
      title: 'Home',
      slug: 'home',
      _status: 'published',
      hero: {
        type: 'none',
      },
      layout: [
        {
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'heading',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'Welcome to Your New Site',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      tag: 'h2',
                      version: 1,
                    },
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'This is your home page. Edit it from the ',
                          version: 1,
                        },
                        {
                          type: 'link',
                          children: [
                            {
                              type: 'text',
                              detail: 0,
                              format: 0,
                              mode: 'normal',
                              style: '',
                              text: 'admin panel',
                              version: 1,
                            },
                          ],
                          direction: 'ltr',
                          fields: {
                            linkType: 'custom',
                            newTab: false,
                            url: '/admin',
                          },
                          format: '',
                          indent: 0,
                          version: 3,
                        },
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: ' to make it your own.',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
                      version: 1,
                    },
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  version: 1,
                },
              },
            },
          ],
        },
      ],
      meta: {
        title: 'Home',
        description: 'Welcome to our website.',
      },
    },
  })

  payload.logger.info('Created default home page.')
}
