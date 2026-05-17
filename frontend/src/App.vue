<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Activity, ShieldCheck, Cpu, Database, Server, RefreshCw } from 'lucide-vue-next'

// Connection diagnostics states
const apiStatus = ref('connecting')
const aiStatus = ref('connecting')
const apiDetails = ref<any>(null)
const aiDetails = ref<any>(null)
const isChecking = ref(false)

const checkConnections = async () => {
  isChecking.ref = true
  apiStatus.value = 'connecting'
  aiStatus.value = 'connecting'
  
  // 1. Express API Health Check
  try {
    const apiRes = await fetch('http://localhost:5000/api/health')
    if (apiRes.ok) {
      apiStatus.value = 'online'
      apiDetails.value = await apiRes.json()
    } else {
      apiStatus.value = 'error'
    }
  } catch (e) {
    apiStatus.value = 'offline'
  }

  // 2. Python FastAPI Health Check
  try {
    const aiRes = await fetch('http://localhost:8000/')
    if (aiRes.ok) {
      aiStatus.value = 'online'
      aiDetails.value = await aiRes.json()
    } else {
      aiStatus.value = 'error'
    }
  } catch (e) {
    aiStatus.value = 'offline'
  }
  
  isChecking.ref = false
}

onMounted(() => {
  checkConnections()
})
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
    <!-- Premium Backdrop Grid Glows -->
    <div class="absolute w-[400px] h-[400px] rounded-full bg-brand-indigo/10 blur-[120px] top-[-10%] left-[-10%] pointer-events-none"></div>
    <div class="absolute w-[400px] h-[400px] rounded-full bg-brand-teal/5 blur-[120px] bottom-[-10%] right-[-10%] pointer-events-none"></div>

    <!-- Main Container -->
    <div class="w-full max-w-4xl glass-card p-10 flex flex-col md:flex-row gap-8 items-center border border-white/10 relative z-10">
      
      <!-- System Identity Section -->
      <div class="flex-1 space-y-6">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-indigo/15 text-indigo-300 border border-brand-indigo/35 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck class="w-4 h-4 text-brand-indigo animate-pulse" />
          System Initialization Active
        </div>
        
        <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          Church Membership & Attendance Core
        </h1>
        
        <p class="text-slate-400 text-lg leading-relaxed">
          Welcome to the high-performance local church dashboard. We have initialized Phase 1: monorepo folders, dependency configurations, and server entrypoints.
        </p>

        <div class="pt-4 flex flex-wrap gap-4">
          <button @click="checkConnections" :disabled="isChecking" class="btn-primary inline-flex items-center gap-2">
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isChecking }" />
            Run System Diagnostics
          </button>
        </div>
      </div>

      <!-- Network Connections Status Panel -->
      <div class="w-full md:w-[320px] bg-slate-950/40 border border-white/5 rounded-2xl p-6 space-y-6">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
          <span>Service Connection Log</span>
          <Activity class="w-3.5 h-3.5 text-brand-teal" />
        </h3>

        <!-- Express Database Core -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Server class="w-4 h-4 text-indigo-400" />
              <span class="font-medium text-sm">Node Express API</span>
            </div>
            <span v-if="apiStatus === 'online'" class="badge-active text-[10px]">Active</span>
            <span v-else-if="apiStatus === 'connecting'" class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-400 animate-pulse">Ping...</span>
            <span v-else class="badge-inactive text-[10px]">Offline</span>
          </div>
          <div class="text-[11px] text-slate-500 bg-slate-900/50 p-2 rounded-lg font-mono">
            Host: <span class="text-slate-300">localhost:5000</span><br>
            Database: <span class="text-slate-300">SQLite Active</span>
          </div>
        </div>

        <!-- Python AI Biometrics Core -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <Cpu class="w-4 h-4 text-emerald-400" />
              <span class="font-medium text-sm">Python FastAPI Core</span>
            </div>
            <span v-if="aiStatus === 'online'" class="badge-active text-[10px]">Active</span>
            <span v-else-if="aiStatus === 'connecting'" class="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-slate-800 text-slate-400 animate-pulse">Ping...</span>
            <span v-else class="badge-inactive text-[10px]">Offline</span>
          </div>
          <div class="text-[11px] text-slate-500 bg-slate-900/50 p-2 rounded-lg font-mono">
            Host: <span class="text-slate-300">localhost:8000</span><br>
            Biometrics: <span class="text-slate-300">FastAPI / OpenCV</span>
          </div>
        </div>

      </div>

    </div>

    <!-- Quick Development Notice -->
    <div class="mt-8 text-center text-xs text-slate-500 space-y-1 relative z-10 max-w-md">
      <p class="font-semibold text-slate-400">🔥 Monorepo Architecture initialized successfully.</p>
      <p>Node.js modules and Python FastAPI templates are mapped to local directories. Use the bootstrap utility script to download packages locally.</p>
    </div>
  </div>
</template>
