import { describe, it, expect } from 'vitest'
import { CarouselGallery } from '../config'

describe('CarouselGallery block config', () => {
  it('has the correct slug', () => {
    expect(CarouselGallery.slug).toBe('carouselGallery')
  })

  it('has the correct interfaceName', () => {
    expect(CarouselGallery.interfaceName).toBe('CarouselGalleryBlock')
  })

  it('has correct labels', () => {
    expect(CarouselGallery.labels).toEqual({
      singular: 'Carousel Gallery',
      plural: 'Carousel Galleries',
    })
  })

  it('has a title text field', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'title',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
  })

  it('has a populateBy select field with folder and selection options', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'populateBy',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('select')
    expect(field.defaultValue).toBe('folder')
    const values = field.options.map((o: any) => o.value)
    expect(values).toContain('folder')
    expect(values).toContain('selection')
  })

  it('shows folder field only when populateBy is folder', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'folder',
    ) as any
    expect(field.admin.condition({}, { populateBy: 'folder' })).toBe(true)
    expect(field.admin.condition({}, { populateBy: 'selection' })).toBe(false)
  })

  it('shows limit field only when populateBy is folder', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'limit',
    ) as any
    expect(field.admin.condition({}, { populateBy: 'folder' })).toBe(true)
    expect(field.admin.condition({}, { populateBy: 'selection' })).toBe(false)
  })

  it('shows selectedMedia field only when populateBy is selection', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'selectedMedia',
    ) as any
    expect(field.admin.condition({}, { populateBy: 'selection' })).toBe(true)
    expect(field.admin.condition({}, { populateBy: 'folder' })).toBe(false)
  })

  it('has an autoplay checkbox field defaulting to false', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'autoplay',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('checkbox')
    expect(field.defaultValue).toBe(false)
  })

  it('shows autoplayDelay only when autoplay is true', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'autoplayDelay',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(3000)
    expect(field.admin.condition({}, { autoplay: true })).toBe(true)
    expect(field.admin.condition({}, { autoplay: false })).toBe(false)
  })

  it('has a loop checkbox field defaulting to true', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'loop',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('checkbox')
    expect(field.defaultValue).toBe(true)
  })

  it('has a slidesPerView number field with min 1 and max 5', () => {
    const field = CarouselGallery.fields.find(
      (f) => 'name' in f && f.name === 'slidesPerView',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('number')
    expect(field.defaultValue).toBe(1)
    expect(field.min).toBe(1)
    expect(field.max).toBe(5)
  })
})
