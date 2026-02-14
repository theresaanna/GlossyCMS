/**
 * Social Media Platforms Configuration
 *
 * Add new platforms here and they will automatically appear as options
 * in the Social Media block. Each platform needs:
 *
 * - `value`: unique identifier (used internally)
 * - `label`: display name shown in the admin UI
 * - `urlPrefix`: the base URL prepended to the username (set to '' if the field should be a full URL)
 * - `icon`: SVG path data for the platform icon (24x24 viewBox)
 * - `usernameLabel`: placeholder text shown in the admin input (e.g. "@username" or "username")
 */

export type SocialPlatform = {
  value: string
  label: string
  urlPrefix: string
  icon: string
  usernameLabel: string
}

export const socialPlatforms: SocialPlatform[] = [
  {
    value: 'x',
    label: 'X (Twitter)',
    urlPrefix: 'https://x.com/',
    icon: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    usernameLabel: 'username',
  },
  {
    value: 'instagram',
    label: 'Instagram',
    urlPrefix: 'https://instagram.com/',
    icon: 'M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z',
    usernameLabel: 'username',
  },
  {
    value: 'facebook',
    label: 'Facebook',
    urlPrefix: 'https://facebook.com/',
    icon: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z',
    usernameLabel: 'username or page name',
  },
  {
    value: 'loyalfans',
    label: 'LoyalFans',
    urlPrefix: 'https://www.loyalfans.com/',
    icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    usernameLabel: 'username',
  },
  {
    value: 'throne',
    label: 'Throne',
    urlPrefix: 'https://throne.com/',
    icon: 'M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z',
    usernameLabel: 'username',
  },
  {
    value: 'youpay',
    label: 'YouPay',
    urlPrefix: 'https://youpay.co/',
    icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.96-3.12 3.19z',
    usernameLabel: 'username',
  },
]
