/**
 * Service handling secure communication with the Python FastAPI face verification microservice.
 * Enforces strict HTTP status code handling and privacy guarantees.
 */

const BiometricProfile = require('../models/BiometricProfile');

class FaceAiService {
  constructor() {
    this.aiUrl = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');
    this.token = process.env.AI_SERVICE_TOKEN || 'secure_internal_ai_token_key_789';
    this.timeoutMs = parseInt(process.env.AI_SERVICE_TIMEOUT_MS || '18000', 10);
  }

  /**
   * Forwards image buffer to Python FastAPI /v1/face/verify endpoint.
   * Checks for dynamically enrolled 512-D vector in MongoDB first for 1:1 matching.
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

      // Check for dynamically enrolled biometric vector in MongoDB
      try {
        const profile = await BiometricProfile.findOne({ user_email: studentEmail.toLowerCase().trim() });
        if (profile && Array.isArray(profile.embedding) && profile.embedding.length > 0) {
          formData.append('enrolled_vector', JSON.stringify(profile.embedding));
        }
      } catch (dbErr) {
        // If DB query fails, proceed without enrolled_vector to let AI service check legacy known encodings
      }
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

  /**
   * Forwards image buffer to Python FastAPI /v1/face/enroll endpoint.
   * Extracts and returns the 512-D normalized face vector for persistence in MongoDB.
   *
   * @param {Buffer} imageBuffer - Raw image buffer
   * @param {string} studentEmail - Student email address
   * @returns {Promise<Object>} Enrollment result with embedding
   */
  async enrollFace(imageBuffer, studentEmail) {
    if (!imageBuffer || imageBuffer.length === 0) {
      return {
        success: false,
        status: 400,
        message: 'Empty image buffer provided'
      };
    }

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'enroll.jpg');
    if (studentEmail) {
      formData.append('student_email', studentEmail);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.aiUrl}/v1/face/enroll`, {
        method: 'POST',
        headers: {
          'X-Internal-Token': this.token
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timer);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          message: data.detail || 'Face enrollment failed'
        };
      }

      return {
        success: true,
        status: 200,
        embedding: data.embedding,
        message: data.message || 'Face embedding generated successfully'
      };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return {
          success: false,
          status: 504,
          message: 'AI service enrollment request timeout'
        };
      }
      return {
        success: false,
        status: 503,
        message: 'AI face recognition service is currently unavailable'
      };
    }
  }
}

module.exports = new FaceAiService();
