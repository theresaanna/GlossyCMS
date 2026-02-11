import { describe, it, expect } from 'vitest'
import { buildCommentTree } from '../buildCommentTree'
import type { Comment } from '@/payload-types'

function makeComment(overrides: Partial<Comment> & { id: number }): Comment {
  return {
    authorName: 'Test User',
    authorEmail: 'test@example.com',
    body: 'Test comment',
    post: 1,
    depth: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as Comment
}

describe('buildCommentTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([])
  })

  it('returns all comments as roots when none have parents', () => {
    const comments = [
      makeComment({ id: 1, authorName: 'Alice', body: 'First' }),
      makeComment({ id: 2, authorName: 'Bob', body: 'Second' }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(2)
    expect(tree[0].authorName).toBe('Alice')
    expect(tree[1].authorName).toBe('Bob')
    expect(tree[0].children).toEqual([])
    expect(tree[1].children).toEqual([])
  })

  it('nests child comments under their parent', () => {
    const comments = [
      makeComment({ id: 1, authorName: 'Alice', body: 'Root' }),
      makeComment({ id: 2, authorName: 'Bob', body: 'Reply', parent: 1 as any, depth: 1 }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].authorName).toBe('Alice')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].authorName).toBe('Bob')
  })

  it('handles deeply nested comments (3 levels)', () => {
    const comments = [
      makeComment({ id: 1, authorName: 'Alice', body: 'Root' }),
      makeComment({ id: 2, authorName: 'Bob', body: 'Reply 1', parent: 1 as any, depth: 1 }),
      makeComment({
        id: 3,
        authorName: 'Charlie',
        body: 'Reply 2',
        parent: 2 as any,
        depth: 2,
      }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].children).toHaveLength(1)
    expect(tree[0].children[0].children[0].authorName).toBe('Charlie')
  })

  it('treats comment with missing parent as root', () => {
    const comments = [
      makeComment({ id: 2, authorName: 'Bob', body: 'Orphan', parent: 999 as any, depth: 1 }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].authorName).toBe('Bob')
  })

  it('handles parent as object with id', () => {
    const comments = [
      makeComment({ id: 1, authorName: 'Alice', body: 'Root' }),
      makeComment({
        id: 2,
        authorName: 'Bob',
        body: 'Reply',
        parent: { id: 1 } as any,
        depth: 1,
      }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].authorName).toBe('Bob')
  })

  it('handles multiple children under one parent', () => {
    const comments = [
      makeComment({ id: 1, authorName: 'Alice', body: 'Root' }),
      makeComment({ id: 2, authorName: 'Bob', body: 'Reply 1', parent: 1 as any, depth: 1 }),
      makeComment({
        id: 3,
        authorName: 'Charlie',
        body: 'Reply 2',
        parent: 1 as any,
        depth: 1,
      }),
    ]

    const tree = buildCommentTree(comments)

    expect(tree).toHaveLength(1)
    expect(tree[0].children).toHaveLength(2)
    expect(tree[0].children[0].authorName).toBe('Bob')
    expect(tree[0].children[1].authorName).toBe('Charlie')
  })
})
