import { Capacitor } from '@capacitor/core'
import { Share } from '@capacitor/share'
import { Filesystem, Directory } from '@capacitor/filesystem'

export async function shareOrDownloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/csv'
): Promise<void> {
  const isNative = Capacitor.isNativePlatform()

  if (!isNative) {
    // Desktop/browser: use standard download link
    const dataUri = `data:${mimeType};charset=utf-8,` + encodeURIComponent(content)
    const link = document.createElement('a')
    link.href = dataUri
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  // Mobile (iOS/Android): write to temp file then share via native sheet
  const base64Content = btoa(unescape(encodeURIComponent(content)))

  const ext = filename.split('.').pop() || 'txt'
  const tempName = `export_${Date.now()}.${ext}`

  await Filesystem.writeFile({
    path: tempName,
    data: base64Content,
    directory: Directory.Cache,
    encoding: 'base64',
  })

  const uriResult = await Filesystem.getUri({
    directory: Directory.Cache,
    path: tempName,
  })

  await Share.share({
    title: filename,
    text: filename,
    url: uriResult.uri,
    dialogTitle: 'Save or Share Export',
  })
}

export async function shareOrDownloadDataUri(
  dataUri: string,
  filename: string
): Promise<void> {
  const isNative = Capacitor.isNativePlatform()

  if (!isNative) {
    const link = document.createElement('a')
    link.href = dataUri
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return
  }

  // For data URIs (like PDFs/PNGs from jsPDF/html2canvas), extract base64 and share
  const base64Match = dataUri.match(/^data:[^;]+;base64,(.+)$/)
  if (!base64Match) {
    // Fallback: try to encode the raw content
    const commaIdx = dataUri.indexOf(',')
    const raw = commaIdx >= 0 ? dataUri.substring(commaIdx + 1) : dataUri
    const base64Content = btoa(decodeURIComponent(raw))
    return shareBase64(base64Content, filename)
  }

  return shareBase64(base64Match[1], filename)
}

async function shareBase64(base64Content: string, filename: string): Promise<void> {
  const ext = filename.split('.').pop() || 'txt'
  const tempName = `export_${Date.now()}.${ext}`

  await Filesystem.writeFile({
    path: tempName,
    data: base64Content,
    directory: Directory.Cache,
    encoding: 'base64',
  })

  const uriResult = await Filesystem.getUri({
    directory: Directory.Cache,
    path: tempName,
  })

  await Share.share({
    title: filename,
    text: filename,
    url: uriResult.uri,
    dialogTitle: 'Save or Share Export',
  })
}
