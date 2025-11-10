import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadFileToGoogleDrive } from '@/lib/google-drive'

/**
 * API Route untuk upload file ke Google Drive
 * POST /api/google-drive/upload
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folderId = formData.get('folderId') as string | null
    const submissionId = formData.get('submissionId') as string | null
    const articleId = formData.get('articleId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Get Google Drive access token from environment or user settings
    // In production, this should be stored securely per user/tenant
    const accessToken = process.env.GOOGLE_DRIVE_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Google Drive not configured' },
        { status: 500 }
      )
    }

    // Upload to Google Drive
    const driveFile = await uploadFileToGoogleDrive(accessToken, {
      file,
      fileName: file.name,
      folderId: folderId || undefined,
      mimeType: file.type,
    })

    // Save to database
    const fileData: any = {
      file_id: driveFile.id,
      file_name: driveFile.name,
      web_view_link: driveFile.webViewLink,
      web_content_link: driveFile.webContentLink || null,
      mime_type: driveFile.mimeType,
      file_size: driveFile.size ? parseInt(driveFile.size) : null,
      uploaded_by: user.id,
      metadata: {
        parents: driveFile.parents,
        thumbnailLink: driveFile.thumbnailLink,
      },
    }

    if (submissionId) {
      // Link to submission file
      const { data: submissionFile } = await supabase
        .from('submission_files')
        .insert({
          submission_id: submissionId,
          file_type: 'manuscript',
          file_name: driveFile.name,
          file_path: driveFile.webViewLink, // Store webViewLink as path
          file_size: driveFile.size ? parseInt(driveFile.size) : null,
          mime_type: driveFile.mimeType,
          uploaded_by: user.id,
        })
        .select()
        .single()

      if (submissionFile) {
        fileData.submission_file_id = submissionFile.id
      }
    }

    if (articleId) {
      // Link to article file
      const { data: articleFile } = await supabase
        .from('article_files')
        .insert({
          article_id: articleId,
          file_type: 'pdf',
          file_name: driveFile.name,
          file_path: driveFile.webViewLink,
          file_size: driveFile.size ? parseInt(driveFile.size) : null,
          mime_type: driveFile.mimeType,
        })
        .select()
        .single()

      if (articleFile) {
        fileData.article_file_id = articleFile.id
      }
    }

    const { data: googleDriveFile, error } = await supabase
      .from('google_drive_files')
      .insert(fileData)
      .select()
      .single()

    if (error) {
      console.error('Error saving to database:', error)
      return NextResponse.json(
        { error: 'Failed to save file metadata' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      file: googleDriveFile,
      webViewLink: driveFile.webViewLink,
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}

