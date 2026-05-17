<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useAttendanceStore } from '../stores/attendance'
import { 
  LogOut, Users, Calendar, Award, RefreshCw, Plus, 
  Upload, FileText, CheckCircle, XCircle, AlertTriangle, 
  Search, ShieldAlert, Sparkles, X, ChevronRight 
} from 'lucide-vue-next'

const authStore = useAuthStore()
const attendanceStore = useAttendanceStore()
const router = useRouter()

// Local UI states
const selectedSessionId = ref('')
const searchFilter = ref('')
const showCreateModal = ref(false)
const showImportDrawer = ref(false)
const dragOver = ref(false)
const importSuccessData = ref<any | null>(null)

// Forms
const newSessionName = ref('')
const newSessionDate = ref(new Date().toISOString().substring(0, 10))
const newSessionTypeId = ref('')
const importSessionTypeId = ref('')
const importedFileBase64 = ref<string | null>(null)
const importedFileName = ref<string | null>(null)

// 1. Diagnostics & Lifecycles
onMounted(async () => {
  await attendanceStore.fetchSessionTypes()
  await attendanceStore.fetchSessions()
  
  if (attendanceStore.sessions.length > 0) {
    selectedSessionId.value = attendanceStore.sessions[0].id
    await loadChecklist()
  }
})

const loadChecklist = async () => {
  if (selectedSessionId.value) {
    await attendanceStore.fetchChecklist(selectedSessionId.value)
  }
}

// 2. Computed Metrics for stats panels
const filteredChecklist = computed(() => {
  return attendanceStore.currentChecklist.filter((item) => {
    const query = searchFilter.value.toLowerCase().trim()
    return (
      item.alias.toLowerCase().includes(query) ||
      item.publicId.toLowerCase().includes(query) ||
      item.groupName.toLowerCase().includes(query)
    )
  })
})

const totalMembers = computed(() => attendanceStore.currentChecklist.length)
const presentCount = computed(() => {
  return attendanceStore.currentChecklist.filter((c) => c.attendanceStatus === 'PRESENT').length
})
const absentCount = computed(() => {
  return attendanceStore.currentChecklist.filter((c) => c.attendanceStatus === 'ABSENT').length
})
const transferredCount = computed(() => {
  return attendanceStore.currentChecklist.filter((c) => c.attendanceStatus === 'TRANSFERRED').length
})
const attendanceRate = computed(() => {
  if (totalMembers.value === 0) return 0
  return Math.round((presentCount.value / totalMembers.value) * 100)
})

// 3. Toggles
const toggleStatus = async (memberId: string, status: 'PRESENT' | 'ABSENT' | 'TRANSFERRED') => {
  if (selectedSessionId.value) {
    await attendanceStore.toggleAttendance(memberId, selectedSessionId.value, status)
  }
}

// 4. Session Creators
const handleCreateSession = async () => {
  if (!newSessionName.value || !newSessionTypeId.value) return

  try {
    const session = await attendanceStore.createSession(
      newSessionName.value,
      newSessionDate.value,
      newSessionTypeId.value
    )
    showCreateModal.value = false
    selectedSessionId.value = session.id
    await loadChecklist()
    // Reset Form
    newSessionName.value = ''
    newSessionTypeId.value = ''
  } catch (err) {
    alert('Failed to create session.')
  }
}

