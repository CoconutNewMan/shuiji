import { useState } from 'react';
import { videoService } from '../services/videoService';
import type { VideoInput, VideoPlatform } from '../types';

export function useVideoUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoInput, setVideoInput] = useState<VideoInput | null>(null);

  async function uploadVideoFile(campaignId: string, file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await videoService.uploadVideoFile(campaignId, file);
      setVideoInput(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  async function addVideoLink(
    campaignId: string,
    videoUrl: string,
    platform: VideoPlatform
  ) {
    setUploading(true);
    setError(null);
    try {
      const result = await videoService.addVideoLink(campaignId, videoUrl, platform);
      setVideoInput(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add video link';
      setError(message);
      throw err;
    } finally {
      setUploading(false);
    }
  }

  return { uploading, error, videoInput, uploadVideoFile, addVideoLink };
}
