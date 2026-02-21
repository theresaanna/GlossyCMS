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

  it('has a lowImpact hero', () => {
    expect(homeStatic.hero.type).toBe('lowImpact')
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

  it('social media block has a header', () => {
    const socialMediaBlock = homeStatic.layout.find(
      (block: any) => block.blockType === 'socialMedia',
    ) as any
    expect(socialMediaBlock.header).toBe('Follow Us')
  })

  it('social media block has an empty platforms array', () => {
    const socialMediaBlock = homeStatic.layout.find(
      (block: any) => block.blockType === 'socialMedia',
    ) as any
    expect(socialMediaBlock.platforms).toEqual([])
  })

  it('has meta fields', () => {
    expect(homeStatic.meta).toBeDefined()
    expect(homeStatic.meta?.title).toBe('Home')
    expect(homeStatic.meta?.description).toBeDefined()
  })
})
