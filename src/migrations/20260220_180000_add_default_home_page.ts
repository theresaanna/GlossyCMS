import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Only create the home page if one doesn't already exist
  const existing = await db.execute(sql`
    SELECT id FROM pages WHERE slug = 'home' LIMIT 1
  `)

  if (existing.rows.length > 0) {
    return
  }

  const heroRichText = JSON.stringify({
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
  })

  // Insert the page
  const result = await db.execute(sql`
    INSERT INTO pages (
      title, hero_type, hero_rich_text, slug, _status,
      meta_title, meta_description, published_at,
      updated_at, created_at
    ) VALUES (
      'Home', 'lowImpact', ${heroRichText}::jsonb, 'home', 'published',
      'Home', 'Welcome to our website.', now(),
      now(), now()
    ) RETURNING id
  `)

  const pageId = result.rows[0]?.id
  if (!pageId) return

  // Insert social media block (empty platforms)
  await db.execute(sql`
    INSERT INTO pages_blocks_social_media (
      _order, _parent_id, _path, id, block_name, header
    ) VALUES (
      0, ${pageId}, 'layout.0', gen_random_uuid()::text, 'Social Media', 'Follow Us'
    )
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Delete the social media block first (FK cascade would handle this, but be explicit)
  await db.execute(sql`
    DELETE FROM pages_blocks_social_media
    WHERE _parent_id IN (SELECT id FROM pages WHERE slug = 'home')
  `)

  await db.execute(sql`
    DELETE FROM pages WHERE slug = 'home'
  `)
}
