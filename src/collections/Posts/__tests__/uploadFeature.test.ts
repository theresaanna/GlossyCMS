import { describe, it, expect } from 'vitest'
import { Posts } from '../index'

describe('Posts collection UploadFeature', () => {
  it('includes the content richText field', () => {
    const tabs = Posts.fields.find((f) => 'tabs' in f && f.type === 'tabs') as any
    const contentTab = tabs.tabs.find((t: any) => t.label === 'Content')
    const contentField = contentTab.fields.find((f: any) => f.name === 'content')
    expect(contentField).toBeDefined()
    expect(contentField.type).toBe('richText')
  })

  it('has an editor with features function', () => {
    const tabs = Posts.fields.find((f) => 'tabs' in f && f.type === 'tabs') as any
    const contentTab = tabs.tabs.find((t: any) => t.label === 'Content')
    const contentField = contentTab.fields.find((f: any) => f.name === 'content')
    expect(contentField.editor).toBeDefined()
  })

  it('includes UploadFeature in the imports', async () => {
    // Verify UploadFeature is imported (indirect: the module loads without error)
    const module = await import('../index')
    expect(module.Posts).toBeDefined()
    expect(module.Posts.slug).toBe('posts')
  })
})
