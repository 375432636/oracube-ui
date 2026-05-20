import React from 'react'

interface Props {
  photoPath: string | null
}

const PhotoThumbnail: React.FC<Props> = ({ photoPath }) => {
  if (!photoPath) return null

  return (
    <div className="photo-thumbnail">
      <img data-testid="photo-img" src={photoPath} alt="最近照片" />
    </div>
  )
}

export default PhotoThumbnail
