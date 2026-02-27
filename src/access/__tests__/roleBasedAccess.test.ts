import { describe, it, expect } from 'vitest'
import { isAdmin } from '../isAdmin'
import { Posts } from '@/collections/Posts'
import { Pages } from '@/collections/Pages'
import { Media } from '@/collections/Media'
import { Categories } from '@/collections/Categories'
import { Comments } from '@/collections/Comments'
import { Newsletters } from '@/collections/Newsletters'
import { NewsletterRecipients } from '@/collections/NewsletterRecipients'
import { Users } from '@/collections/Users'
import { Header } from '@/Header/config'
import { Footer } from '@/Footer/config'
import { SiteSettings } from '@/SiteSettings/config'
import { Gallery } from '@/Gallery/config'
import { AdultContent } from '@/AdultContent/config'

describe('Role-based access control', () => {
  describe('Collections restrict write access to admins', () => {
    it('Posts: create, update, delete require admin', () => {
      expect(Posts.access?.create).toBe(isAdmin)
      expect(Posts.access?.update).toBe(isAdmin)
      expect(Posts.access?.delete).toBe(isAdmin)
    })

    it('Pages: create, update, delete require admin', () => {
      expect(Pages.access?.create).toBe(isAdmin)
      expect(Pages.access?.update).toBe(isAdmin)
      expect(Pages.access?.delete).toBe(isAdmin)
    })

    it('Media: create, update, delete require admin', () => {
      expect(Media.access?.create).toBe(isAdmin)
      expect(Media.access?.update).toBe(isAdmin)
      expect(Media.access?.delete).toBe(isAdmin)
    })

    it('Categories: create, update, delete require admin', () => {
      expect(Categories.access?.create).toBe(isAdmin)
      expect(Categories.access?.update).toBe(isAdmin)
      expect(Categories.access?.delete).toBe(isAdmin)
    })

    it('Comments: update, delete require admin', () => {
      expect(Comments.access?.update).toBe(isAdmin)
      expect(Comments.access?.delete).toBe(isAdmin)
    })

    it('Newsletters: create, update, delete require admin', () => {
      expect(Newsletters.access?.create).toBe(isAdmin)
      expect(Newsletters.access?.update).toBe(isAdmin)
      expect(Newsletters.access?.delete).toBe(isAdmin)
    })

    it('NewsletterRecipients: update, delete require admin', () => {
      expect(NewsletterRecipients.access?.update).toBe(isAdmin)
      expect(NewsletterRecipients.access?.delete).toBe(isAdmin)
    })

    it('Users: create, delete require admin; role field update requires admin', () => {
      expect(Users.access?.create).toBe(isAdmin)
      expect(Users.access?.delete).toBe(isAdmin)

      const roleField = Users.fields.find(
        (field) => 'name' in field && field.name === 'role',
      )
      expect(roleField).toBeDefined()
      expect(roleField && 'access' in roleField && roleField.access?.update).toBe(isAdmin)
    })
  })

  describe('Globals restrict update access to admins', () => {
    it('Header: update requires admin', () => {
      expect(Header.access?.update).toBe(isAdmin)
    })

    it('Footer: update requires admin', () => {
      expect(Footer.access?.update).toBe(isAdmin)
    })

    it('SiteSettings: update requires admin', () => {
      expect(SiteSettings.access?.update).toBe(isAdmin)
    })

    it('Gallery: update requires admin', () => {
      expect(Gallery.access?.update).toBe(isAdmin)
    })

    it('AdultContent: update requires admin', () => {
      expect(AdultContent.access?.update).toBe(isAdmin)
    })
  })

  describe('Users collection has role field', () => {
    it('has a role select field with admin and viewer options', () => {
      const roleField = Users.fields.find(
        (field) => 'name' in field && field.name === 'role',
      )
      expect(roleField).toBeDefined()
      expect(roleField && 'type' in roleField && roleField.type).toBe('select')
      expect(roleField && 'options' in roleField && roleField.options).toEqual([
        { label: 'Admin', value: 'admin' },
        { label: 'Viewer', value: 'viewer' },
      ])
      expect(roleField && 'defaultValue' in roleField && roleField.defaultValue).toBe('admin')
      expect(roleField && 'required' in roleField && roleField.required).toBe(true)
    })
  })
})
