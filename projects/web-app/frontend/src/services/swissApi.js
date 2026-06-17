/**
 * Swiss EdTech API Service
 * Connects to Swiss backend for zero-knowledge educational features
 */

const SWISS_API_BASE = 'http://localhost:8001/api/swiss';

class SwissApiService {
  constructor() {
    this.baseURL = SWISS_API_BASE;
  }

  /**
   * Register a Swiss student with zero-knowledge encryption
   */
  async registerStudent(studentData) {
    try {
      const response = await fetch(`${this.baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentData.studentId,
          canton: studentData.canton,
          grade: studentData.grade,
          age: studentData.age
        })
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Swiss registration error:', error);
      throw error;
    }
  }

  /**
   * Get math help with Swiss curriculum alignment
   */
  async getMathHelp(studentId, problem, grade) {
    try {
      const response = await fetch(`${this.baseURL}/math-help`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          problem: problem,
          grade: grade
        })
      });

      if (!response.ok) {
        throw new Error(`Math help failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Swiss math help error:', error);
      throw error;
    }
  }

  /**
   * Get Gymnasium preparation materials
   */
  async getGymiPrep(studentId, subject) {
    try {
      const response = await fetch(`${this.baseURL}/gymi-prep`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentId,
          subject: subject
        })
      });

      if (!response.ok) {
        throw new Error(`Gymi prep failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Swiss gymi prep error:', error);
      throw error;
    }
  }

  /**
   * Health check for Swiss backend
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseURL}/health`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Swiss health check error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const swissApi = new SwissApiService();