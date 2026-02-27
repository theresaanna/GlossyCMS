import type { Media as MediaType } from '@/payload-types'

import { Media } from '@/components/Media'

type Props = {
  media: MediaType
  alt: string
}

export const InlineUploadMedia: React.FC<Props> = ({ media, alt }) => {
  return (
    <div className="my-4">
      <Media
        imgClassName="border border-border rounded-[0.8rem]"
        videoClassName="border border-border rounded-[0.8rem] max-w-full max-h-[80vh]"
        resource={{ ...media, alt }}
      />
    </div>
  )
}
