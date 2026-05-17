import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export const useAttendanceStore = defineStore('attendance', () => {
  const authStore = useAuthStore()

  const sessions = ref<any[]>([])
  const sessionTypes = ref<any[]>([])
  const currentSession = ref<any | null>(null)
  const currentChecklist = ref<any[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getHeaders = () => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authStore.token}`,
    }
  }

  // 1. Fetch custom Session Types (PM, WS, TG)
  const fetchSessionTypes = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/types', {
        headers: getHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        sessionTypes.value = data.sessionTypes
      }
    } catch (err) {
      console.error('Fetch session types failed:', err)
    }
  }

  // 2. Fetch all historical sessions
  const fetchSessions = async () => {
    loading.value = true
    try {
      const res = await fetch('http://localhost:5000/api/attendance/sessions', {
        headers: getHeaders(),
      })
      const data = await res.json()
      if (res.ok) {
        sessions.value = data.sessions
      }
    } catch (err) {
      console.error('Fetch sessions failed:', err)
    } finally {
      loading.value = false
    }
  }

  // 3. Fetch checklist grid for a specific session
  const fetchChecklist = async (sessionId: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`http://localhost:5000/api/attendance/checklist/${sessionId}`, {
        headers: getHeaders(),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load session checklist')
      }
      currentSession.value = data.session
      currentChecklist.value = data.checklist
    } catch (err: any) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  // 4. Toggle manual checkmark status
  const toggleAttendance = async (
    memberId: string,
    sessionId: string,
    status: 'PRESENT' | 'ABSENT' | 'TRANSFERRED'
  ) => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/toggle', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ memberId, sessionId, status }),
      })
      const data = await res.json()

      if (res.ok) {
        // Update local grid state instantly without full reload
        const index = currentChecklist.value.findIndex((item) => item.memberId === memberId)
        if (index !== -1) {
          currentChecklist.value[index].attendanceStatus = status
          currentChecklist.value[index].attendanceRecordId = data.record.id
          currentChecklist.value[index].method = data.record.method
          currentChecklist.value[index].scannedAt = data.record.scannedAt
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Toggle attendance failed:', err)
      return false
    }
  }

  // 5. Create new session
  const createSession = async (name: string, date: string, sessionTypeId: string) => {
    try {
      const res = await fetch('http://localhost:5000/api/attendance/sessions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, date, sessionTypeId }),
      })
      const data = await res.json()
      if (res.ok) {
        sessions.value.unshift(data.session)
        return data.session
      }
      throw new Error(data.error || 'Failed to create session')
    } catch (err: any) {
      console.error('Create session failed:', err)
      throw err
    }
  }

  // 6. Bulk spreadsheet Excel parser connection
  const importExcel = async (fileBase64: string, sessionTypeId: string) => {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('http://localhost:5000/api/attendance/import', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ fileBase64, sessionTypeId }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse spreadsheet')
      }
      await fetchSessions() // Reload all sessions
      return data
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    sessions,
    sessionTypes,
    currentSession,
    currentChecklist,
    loading,
    error,
    fetchSessionTypes,
    fetchSessions,
    fetchChecklist,
    toggleAttendance,
    createSession,
    importExcel,
  }
})
