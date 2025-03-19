import fetch from 'node-fetch';

/**
 * Generate a video using HeyGen API with an avatar speaking the provided text
 * @param {Object} params - Parameters for the video generation
 * @param {string} params.text - The text for the avatar to speak
 * @param {string} params.avatarId - The ID of the avatar to use
 * @param {string} params.voiceId - The ID of the voice to use
 * @param {boolean} [params.noHeygen] - If true, skip HeyGen API call and use fallback URL
 * @returns {Promise<string>} - URL of the generated video
 */
export async function generateAvatarVideo({ text, avatarId, voiceId, noHeygen }) {
  // If noHeygen flag is true, return the fallback video URL
  if (noHeygen) {
    const fallbackUrl = "https://files2.heygen.ai/aws_pacific/avatar_tmp/a40a447500d942dda38e89d182284a4e/c5569272493141bc8e03b2aef0706fc8.mp4?Expires=1742759748&Signature=j0NYbUNIS05QCi6ps-hcUHGxMDNzL1x1Cf0gwFd8FQ-~sLaIasnRFegrM0b4zny1fEtWvm9I4x3wcNLcLzVXd-uqxCMbKkRtoCPuub9yvaJts6Nj5CCLSzT2OMsGeJleadMfufGdeWKP2Ce1hQ6u7ZSSXgxYfjNivHOaUdIP3rY8tD5esBSApVf~ugsFj0-g7kXJ8QdWdB~mGF3dqg4FvBpssGQ6NNCI5WdGII6QjVP5RHA51hGlLNrmb40ObuxLDCEuqfW70MWsfF53PiWD0AW9Gvt1fHreYVCjUF-cFgSPEQQdltwDEMGhnL~Z4MAxV3~rsnn2NHuDmO3WM-CW0Q__&Key-Pair-Id=K38HBHX5LX3X2H";
    console.log('Skipping HeyGen API call (--no-heygen flag provided)');
    console.log(`Using fallback video URL: ${fallbackUrl}`);
    return fallbackUrl;
  }
  
  const apiKey = process.env.HEYGEN_API_KEY;
  
  if (!apiKey) {
    throw new Error('HEYGEN_API_KEY not found in environment variables');
  }
  
  console.log('Starting HeyGen video generation with:');
  console.log(`- Avatar ID: ${avatarId}`);
  console.log(`- Voice ID: ${voiceId}`);
  console.log(`- Text length: ${text.length} characters`);
  
  // Prepare request body with the correct format
  const requestBody = {
    video_inputs: [
      {
        character: {
          type: "avatar",
          avatar_id: avatarId,
          avatar_style: "normal"
        },
        voice: {
          type: "text",
          input_text: text,
          voice_id: voiceId,
          speed: 1.0
        }
      }
    ],
    dimension: {
      width: 1280,
      height: 720
    }
  };
  
  // Step 1: Start the video generation task using the correct endpoint
  try {
    console.log('Sending request to HeyGen API...');
    
    const createResponse = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey
      },
      body: JSON.stringify(requestBody)
    });
    
    // Log response status and headers for debugging
    console.log(`HeyGen API response status: ${createResponse.status}`);
    console.log(`HeyGen API response status text: ${createResponse.statusText}`);
    
    if (!createResponse.ok) {
      const responseText = await createResponse.text();
      console.error('HeyGen API error response:');
      console.error(responseText);
      throw new Error(`HeyGen API error: Status ${createResponse.status} - ${responseText.substring(0, 200)}...`);
    }
    
    // Parse the JSON response
    let responseData;
    try {
      responseData = await createResponse.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      const responseText = await createResponse.text();
      console.error('Raw response:', responseText.substring(0, 500));
      throw new Error(`Failed to parse HeyGen API response: ${jsonError.message}`);
    }
    
    // Expect a "video_id" in the response data
    const { data } = responseData;
    if (!data || !data.video_id) {
      console.error('Unexpected response structure:', JSON.stringify(responseData));
      throw new Error('Failed to get video_id from HeyGen API response');
    }
    
    const videoId = data.video_id;
    console.log(`HeyGen video generation started with video ID: ${videoId}`);
    
    // Step 2: Poll for the video status until it's complete
    return await pollTaskStatus(videoId, apiKey);
  } catch (error) {
    console.error('Error in generateAvatarVideo:', error);
    throw error;
  }
}

/**
 * Poll for the status of a HeyGen video generation task
 * @param {string} videoId - The ID of the video to poll
 * @param {string} apiKey - The HeyGen API key
 * @returns {Promise<string>} - URL of the generated video
 */
async function pollTaskStatus(videoId, apiKey) {
  const maxAttempts = 120; // up to 10 minutes with 5-second intervals
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    try {
      console.log(`Checking video status (attempt ${attempts}/${maxAttempts})...`);
      
      // Use the updated endpoint and query parameter "video_id"
      const statusResponse = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
        method: 'GET',
        headers: {
          'X-Api-Key': apiKey
        }
      });
      
      if (!statusResponse.ok) {
        const responseText = await statusResponse.text();
        console.error(`Error response from status check: ${responseText}`);
        throw new Error(`Error checking video status: ${statusResponse.status} - ${responseText.substring(0, 200)}`);
      }
      
      let responseData;
      try {
        responseData = await statusResponse.json();
      } catch (jsonError) {
        console.error('Failed to parse status JSON response:', jsonError);
        const responseText = await statusResponse.text();
        console.error('Raw status response:', responseText.substring(0, 500));
        throw new Error(`Failed to parse status response: ${jsonError.message}`);
      }
      
      const { data } = responseData;
      if (!data || !data.status) {
        console.error('Unexpected status response structure:', JSON.stringify(responseData));
        throw new Error('Invalid status response from HeyGen API');
      }
      
      const { status, video_url } = data;
      
      if (status === 'completed' && video_url) {
        console.log('HeyGen video generation completed successfully');
        console.log(`Video URL: ${video_url}`);
        return video_url;
      }
      
      if (status === 'failed') {
        console.error('HeyGen video generation failed:', data.error || 'No error details provided');
        throw new Error(`HeyGen video generation failed: ${data.error || 'Unknown reason'}`);
      }
      
      console.log(`HeyGen video generation in progress... (${status})`);
      
      // Wait 5 seconds before the next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error during status check:', error);
      throw error;
    }
  }
  
  throw new Error('Timeout: HeyGen video generation took too long');
}
