import * as migration_20260202_232218 from './20260202_232218';
import * as migration_20260207_004850 from './20260207_004850';
import * as migration_20260209_120000 from './20260209_120000';
import * as migration_20260210_002733 from './20260210_002733';
import * as migration_20260210_193201_add_gallery_block from './20260210_193201_add_gallery_block';
import * as migration_20260211_004204 from './20260211_004204';
import * as migration_20260213_120000_add_gallery_settings from './20260213_120000_add_gallery_settings';
import * as migration_20260214_041837 from './20260214_041837';
import * as migration_20260214_051734_add_social_media_block from './20260214_051734_add_social_media_block';
import * as migration_20260214_060000_add_posts_link_type from './20260214_060000_add_posts_link_type';
import * as migration_20260214_070000_remove_twitter_block from './20260214_070000_remove_twitter_block';
import * as migration_20260214_080000_add_newsletter from './20260214_080000_add_newsletter';
import * as migration_20260214_090000_fix_newsletter_locked_docs from './20260214_090000_fix_newsletter_locked_docs';
import * as migration_20260214_100000_add_newsletter_recipients_rel from './20260214_100000_add_newsletter_recipients_rel';
import * as migration_20260215_201432_add_carousel_gallery_block from './20260215_201432_add_carousel_gallery_block';
import * as migration_20260215_210000_add_cta_heading from './20260215_210000_add_cta_heading';
import * as migration_20260216_120000_add_social_media_header from './20260216_120000_add_social_media_header';

export const migrations = [
  {
    up: migration_20260202_232218.up,
    down: migration_20260202_232218.down,
    name: '20260202_232218',
  },
  {
    up: migration_20260207_004850.up,
    down: migration_20260207_004850.down,
    name: '20260207_004850',
  },
  {
    up: migration_20260209_120000.up,
    down: migration_20260209_120000.down,
    name: '20260209_120000',
  },
  {
    up: migration_20260210_002733.up,
    down: migration_20260210_002733.down,
    name: '20260210_002733',
  },
  {
    up: migration_20260210_193201_add_gallery_block.up,
    down: migration_20260210_193201_add_gallery_block.down,
    name: '20260210_193201_add_gallery_block',
  },
  {
    up: migration_20260211_004204.up,
    down: migration_20260211_004204.down,
    name: '20260211_004204',
  },
  {
    up: migration_20260213_120000_add_gallery_settings.up,
    down: migration_20260213_120000_add_gallery_settings.down,
    name: '20260213_120000_add_gallery_settings',
  },
  {
    up: migration_20260214_041837.up,
    down: migration_20260214_041837.down,
    name: '20260214_041837',
  },
  {
    up: migration_20260214_051734_add_social_media_block.up,
    down: migration_20260214_051734_add_social_media_block.down,
    name: '20260214_051734_add_social_media_block',
  },
  {
    up: migration_20260214_060000_add_posts_link_type.up,
    down: migration_20260214_060000_add_posts_link_type.down,
    name: '20260214_060000_add_posts_link_type',
  },
  {
    up: migration_20260214_070000_remove_twitter_block.up,
    down: migration_20260214_070000_remove_twitter_block.down,
    name: '20260214_070000_remove_twitter_block',
  },
  {
    up: migration_20260214_080000_add_newsletter.up,
    down: migration_20260214_080000_add_newsletter.down,
    name: '20260214_080000_add_newsletter',
  },
  {
    up: migration_20260214_090000_fix_newsletter_locked_docs.up,
    down: migration_20260214_090000_fix_newsletter_locked_docs.down,
    name: '20260214_090000_fix_newsletter_locked_docs',
  },
  {
    up: migration_20260214_100000_add_newsletter_recipients_rel.up,
    down: migration_20260214_100000_add_newsletter_recipients_rel.down,
    name: '20260214_100000_add_newsletter_recipients_rel',
  },
  {
    up: migration_20260215_201432_add_carousel_gallery_block.up,
    down: migration_20260215_201432_add_carousel_gallery_block.down,
    name: '20260215_201432_add_carousel_gallery_block'
  },
  {
    up: migration_20260215_210000_add_cta_heading.up,
    down: migration_20260215_210000_add_cta_heading.down,
    name: '20260215_210000_add_cta_heading',
  },
  {
    up: migration_20260216_120000_add_social_media_header.up,
    down: migration_20260216_120000_add_social_media_header.down,
    name: '20260216_120000_add_social_media_header',
  },
];
