import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Idempotency: skip if seed content already exists
  const existing = await db.execute(sql`
    SELECT id FROM pages WHERE slug = 'about' LIMIT 1
  `)
  if (existing.rows.length > 0) {
    return
  }

  // ─── 1. Add platform entries to home page social media block ───

  const smBlock = await db.execute(sql`
    SELECT sm.id FROM pages_blocks_social_media sm
    JOIN pages p ON sm._parent_id = p.id
    WHERE p.slug = 'home'
    LIMIT 1
  `)

  if (smBlock.rows.length > 0) {
    const smBlockId = smBlock.rows[0].id

    await db.execute(sql`
      INSERT INTO pages_blocks_social_media_platforms (
        _order, _parent_id, id, platform, username, notes
      ) VALUES
      (0, ${smBlockId}, gen_random_uuid()::text, 'instagram', 'yourname',
       'Visit /admin to create your first admin account'),
      (1, ${smBlockId}, gen_random_uuid()::text, 'x', 'yourname',
       'Visit /admin/globals/site-settings to configure your site title and settings')
    `)
  }

  // ─── 2. Create About page ───

  const aboutHeroRichText = JSON.stringify({
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
  })

  const aboutContentRichText = JSON.stringify({
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
  })

  const aboutResult = await db.execute(sql`
    INSERT INTO pages (
      title, hero_type, hero_rich_text, slug, _status,
      meta_title, meta_description, published_at,
      updated_at, created_at
    ) VALUES (
      'About', 'lowImpact', ${aboutHeroRichText}::jsonb, 'about', 'published',
      'About', 'Learn more about us.', now(),
      now(), now()
    ) RETURNING id
  `)

  const aboutPageId = aboutResult.rows[0]?.id

  if (aboutPageId) {
    // Insert Content block for About page
    const contentBlockResult = await db.execute(sql`
      INSERT INTO pages_blocks_content (
        _order, _parent_id, _path, id, block_name
      ) VALUES (
        0, ${aboutPageId}, 'layout.0', gen_random_uuid()::text, null
      ) RETURNING id
    `)

    const contentBlockId = contentBlockResult.rows[0]?.id

    if (contentBlockId) {
      await db.execute(sql`
        INSERT INTO pages_blocks_content_columns (
          _order, _parent_id, id, size, rich_text
        ) VALUES (
          0, ${contentBlockId}, gen_random_uuid()::text, 'full', ${aboutContentRichText}::jsonb
        )
      `)
    }
  }

  // ─── 3. Create Welcome post ───

  const postContent = JSON.stringify({
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
  })

  const postResult = await db.execute(sql`
    INSERT INTO posts (
      title, content, slug, _status, published_at,
      meta_title, meta_description,
      updated_at, created_at
    ) VALUES (
      'Welcome to Your New Site', ${postContent}::jsonb,
      'welcome-to-your-new-site', 'published', now(),
      'Welcome to Your New Site', 'Your first post on your new site.',
      now(), now()
    ) RETURNING id
  `)

  const postId = postResult.rows[0]?.id

  // ─── 4. Populate Header nav ───

  await db.execute(sql`
    INSERT INTO header (id, updated_at, created_at)
    VALUES (1, now(), now())
    ON CONFLICT (id) DO UPDATE SET updated_at = now()
  `)

  // Clear any existing nav items
  await db.execute(sql`DELETE FROM header_rels WHERE parent_id = 1`)
  await db.execute(sql`DELETE FROM header_nav_items WHERE _parent_id = 1`)

  // About page link (reference)
  await db.execute(sql`
    INSERT INTO header_nav_items (
      _order, _parent_id, id, link_type, link_new_tab, link_label
    ) VALUES (
      0, 1, gen_random_uuid()::text, 'reference', false, 'About'
    )
  `)

  // Posts listing link
  await db.execute(sql`
    INSERT INTO header_nav_items (
      _order, _parent_id, id, link_type, link_new_tab, link_label
    ) VALUES (
      1, 1, gen_random_uuid()::text, 'posts', false, 'Posts'
    )
  `)

  // Reference rel for About page link
  if (aboutPageId) {
    await db.execute(sql`
      INSERT INTO header_rels (
        "order", parent_id, path, pages_id
      ) VALUES (
        1, 1, 'navItems.0.link.reference', ${aboutPageId}
      )
    `)
  }

  // Reference rel for Welcome post link
  if (postId) {
    // We could add the post to nav too, but the user asked for About + Posts listing
  }

  // ─── 5. Populate Footer nav + newsletter ───

  await db.execute(sql`
    INSERT INTO footer (id, enable_newsletter, newsletter_heading, updated_at, created_at)
    VALUES (1, true, 'Stay in the loop', now(), now())
    ON CONFLICT (id) DO UPDATE SET
      enable_newsletter = true,
      newsletter_heading = 'Stay in the loop',
      updated_at = now()
  `)

  // Clear any existing nav items
  await db.execute(sql`DELETE FROM footer_rels WHERE parent_id = 1`)
  await db.execute(sql`DELETE FROM footer_nav_items WHERE _parent_id = 1`)

  // About page link (reference)
  await db.execute(sql`
    INSERT INTO footer_nav_items (
      _order, _parent_id, id, link_type, link_new_tab, link_label
    ) VALUES (
      0, 1, gen_random_uuid()::text, 'reference', false, 'About'
    )
  `)

  // Posts listing link
  await db.execute(sql`
    INSERT INTO footer_nav_items (
      _order, _parent_id, id, link_type, link_new_tab, link_label
    ) VALUES (
      1, 1, gen_random_uuid()::text, 'posts', false, 'Posts'
    )
  `)

  // Reference rel for About page link
  if (aboutPageId) {
    await db.execute(sql`
      INSERT INTO footer_rels (
        "order", parent_id, path, pages_id
      ) VALUES (
        1, 1, 'navItems.0.link.reference', ${aboutPageId}
      )
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // 1. Clear footer
  await db.execute(sql`DELETE FROM footer_rels WHERE parent_id = 1`)
  await db.execute(sql`DELETE FROM footer_nav_items WHERE _parent_id = 1`)
  await db.execute(sql`
    UPDATE footer SET enable_newsletter = false, newsletter_heading = null WHERE id = 1
  `)

  // 2. Clear header
  await db.execute(sql`DELETE FROM header_rels WHERE parent_id = 1`)
  await db.execute(sql`DELETE FROM header_nav_items WHERE _parent_id = 1`)

  // 3. Delete welcome post
  await db.execute(sql`DELETE FROM posts WHERE slug = 'welcome-to-your-new-site'`)

  // 4. Delete About page (cascade handles block child rows)
  await db.execute(sql`DELETE FROM pages WHERE slug = 'about'`)

  // 5. Delete social media platforms from home page
  await db.execute(sql`
    DELETE FROM pages_blocks_social_media_platforms
    WHERE _parent_id IN (
      SELECT sm.id FROM pages_blocks_social_media sm
      JOIN pages p ON sm._parent_id = p.id
      WHERE p.slug = 'home'
    )
  `)
}