// 5. Excel Import Handlers
const handleFileDrop = (e: DragEvent) => {
  dragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const handleFileSelect = (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (files && files.length > 0) {
    processFile(files[0])
  }
}

const processFile = (file: File) => {
  importedFileName.value = file.name
  const reader = new FileReader()
  reader.readAsDataURL(file)
  reader.onload = () => {
    importedFileBase64.value = reader.result as string
  }
}

const triggerExcelImport = async () => {
  if (!importedFileBase64.value || !importSessionTypeId.value) return

  try {
    const data = await attendanceStore.importExcel(
      importedFileBase64.value,
      importSessionTypeId.value
    )
    importSuccessData.value = data
    if (attendanceStore.sessions.length > 0) {
      selectedSessionId.value = attendanceStore.sessions[0].id
      await loadChecklist()
    }
  } catch (err: any) {
    alert(err.message || 'Failed to process spreadsheet.')
  }
}

const closeImportDrawer = () => {
  showImportDrawer.value = false
  importedFileBase64.value = null
  importedFileName.value = null
  importSuccessData.value = null
  importSessionTypeId.value = ''
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
    
    <!-- Dynamic backdrop vector glows -->
    <div class="absolute w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[130px] top-[-10%] right-[-10%] pointer-events-none"></div>
    <div class="absolute w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[130px] bottom-[-10%] left-[-10%] pointer-events-none"></div>

    <!-- MAIN SYSTEM HEADER -->
    <header class="border-b border-white/5 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <!-- Logo and App Navigation -->
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Sparkles class="w-5 h-5 text-indigo-400" />
            </span>
            <span class="font-bold tracking-wider text-sm uppercase">MCGI-AMS</span>
          </div>

          <nav class="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-400">
            <router-link to="/" class="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Attendance Board</router-link>
            <router-link to="/members" class="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all">Members Directory</router-link>
          </nav>
        </div>

        <!-- Session Operator Info -->
        <div class="flex items-center gap-4">
          <div class="hidden sm:flex flex-col items-end">
            <span class="text-xs font-semibold text-slate-200">{{ authStore.user?.username }}</span>
            <span class="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{{ authStore.user?.role }}</span>
          </div>

          <button @click="handleLogout" class="p-2.5 rounded-xl bg-slate-900 border border-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 hover:border-rose-500/25 transition-all">
            <LogOut class="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>

    <!-- CONTENT WRAPPER -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 relative z-10">
      
      <!-- PAGE ANNOUNCEMENT AND DYNAMIC CONTROLS -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Grace Cell Checklist Grid
          </h2>
          <p class="text-xs font-medium text-slate-500 mt-1">
            Displaying interactive matrix checklist records connected to local Laragon MySQL.
          </p>
        </div>

        <!-- Global Action Panel -->
        <div class="flex flex-wrap items-center gap-3">
          
          <!-- Dropdown list of sessions -->
          <div class="relative min-w-[220px]">
            <select 
              v-model="selectedSessionId" 
              @change="loadChecklist"
              class="w-full pl-3 pr-8 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500/50 appearance-none font-mono"
            >
              <option value="" disabled>-- Choose Session --</option>
              <option v-for="s in attendanceStore.sessions" :key="s.id" :value="s.id">
                {{ s.name }}
              </option>
            </select>
            <span class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
              <Calendar class="w-3.5 h-3.5" />
            </span>
          </div>

          <button @click="showCreateModal = true" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] active:scale-[0.98]">
            <Plus class="w-4 h-4" />
            New Session
          </button>

          <button @click="showImportDrawer = true" class="px-4 py-2.5 bg-slate-900 border border-white/10 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all hover:bg-slate-800">
            <Upload class="w-4 h-4 text-indigo-400 animate-bounce" />
            Import Excel
          </button>

        </div>
      </div>

      <!-- ANALYTICAL STATS MATRIX -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- Attendance rate gauge -->
        <div class="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div class="text-2xl font-black text-emerald-400 font-mono">{{ attendanceRate }}%</div>
          </div>
          <span class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Award class="w-5 h-5" />
          </span>
        </div>

        <!-- Total Present count -->
        <div class="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Present</span>
            <div class="text-2xl font-black text-indigo-400 font-mono">{{ presentCount }} / {{ totalMembers }}</div>
          </div>
          <span class="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Users class="w-5 h-5" />
          </span>
        </div>

        <!-- Total Absent count -->
        <div class="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Absent</span>
            <div class="text-2xl font-black text-rose-400 font-mono">{{ absentCount }}</div>
          </div>
          <span class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            <XCircle class="w-5 h-5" />
          </span>
        </div>

        <!-- Total Transferred count -->
        <div class="bg-slate-900/40 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
          <div class="space-y-1">
            <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Transferred</span>
            <div class="text-2xl font-black text-amber-400 font-mono">{{ transferredCount }}</div>
          </div>
          <span class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <AlertTriangle class="w-5 h-5" />
          </span>
        </div>

      </div>

      <!-- MAIN ATTENDANCE MATRIX BOARD CARD -->
      <div class="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
        
        <!-- Table Control Options Header -->
        <div class="p-5 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 class="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span>Checklist Registry Matrix</span>
            <span class="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-[10px] text-indigo-400 font-mono">
              {{ attendanceStore.currentSession?.name || 'Loading...' }}
            </span>
          </h3>

          <!-- Search Filter input -->
          <div class="relative w-full sm:w-64">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search class="w-4 h-4" />
            </span>
            <input 
              v-model="searchFilter"
              type="text" 
              placeholder="Search member, group..."
              class="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <!-- Table checklist container -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/40 border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-4 px-6">Public ID</th>
                <th class="py-4 px-6">Alias / Name</th>
                <th class="py-4 px-6">Grace Cell Group</th>
                <th class="py-4 px-6">Status</th>
                <th class="py-4 px-6 text-center">Checklist Toggle</th>
              </tr>
            </thead>
            
            <!-- Checklist Body -->
            <tbody v-if="filteredChecklist.length > 0">
              <tr 
                v-for="m in filteredChecklist" 
                :key="m.memberId"
                class="border-b border-white/5 hover:bg-white/[0.01] transition-all text-xs text-slate-300"
              >
                <!-- Public ID -->
                <td class="py-4 px-6 font-mono font-bold text-indigo-400">{{ m.publicId }}</td>
                
                <!-- Member details -->
                <td class="py-4 px-6">
                  <div class="font-bold text-slate-200">{{ m.alias }}</div>
                  <div class="text-[10px] text-slate-500">{{ m.firstName }} {{ m.lastName }}</div>
                </td>

                <!-- Cell group -->
                <td class="py-4 px-6 font-semibold">{{ m.groupName }}</td>

                <!-- Church Status -->
                <td class="py-4 px-6">
                  <span 
                    class="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                    :class="{
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': m.status === 'ACTIVE',
                      'bg-slate-800 text-slate-400 border-slate-700': m.status === 'INACTIVE',
                      'bg-rose-500/10 text-rose-400 border-rose-500/20': m.status === 'SUSPENDED'
                    }"
                  >
                    {{ m.status }}
                  </span>
                </td>

                <!-- Three pill matrix controls -->
                <td class="py-4 px-6">
                  <div class="flex items-center justify-center gap-1.5">
                    
                    <!-- PRESENT PILL -->
                    <button 
                      @click="toggleStatus(m.memberId, 'PRESENT')"
                      class="px-3 py-1.5 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95"
                      :class="m.attendanceStatus === 'PRESENT' 
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                        : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'"
                    >
                      <CheckCircle class="w-3.5 h-3.5" />
                      Present
                    </button>

                    <!-- TRANSFERRED PILL -->
                    <button 
                      @click="toggleStatus(m.memberId, 'TRANSFERRED')"
                      class="px-3 py-1.5 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95"
                      :class="m.attendanceStatus === 'TRANSFERRED' 
                        ? 'bg-amber-500/15 border-amber-500/35 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]' 
                        : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'"
                    >
                      <AlertTriangle class="w-3.5 h-3.5" />
                      Transferred
                    </button>

                    <!-- ABSENT PILL -->
                    <button 
                      @click="toggleStatus(m.memberId, 'ABSENT')"
                      class="px-3 py-1.5 rounded-lg border text-[10px] font-bold inline-flex items-center gap-1 transition-all active:scale-95"
                      :class="m.attendanceStatus === 'ABSENT' 
                        ? 'bg-rose-500/15 border-rose-500/35 text-rose-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]' 
                        : 'bg-slate-950/40 border-white/5 text-slate-500 hover:text-slate-300 hover:border-white/10'"
                    >
                      <XCircle class="w-3.5 h-3.5" />
                      Absent
                    </button>

                  </div>
                </td>

              </tr>
            </tbody>

            <!-- Table empty state -->
            <tbody v-else>
              <tr>
                <td colspan="5" class="py-12 text-center text-slate-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert class="w-8 h-8 text-slate-600 animate-pulse" />
                    <span class="text-xs font-semibold">No records match the active search parameters.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </main>

    <!-- CREATE NEW SESSION MODAL -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md">
      
      <!-- Modal Box -->
      <div class="bg-slate-900 border border-white/10 w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-6 relative animate-zoom">
        <button @click="showCreateModal = false" class="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X class="w-5 h-5" />
        </button>

        <div class="space-y-1.5">
          <h3 class="text-lg font-bold text-white">Create Attendance Session</h3>
          <p class="text-xs text-slate-500">Initialize a new check-in board on a specific service date.</p>
        </div>

        <form @submit.prevent="handleCreateSession" class="space-y-4">
          
          <!-- Session Name -->
          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Name</label>
            <input 
              v-model="newSessionName"
              type="text"
              placeholder="e.g. WS - April 11, 2026"
              class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50"
              required
            />
          </div>

          <!-- Date Selector -->
          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Date</label>
            <input 
              v-model="newSessionDate"
              type="date"
              class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50"
              required
            />
          </div>

          <!-- Session Type Dropdown -->
          <div class="space-y-1.5">
            <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Type</label>
            <select 
              v-model="newSessionTypeId"
              class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono"
              required
            >
              <option value="" disabled>-- Select Type --</option>
              <option v-for="t in attendanceStore.sessionTypes" :key="t.id" :value="t.id">
                {{ t.name }} ({{ t.shortName }})
              </option>
            </select>
          </div>

          <button type="submit" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)]">
            Create and Open Board
          </button>

        </form>
      </div>

    </div>

    <!-- SPREADSHEET IMPORTER DRAWER (RIGHT OVERLAY PANEL) -->
    <div 
      class="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      :class="showImportDrawer ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
      @click="closeImportDrawer"
    >
      <div 
        class="absolute inset-y-0 right-0 w-full max-w-md bg-slate-900 border-l border-white/10 p-6 shadow-2xl flex flex-col justify-between transition-transform duration-300 transform"
        :class="showImportDrawer ? 'translate-x-0' : 'translate-x-full'"
        @click.stop
      >
        <div class="space-y-6 flex-1 overflow-y-auto">
          
          <!-- Drawer Header -->
          <div class="flex items-center justify-between pb-4 border-b border-white/5">
            <div class="space-y-1">
              <h3 class="text-lg font-bold text-white flex items-center gap-1.5">
                <Upload class="w-5 h-5 text-indigo-400" />
                Spreadsheet Importer
              </h3>
              <p class="text-xs text-slate-500">Auto-parse and upload checklists in a single click.</p>
            </div>
            <button @click="closeImportDrawer" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- SUCCESS STATE -->
          <div v-if="importSuccessData" class="space-y-6 py-4 animate-zoom">
            <div class="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <CheckCircle class="w-12 h-12 text-emerald-400 animate-bounce" />
              <div class="space-y-1">
                <h4 class="font-bold text-slate-200">Import Succeeded!</h4>
                <p class="text-[10px] text-slate-500 leading-normal">{{ importSuccessData.message }}</p>
              </div>
            </div>

            <!-- Stats breakdown -->
            <div class="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3">
              <h5 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Transaction Audit log</h5>
              
              <div class="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span class="text-slate-500">Columns (Sessions) Resolved:</span>
                <span class="font-bold text-indigo-400 font-mono">{{ importSuccessData.sessionsProcessed }}</span>
              </div>
              <div class="flex items-center justify-between text-xs py-1 border-b border-white/5">
                <span class="text-slate-500">New Sessions Created:</span>
                <span class="font-bold text-emerald-400 font-mono">{{ importSuccessData.newSessionsCreated }}</span>
              </div>
              <div class="flex items-center justify-between text-xs py-1">
                <span class="text-slate-500">Attendance Records Linked:</span>
                <span class="font-bold text-slate-200 font-mono">{{ importSuccessData.attendanceRecordsUpdated }}</span>
              </div>
            </div>

            <button @click="closeImportDrawer" class="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-white/10 text-xs font-bold rounded-xl transition-all">
              Return to Matrix Board
            </button>
          </div>

          <!-- IMPORT SETUP STATE -->
          <div v-else class="space-y-5 py-4">
            
            <!-- Default Session Type Selection -->
            <div class="space-y-1.5">
              <label class="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Default Session Type Mapping</label>
              <select 
                v-model="importSessionTypeId"
                class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50 font-mono"
                required
              >
                <option value="" disabled>-- Select Type --</option>
                <option v-for="t in attendanceStore.sessionTypes" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.shortName }})
                </option>
              </select>
              <p class="text-[9px] text-slate-500">Prisma automatically connects column dates (e.g. "WS - April 4") under this session type.</p>
            </div>

            <!-- Drag & Drop Zone -->
            <div 
              @dragover.prevent="dragOver = true"
              @dragleave="dragOver = false"
              @drop.prevent="handleFileDrop"
              class="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 transition-all"
              :class="dragOver 
                ? 'border-indigo-500 bg-indigo-500/5 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                : 'border-white/10 bg-slate-950/30 hover:border-white/20'"
            >
              <div class="p-3.5 bg-slate-950 border border-white/5 rounded-2xl">
                <FileText class="w-8 h-8 text-indigo-400" />
              </div>

              <div class="space-y-1">
                <p class="text-xs font-bold text-slate-200">
                  Drag & Drop Excel Sheet Here
                </p>
                <p class="text-[10px] text-slate-500">
                  Supports standard grid columns e.g. <code class="text-indigo-400 font-mono">Public ID</code> / <code class="text-indigo-400 font-mono">Alias</code>
                </p>
              </div>

              <div class="w-full flex items-center justify-center gap-2">
                <span class="h-[1px] bg-white/5 flex-1"></span>
                <span class="text-[9px] font-bold text-slate-600 uppercase tracking-widest">or</span>
                <span class="h-[1px] bg-white/5 flex-1"></span>
              </div>

              <label class="px-4 py-2 bg-slate-950 border border-white/10 hover:bg-slate-900 text-[10px] font-bold rounded-xl cursor-pointer transition-all">
                Browse Files
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .ods" 
                  class="hidden" 
                  @change="handleFileSelect"
                />
              </label>
            </div>

            <!-- Display Selected File Details -->
            <div v-if="importedFileName" class="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center gap-3 animate-zoom">
              <FileText class="w-5 h-5 text-indigo-400 shrink-0" />
              <div class="overflow-hidden flex-1">
                <div class="text-xs font-bold truncate text-slate-200">{{ importedFileName }}</div>
                <div class="text-[9px] text-slate-500">Excel spreadsheet staged successfully</div>
              </div>
            </div>

          </div>

        </div>

        <!-- Submit Panel (Sticky bottom) -->
        <div v-if="!importSuccessData" class="pt-4 border-t border-white/5 bg-slate-900">
          <button 
            @click="triggerExcelImport"
            :disabled="!importedFileBase64 || !importSessionTypeId || attendanceStore.loading"
            class="w-full py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:from-indigo-900 disabled:to-indigo-900 text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.2)] active:scale-[0.98]"
          >
            <span v-if="attendanceStore.loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Matrix...
            </span>
            <span v-else class="flex items-center justify-center gap-1.5">
              Begin Parsing Upload
              <ChevronRight class="w-4 h-4" />
            </span>
          </button>
        </div>

      </div>
    </div>

  </div>
</template>

<style scoped>
@keyframes zoom {
  0% { transform: scale(0.96); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
.animate-zoom {
  animation: zoom 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
