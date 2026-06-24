import { supabase } from '../lib/supabase';
import type { VideoInput, VideoPlatform } from '../types';

export const videoService = {
  async uploadVideoFile(campaignId: string, file: File): Promise<VideoInput> {
    // Upload to S3 via Supabase storage
    const fileName = `videos/${campaignId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from('ad-videos')
      .upload(fileName, file);

    if (error) throw new Error(`Upload failed: ${error.message}`);

    const fileUrl = supabase.storage
      .from('ad-videos')
      .getPublicUrl(fileName).data.publicUrl;

    // Create video_input record
    const { data: videoInput, error: dbError } = await supabase
      .from('video_inputs')
      .insert({
        campaign_id: campaignId,
        video_file_url: fileUrl,
        platform: 'uploaded',
        extraction_status: 'pending',
      })
      .select()
      .single();

    if (dbError) throw new Error(`Database error: ${dbError.message}`);
    return videoInput as VideoInput;
  },

  async addVideoLink(
    campaignId: string,
    videoUrl: string,
    platform: VideoPlatform
  ): Promise<VideoInput> {
    const { data, error } = await supabase
      .from('video_inputs')
      .insert({
        campaign_id: campaignId,
        video_url: videoUrl,
        platform,
        extraction_status: 'pending',
      })
      .select()
      .single();

    if (error) throw new Error(`Database error: ${error.message}`);
    return data as VideoInput;
  },

  async getExtractionStatus(videoInputId: string): Promise<VideoInput> {
    const { data, error } = await supabase
      .from('video_inputs')
      .select('*')
      .eq('id', videoInputId)
      .single();

    if (error) throw new Error(`Fetch error: ${error.message}`);
    return data as VideoInput;
  },
};
