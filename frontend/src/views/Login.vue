<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { ShieldCheck, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const validationError = ref<string | null>(null)

const handleLogin = async () => {
  validationError.value = null
  
  if (!username.value.trim() || !password.value.trim()) {
    validationError.value = 'Please fill out all operational input fields.'
    return
  }

  const success = await authStore.login(username.value.trim(), password.value)
  if (success) {
    router.push({ name: 'Dashboard' })
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6 relative overflow-hidden font-sans">
    
    <!-- Immersive Neon Backdrop Glows -->
    <div class="absolute w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[130px] top-[-10%] left-[-15%] pointer-events-none animate-pulse"></div>
    <div class="absolute w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[130px] bottom-[-10%] right-[-15%] pointer-events-none animate-pulse"></div>

    <!-- Login Container -->
    <div class="w-full max-w-md relative z-10 space-y-8">
      
      <!-- Logo and Brand Header -->
      <div class="text-center space-y-3">
        <div class="inline-flex items-center justify-center p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
          <ShieldCheck class="w-8 h-8 text-indigo-400" />
        </div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
          MCGI-AMS Core
        </h1>
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-widest">
          Attendance Monitoring System
        </p>
      </div>

      <!-- Glassmorphic Login Card -->
      <div class="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <h2 class="text-xl font-bold text-slate-200 mb-6">Sign in to console</h2>

        <!-- Action Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">
          
          <!-- Username Input -->
          <div class="space-y-2">
            <label for="username" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <User class="w-4 h-4" />
              </span>
              <input 
                id="username"
                v-model="username" 
                type="text" 
                placeholder="operator.username"
                class="w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              />
            </div>
          </div>

          <!-- Password Input -->
          <div class="space-y-2">
            <label for="password" class="block text-xs font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div class="relative group">
              <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                <Lock class="w-4 h-4" />
              </span>
              <input 
                id="password"
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                placeholder="••••••••••••"
                class="w-full pl-10 pr-10 py-3 bg-slate-950/60 border border-white/10 rounded-xl text-sm placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
              />
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div v-if="authStore.error || validationError" class="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex gap-3 items-start animate-shake">
            <AlertCircle class="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <p class="text-xs text-rose-300 leading-normal">{{ authStore.error || validationError }}</p>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="authStore.loading"
            class="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:from-indigo-800 disabled:to-indigo-800 text-sm font-semibold rounded-xl transition-all shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.45)] active:scale-[0.98]"
          >
            <span v-if="authStore.loading" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Authenticating...
            </span>
            <span v-else>Access Console</span>
          </button>

        </form>

        <!-- Access Guidelines Notice -->
        <div class="mt-6 pt-5 border-t border-white/5 text-center text-[10px] text-slate-500 leading-relaxed">
          This monitoring panel is restricted to authorized officers. Logins are encrypted and audited recursively. Default credentials are seeded as <code class="text-indigo-400 font-mono">superadmin</code> / <code class="text-indigo-400 font-mono">Password123!</code>.
        </div>

      </div>

    </div>

  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}
</style>
