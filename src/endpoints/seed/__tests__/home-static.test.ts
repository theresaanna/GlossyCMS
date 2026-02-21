import { describe, it, expect } from 'vitest'
import { homeStatic } from '../home-static'

describe('homeStatic', () => {
  it('has slug "home"', () => {
    expect(homeStatic.slug).toBe('home')
  })

  it('has published status', () => {
    expect(homeStatic._status).toBe('published')
  })

  it('has title "Home"', () => {
    expect(homeStatic.title).toBe('Home')
  })

  it('has a none hero type', () => {
    expect(homeStatic.hero.type).toBe('none')
  })

  it('has a non-empty layout', () => {
    expect(homeStatic.layout).toBeDefined()
    expect(homeStatic.layout.length).toBeGreaterThan(0)
  })

  it('has a social media block in the layout', () => {
    const socialMediaBlock = homeStatic.layout.find(
      (block: any) => block.blockType === 'socialMedia',
    )
    expect(socialMediaBlock).toBeDefined()
  })

  it('social media block has no header', () => {
    const socialMediaBlock = homeStatic.layout.find(
      (block: any) => block.blockType === 'socialMedia',
    ) as any
    expect(socialMediaBlock.header).toBeNull()
  })

  it('social media block has a Cash App platform', () => {
    const socialMediaBlock = homeStatic.layout.find(
      (block: any) => block.blockType === 'socialMedia',
    ) as any
    expect(socialMediaBlock.platforms).toHaveLength(1)
    expect(socialMediaBlock.platforms[0].platform).toBe('other')
    expect(socialMediaBlock.platforms[0].customLabel).toBe('Cash App')
  })

  it('has meta fields', () => {
    expect(homeStatic.meta).toBeDefined()
    expect(homeStatic.meta?.title).toBe('Home')
    expect(homeStatic.meta?.description).toBeDefined()
  })
})
