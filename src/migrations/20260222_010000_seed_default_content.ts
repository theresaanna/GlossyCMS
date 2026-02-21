import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Idempotency: skip if seed content already exists
  const existing = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    limit: 1,
    depth: 0,
    req,
  })

  if (existing.docs.length > 0) {
    return
  }

  // ─── 1. Create About page ───

  const aboutPage = await payload.create({
    collection: 'pages',
    depth: 0,
    context: { disableRevalidate: true },
    req,
    data: {
      title: 'About',
      slug: 'about',
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
                    text: 'About',
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
          blockType: 'content',
          columns: [
            {
              size: 'full',
              richText: {
                root: {
                  type: 'root',
                  children: [
                    {
                      type: 'paragraph',
                      children: [
                        {
                          type: 'text',
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'This is your About page. Tell your visitors who you are, what you do, and what makes you unique.',
                          version: 1,
                        },
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 0,
                      textFormat: 0,
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
                          text: 'You can edit this page from the admin panel. Add images, links, and more to make it your own.',
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
        title: 'About',
        description: 'Learn more about us.',
      },
    },
  })

  // ─── 2. Create Welcome post ───

  await payload.create({
    collection: 'posts',
    depth: 0,
    context: { disableRevalidate: true },
    req,
    data: {
      title: 'Welcome to Your New Site',
      slug: 'welcome-to-your-new-site',
      _status: 'published',
      content: {
        root: {
          type: 'root',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Welcome to your new site! This is a sample post to help you get started. You can edit or delete this post from the admin panel.',
                  version: 1,
                },
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              textFormat: 0,
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
                  text: 'To create a new post, go to the admin panel and click on Posts in the sidebar. From there you can write, format, and publish your content.',
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
      meta: {
        title: 'Welcome to Your New Site',
        description: 'Your first post on your new site.',
      },
    },
  })

  // ─── 3. Populate Site Settings from signup form (passed as env vars) ───

  const siteName = process.env.SITE_NAME || undefined
  const siteDescription = process.env.SITE_DESCRIPTION || undefined

  if (siteName || siteDescription) {
    await payload.updateGlobal({
      slug: 'site-settings',
      context: { disableRevalidate: true },
      req,
      data: {
        ...(siteName ? { siteTitle: siteName } : {}),
        ...(siteDescription ? { siteDescription } : {}),
      },
    })
  }

  // ─── 4. Populate Header nav ───

  await payload.updateGlobal({
    slug: 'header',
    context: { disableRevalidate: true },
    req,
    data: {
      navItems: [
        {
          link: {
            type: 'reference',
            newTab: false,
            label: 'About',
            reference: {
              relationTo: 'pages',
              value: aboutPage.id,
            },
          },
        },
        {
          link: {
            type: 'posts',
            newTab: false,
            label: 'Posts',
          },
        },
      ],
    },
  })

  // ─── 5. Populate Footer nav + newsletter ───

  await payload.updateGlobal({
    slug: 'footer',
    context: { disableRevalidate: true },
    req,
    data: {
      enableNewsletter: true,
      newsletterHeading: 'Stay in the loop',
      navItems: [
        {
          link: {
            type: 'reference',
            newTab: false,
            label: 'About',
            reference: {
              relationTo: 'pages',
              value: aboutPage.id,
            },
          },
        },
        {
          link: {
            type: 'posts',
            newTab: false,
            label: 'Posts',
          },
        },
      ],
    },
  })
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // 1. Clear site settings
  await payload.updateGlobal({
    slug: 'site-settings',
    req,
    data: {
      siteTitle: null,
      siteDescription: null,
    },
  })

  // 2. Clear header nav
  await payload.updateGlobal({
    slug: 'header',
    req,
    data: { navItems: [] },
  })

  // 3. Clear footer nav + newsletter
  await payload.updateGlobal({
    slug: 'footer',
    req,
    data: {
      enableNewsletter: false,
      newsletterHeading: null,
      navItems: [],
    },
  })

  // 4. Delete welcome post
  const posts = await payload.find({
    collection: 'posts',
    where: { slug: { equals: 'welcome-to-your-new-site' } },
    limit: 1,
    depth: 0,
    req,
  })
  for (const doc of posts.docs) {
    await payload.delete({ collection: 'posts', id: doc.id, req })
  }

  // 5. Delete About page
  const pages = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'about' } },
    limit: 1,
    depth: 0,
    req,
  })
  for (const doc of pages.docs) {
    await payload.delete({ collection: 'pages', id: doc.id, req })
  }
}
