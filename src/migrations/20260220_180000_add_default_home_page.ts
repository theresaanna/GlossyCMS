import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

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
        type: 'lowImpact',
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
                    text: 'Welcome',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                tag: 'h1',
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
      layout: [
        {
          blockType: 'socialMedia',
          blockName: 'Social Media',
          header: 'Follow Us',
          platforms: [],
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
  // Remove the default home page created by this migration
  await payload.delete({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    context: { disableRevalidate: true },
    req,
  })
}
