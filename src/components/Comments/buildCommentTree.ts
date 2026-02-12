import type { Comment } from '@/payload-types'
import type { CommentNode } from './CommentThread'

export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const map = new Map<string, CommentNode>()
  const roots: CommentNode[] = []

  for (const comment of comments) {
    map.set(String(comment.id), {
      id: String(comment.id),
      authorName: comment.authorName,
      body: comment.body,
      depth: comment.depth || 0,
      createdAt: comment.createdAt,
      children: [],
    })
  }

  for (const comment of comments) {
    const node = map.get(String(comment.id))!
    const parentId = typeof comment.parent === 'object' ? comment.parent?.id : comment.parent

    if (parentId && map.has(String(parentId))) {
      map.get(String(parentId))!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
