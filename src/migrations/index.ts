import * as migration_20260202_232218 from './20260202_232218';
import * as migration_20260207_004850 from './20260207_004850';
import * as migration_20260209_120000 from './20260209_120000';

export const migrations = [
  {
    up: migration_20260202_232218.up,
    down: migration_20260202_232218.down,
    name: '20260202_232218',
  },
  {
    up: migration_20260207_004850.up,
    down: migration_20260207_004850.down,
    name: '20260207_004850'
  },
  {
    up: migration_20260209_120000.up,
    down: migration_20260209_120000.down,
    name: '20260209_120000'
  },
];
