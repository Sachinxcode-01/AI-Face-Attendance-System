/**
 * Service handling secure communication with the Python FastAPI face verification microservice.
 * Enforces strict HTTP status code handling and privacy guarantees.
 */

class FaceAiService {
  constructor() {
    this.aiUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
    this.token = process.env.AI_SERVICE_TOKEN || 'secure_internal_ai_token_key_789';
    this.timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '18000', 10);
  }

  /**
   * Forwards image buffer to Python FastAPI /v1/face/verify endpoint.
   *
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {string} studentEmail - Expected student email address from verified JWT
   * @returns {Promise<Object>} Verification result payload
   */
  async verifyFace(imageBuffer, studentEmail) {
    if (!imageBuffer || imageBuffer.length === 0) {
      return {
        success: false,
        matched: false,
        confidence: 0,
        status: 400,
        message: 'Empty image buffer provided'
      };
    }

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'scan.jpg');
    if (studentEmail) {
      formData.append('student_email', studentEmail);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.aiUrl}/v1/face/verify`, {
        method: 'POST',
        headers: {
          'X-Internal-Token': this.token
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timer);

      if (response.status === 401) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 500,
          message: 'AI Service configuration error'
        };
      }

      if (response.status === 413) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 413,
          message: 'Uploaded image exceeds maximum size of 5MB'
        };
      }

      if (response.status === 415) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 415,
          message: 'Unsupported image file format'
        };
      }

      if (response.status === 422) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 422,
          message: 'Face verification failed'
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 429,
          message: 'Face verification rate limit exceeded'
        };
      }

      if (response.status === 504) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 504,
          message: 'AI face recognition request timed out'
        };
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: response.status,
          message: data.detail || 'Face verification failed'
        };
      }

      return {
        success: data.success ?? true,
        matched: data.matched ?? false,
        confidence: data.confidence ?? 0.0,
        status: 200,
        message: data.message || 'Face verification complete'
      };

    } catch (error) {
      clearTimeout(timer);

      if (error.name === 'AbortError') {
        return {
          success: false,
          matched: false,
          confidence: 0,
          status: 504,
          message: 'AI service request timeout'
        };
      }

      return {
        success: false,
        matched: false,
        confidence: 0,
        status: 503,
        message: 'AI face recognition service is currently unavailable'
      };
    }
  }
}

module.exports = new FaceAiService();
