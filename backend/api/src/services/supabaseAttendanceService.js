const { supabase } = require('../config/supabase');

class SupabaseAttendanceService {
  /**
   * Record attendance in Supabase
   */
  async recordAttendance({ studentId, sessionId, status = 'present', confidenceScore, method = 'face_recognition', deviceId }) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .insert({
        student_id: studentId,
        session_id: sessionId,
        status,
        confidence_score: confidenceScore,
        verification_method: method,
        device_id: deviceId,
        marked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting attendance log in Supabase:', error);
      throw error;
    }
    return data;
  }

  /**
   * Search matching student face via pgvector match_face RPC
   */
  async matchFace(embedding, matchThreshold = 0.6, matchCount = 1) {
    const { data, error } = await supabase.rpc('match_face', {
      query_embedding: embedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    });

    if (error) {
      console.error('Error calling match_face in Supabase:', error);
      throw error;
    }
    return data;
  }

  /**
   * Get student's recent attendance logs
   */
  async getStudentAttendance(studentId, limit = 50) {
    const { data, error } = await supabase
      .from('attendance_logs')
      .select(`
        id,
        status,
        verification_method,
        confidence_score,
        marked_at,
        sessions (
          subject_code,
          subject_name,
          room_number
        )
      `)
      .eq('student_id', studentId)
      .order('marked_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching attendance logs from Supabase:', error);
      throw error;
    }
    return data;
  }
}

module.exports = new SupabaseAttendanceService();

