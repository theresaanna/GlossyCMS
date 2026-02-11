import * as migration_20260202_232218 from './20260202_232218';
import * as migration_20260207_004850 from './20260207_004850';
import * as migration_20260209_120000 from './20260209_120000';
import * as migration_20260210_002733 from './20260210_002733';
import * as migration_20260210_193201_add_gallery_block from './20260210_193201_add_gallery_block';
import * as migration_20260211_004204 from './20260211_004204';

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
    name: '20260211_004204'
  },
];
