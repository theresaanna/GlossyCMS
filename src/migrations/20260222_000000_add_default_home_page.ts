import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Only create the home page if one doesn't already exist
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.docs.length > 0) {
    return
  }

  await payload.create({
    collection: 'pages',
    depth: 0,
    context: { disableRevalidate: true },
    req,
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
                          text: 'This is your home page. Edit it from the admin panel to make it your own.',
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
        {
          blockType: 'socialMedia',
          platforms: [
            {
              platform: 'other',
              customLabel: 'Cash App',
              customUrl: 'https://cash.app/$annaadorable',
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
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    depth: 0,
    req,
  })

  for (const doc of existing.docs) {
    await payload.delete({
      collection: 'pages',
      id: doc.id,
      req,
    })
  }
}
