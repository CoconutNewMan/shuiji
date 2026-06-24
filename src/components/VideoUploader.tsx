import React, { useState } from 'react';
import { useVideoUpload } from '../hooks/useVideoUpload';
import type { VideoPlatform } from '../types';

interface VideoUploaderProps {
  campaignId: string;
  onVideoUploaded: () => void;
}

const PLATFORMS: { label: string; value: VideoPlatform }[] = [
  { label: 'TikTok', value: 'tiktok' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Instagram Reels', value: 'instagram' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '抖音', value: 'douyin' },
];

export default function VideoUploader({ campaignId, onVideoUploaded }: VideoUploaderProps) {
  const { uploading, error, uploadVideoFile, addVideoLink } = useVideoUpload();
  const [mode, setMode] = useState<'upload' | 'link'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<VideoPlatform>('tiktok');

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadVideoFile(campaignId, file);
      onVideoUploaded();
    } catch (err) {
      // Error already handled by useVideoUpload hook
    }
  }

  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoUrl) return;

    try {
      await addVideoLink(campaignId, videoUrl, selectedPlatform);
      setVideoUrl('');
      onVideoUploaded();
    } catch (err) {
      // Error already handled by useVideoUpload hook
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">上传或粘贴视频</h3>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded ${mode === 'upload' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          上传文件
        </button>
        <button
          onClick={() => setMode('link')}
          className={`px-4 py-2 rounded ${mode === 'link' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          粘贴链接
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {mode === 'upload' ? (
        <div className="border-2 border-dashed border-gray-300 rounded p-6 text-center">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="video-upload"
          />
          <label htmlFor="video-upload" className="cursor-pointer">
            <p className="text-gray-600">
              {uploading ? '上传中...' : '点击选择视频或拖放到此'}
            </p>
          </label>
        </div>
      ) : (
        <form onSubmit={handleLinkSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">选择平台</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value as VideoPlatform)}
              className="w-full border rounded px-3 py-2"
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">视频链接</label>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.tiktok.com/@user/video/123456"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={uploading || !videoUrl}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {uploading ? '处理中...' : '开始提取'}
          </button>
        </form>
      )}
    </div>
  );
}
