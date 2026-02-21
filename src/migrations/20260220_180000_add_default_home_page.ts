import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Only create the home page if one doesn't already exist
  const existing = await db.execute(sql`
    SELECT id FROM pages WHERE slug = 'home' LIMIT 1
  `)

  if (existing.rows.length > 0) {
    return
  }

  const welcomeRichText = JSON.stringify({
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
  })

  // Insert the page with hero type 'none' — welcome content lives in blocks
  const result = await db.execute(sql`
    INSERT INTO pages (
      title, hero_type, slug, _status,
      meta_title, meta_description, published_at,
      updated_at, created_at
    ) VALUES (
      'Home', 'none', 'home', 'published',
      'Home', 'Welcome to our website.', now(),
      now(), now()
    ) RETURNING id
  `)

  const pageId = result.rows[0]?.id
  if (!pageId) return

  // Insert Content block with welcome message (layout position 0)
  const contentBlockResult = await db.execute(sql`
    INSERT INTO pages_blocks_content (
      _order, _parent_id, _path, id, block_name
    ) VALUES (
      0, ${pageId}, 'layout.0', gen_random_uuid()::text, null
    ) RETURNING id
  `)

  const contentBlockId = contentBlockResult.rows[0]?.id
  if (contentBlockId) {
    await db.execute(sql`
      INSERT INTO pages_blocks_content_columns (
        _order, _parent_id, id, size, rich_text
      ) VALUES (
        0, ${contentBlockId}, gen_random_uuid()::text, 'full', ${welcomeRichText}::jsonb
      )
    `)
  }

  // Insert Social Media block with Cash App link (layout position 1)
  const smBlockResult = await db.execute(sql`
    INSERT INTO pages_blocks_social_media (
      _order, _parent_id, _path, id, block_name, header
    ) VALUES (
      1, ${pageId}, 'layout.1', gen_random_uuid()::text, null, null
    ) RETURNING id
  `)

  const smBlockId = smBlockResult.rows[0]?.id
  if (smBlockId) {
    await db.execute(sql`
      INSERT INTO pages_blocks_social_media_platforms (
        _order, _parent_id, id, platform, custom_label, custom_url
      ) VALUES (
        0, ${smBlockId}, gen_random_uuid()::text, 'other', 'Cash App',
        'https://cash.app/$annaadorable'
      )
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Delete content block columns
  await db.execute(sql`
    DELETE FROM pages_blocks_content_columns
    WHERE _parent_id IN (
      SELECT c.id FROM pages_blocks_content c
      JOIN pages p ON c._parent_id = p.id
      WHERE p.slug = 'home'
    )
  `)

  // Delete content blocks
  await db.execute(sql`
    DELETE FROM pages_blocks_content
    WHERE _parent_id IN (SELECT id FROM pages WHERE slug = 'home')
  `)

  // Delete social media platforms
  await db.execute(sql`
    DELETE FROM pages_blocks_social_media_platforms
    WHERE _parent_id IN (
      SELECT sm.id FROM pages_blocks_social_media sm
      JOIN pages p ON sm._parent_id = p.id
      WHERE p.slug = 'home'
    )
  `)

  // Delete social media blocks
  await db.execute(sql`
    DELETE FROM pages_blocks_social_media
    WHERE _parent_id IN (SELECT id FROM pages WHERE slug = 'home')
  `)

  // Delete the page
  await db.execute(sql`
    DELETE FROM pages WHERE slug = 'home'
  `)
}
