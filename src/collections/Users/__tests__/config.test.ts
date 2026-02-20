import { describe, it, expect } from 'vitest'
import { Users } from '../index'

describe('Users collection config', () => {
  it('has the correct slug', () => {
    expect(Users.slug).toBe('users')
  })

  it('has auth enabled', () => {
    expect(Users.auth).toBe(true)
  })

  it('has timestamps enabled', () => {
    expect(Users.timestamps).toBe(true)
  })

  it('uses name as admin title', () => {
    expect(Users.admin?.useAsTitle).toBe('name')
  })

  it('has default columns of name and email', () => {
    expect(Users.admin?.defaultColumns).toEqual(['name', 'email'])
  })

  it('has a name text field', () => {
    const field = Users.fields.find(
      (f) => 'name' in f && f.name === 'name',
    ) as any
    expect(field).toBeDefined()
    expect(field.type).toBe('text')
  })

  it('has all expected fields', () => {
    const fieldNames = Users.fields
      .filter((f) => 'name' in f)
      .map((f) => ('name' in f ? f.name : ''))
    expect(fieldNames).toContain('name')
    expect(fieldNames).toHaveLength(1)
  })

  it('has authenticated access control on all operations', () => {
    expect(Users.access).toBeDefined()
    expect(Users.access!.admin).toBeDefined()
    expect(Users.access!.create).toBeDefined()
    expect(Users.access!.delete).toBeDefined()
    expect(Users.access!.read).toBeDefined()
    expect(Users.access!.update).toBeDefined()
  })
})
