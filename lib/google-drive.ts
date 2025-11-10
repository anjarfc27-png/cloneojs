/**
 * Google Drive Integration untuk OJS
 * Menggunakan Google Drive API untuk menyimpan dan mengakses file PDF
 */

export interface GoogleDriveFile {
  id: string
  name: string
  webViewLink: string
  webContentLink?: string
  mimeType: string
  size?: string
  thumbnailLink?: string
  parents?: string[]
}

export interface UploadFileOptions {
  file: File | Buffer
  fileName: string
  folderId?: string
  mimeType?: string
}

/**
 * Upload file ke Google Drive
 * Note: Ini memerlukan Google Drive API credentials
 */
export async function uploadFileToGoogleDrive(
  accessToken: string,
  options: UploadFileOptions
): Promise<GoogleDriveFile> {
  const { file, fileName, folderId, mimeType = 'application/pdf' } = options

  const form = new FormData()
  const metadata = {
    name: fileName,
    ...(folderId && { parents: [folderId] }),
  }

  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  
  if (file instanceof File) {
    form.append('file', file)
  } else {
    form.append('file', new Blob([file], { type: mimeType }), fileName)
  }

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink,mimeType,size,thumbnailLink,parents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Google Drive upload failed: ${error.error?.message || 'Unknown error'}`)
  }

  return await response.json()
}

/**
 * Get file metadata dari Google Drive
 */
export async function getFileMetadata(
  accessToken: string,
  fileId: string
): Promise<GoogleDriveFile> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,webViewLink,webContentLink,mimeType,size,thumbnailLink,parents`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get file metadata: ${error.error?.message || 'Unknown error'}`)
  }

  return await response.json()
}

/**
 * Create folder di Google Drive
 */
export async function createFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<GoogleDriveFile> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  }

  if (parentFolderId) {
    metadata.parents = [parentFolderId]
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink,parents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create folder: ${error.error?.message || 'Unknown error'}`)
  }

  return await response.json()
}

/**
 * Share file dengan permission tertentu
 */
export async function shareFile(
  accessToken: string,
  fileId: string,
  permission: {
    type: 'user' | 'group' | 'domain' | 'anyone'
    role: 'reader' | 'commenter' | 'writer'
    emailAddress?: string
  }
): Promise<void> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/permissions`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: permission.role,
        type: permission.type,
        ...(permission.emailAddress && { emailAddress: permission.emailAddress }),
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to share file: ${error.error?.message || 'Unknown error'}`)
  }
}

/**
 * Generate webViewLink untuk embed PDF
 */
export function getEmbedUrl(webViewLink: string): string {
  // Convert webViewLink to embeddable format
  const fileId = webViewLink.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
  if (!fileId) {
    return webViewLink
  }
  return `https://drive.google.com/file/d/${fileId}/preview`
}

