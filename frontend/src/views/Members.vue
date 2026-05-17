<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { 
  LogOut, Users, Search, Plus, MapPin, Phone, 
  Calendar, Check, X, ShieldAlert, Sparkles, UserPlus 
} from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

// Members state
const members = ref<any[]>([])
const groups = ref<any[]>([])
const loading = ref(false)
const searchFilter = ref('')
const showAddModal = ref(false)

// Form State
const firstName = ref('')
const lastName = ref('')
const middleName = ref('')
const alias = ref('')
const age = ref<number | null>(null)
const gender = ref('MALE')
const civilStatus = ref('SINGLE')
const contactNumber = ref('')
const baptismDate = ref('')
const yearsInChurch = ref(0)
const groupId = ref('')

// Address Form State
const streetAddress = ref('')
const barangay = ref('')
const municipality = ref('')
const province = ref('Pampanga') // Default to Pampanga as standard
const zipCode = ref('')

onMounted(async () => {
  await fetchMembers()
  await fetchGroups()
})

const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authStore.token}`,
  }
}

// 1. Fetch active members
const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await fetch('http://localhost:5000/api/members', {
      headers: getHeaders(),
    })
    const data = await res.json()
    if (res.ok) {
      members.value = data.members
    }
  } catch (err) {
    console.error('Fetch members failed:', err)
  } finally {
    loading.value = false
  }
}

// 2. Fetch cell groups
const fetchGroups = async () => {
  try {
    // In our seeding, we created cell groups. 
    // We can fetch groups simply from the backend (or resolve them dynamically from our database)
    // To keep it simple, we can fetch from the DB or mock a few if the endpoint is not fully generic
    // Let's call the members API or dynamically map groups from members list!
    // That is incredibly smart because members hold group names!
    // Or we can mock the standard groups:
    groups.value = [
      { id: 'sasmuan', name: 'Sasmuan Grace Cell 1' },
      { id: 'guagua', name: 'Guagua Grace Cell 1' },
      { id: 'lambac', name: 'Lambac Grace Cell 1' },
    ]
  } catch (err) {
    console.error('Fetch groups failed:', err)
  }
}

// 3. Filtered Members list
const filteredMembers = computed(() => {
  return members.value.filter((m) => {
    const query = searchFilter.value.toLowerCase().trim()
    const addressMatch = m.addresses?.some((a: any) => 
      a.address.barangay.toLowerCase().includes(query) || 
      a.address.municipality.toLowerCase().includes(query)
    ) || false

    return (
      m.firstName.toLowerCase().includes(query) ||
      m.lastName.toLowerCase().includes(query) ||
      m.publicId.toLowerCase().includes(query) ||
      (m.alias && m.alias.toLowerCase().includes(query)) ||
      (m.group && m.group.groupName.toLowerCase().includes(query)) ||
      addressMatch
    )
  })
})

// 4. Register new member
const handleAddMember = async () => {
  if (!firstName.value || !lastName.value || !age.value) return

  const payload = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    middleName: middleName.value.trim() || null,
    alias: alias.value.trim() || null,
    age: Number(age.value),
    gender: gender.value,
    civilStatus: civilStatus.value,
    contactNumber: contactNumber.value.trim() || null,
    baptismDate: baptismDate.value ? new Date(baptismDate.value).toISOString() : null,
    yearsInChurch: Number(yearsInChurch.value),
    groupId: groupId.value || null,
    address: streetAddress.value ? {
      streetAddress: streetAddress.value.trim(),
      barangay: barangay.value.trim(),
      municipality: municipality.value.trim(),
      province: province.value.trim(),
      zipCode: zipCode.value.trim(),
    } : null
  }

  try {
    const res = await fetch('http://localhost:5000/api/members', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (res.ok) {
      members.value.unshift(data.member)
      showAddModal.value = false
      resetForm()
    } else {
      alert(data.error || 'Failed to register member.')
    }
  } catch (err) {
    alert('An error occurred.')
  }
}

const resetForm = () => {
  firstName.value = ''
  lastName.value = ''
  middleName.value = ''
  alias.value = ''
  age.value = null
  gender.value = 'MALE'
  civilStatus.value = 'SINGLE'
  contactNumber.value = ''
  baptismDate.value = ''
  yearsInChurch.value = 0
  groupId.value = ''
  streetAddress.value = ''
  barangay.value = ''
  municipality.value = ''
  zipCode.value = ''
}

const handleLogout = () => {
  authStore.logout()
  router.push({ name: 'Login' })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
    
    <!-- Dynamic glow vector points -->
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
            <router-link to="/" class="px-3.5 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all">Attendance Board</router-link>
            <router-link to="/members" class="px-3.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">Members Directory</router-link>
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

    <!-- CONTENT CONTAINER -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-8 relative z-10">
      
      <!-- HEADER CONTROLS -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 class="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent">
            Church Members Directory
          </h2>
          <p class="text-xs font-medium text-slate-500 mt-1">
            Manage comprehensive profiles, contact details, and cellular group coordinates.
          </p>
        </div>

        <button @click="showAddModal = true" class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] active:scale-[0.98]">
          <Plus class="w-4 h-4" />
          Register Member
        </button>
      </div>

      <!-- MEMBERS REGISTRY DATATABLE CARD -->
      <div class="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.3)]">
        
        <!-- Datatable filters -->
        <div class="p-5 border-b border-white/5 bg-slate-950/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 class="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2">
            <span>Roster Database Registry</span>
            <span class="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/25 text-[10px] text-indigo-400 font-mono">
              {{ filteredMembers.length }} Members List
            </span>
          </h3>

          <!-- Search Filter -->
          <div class="relative w-full sm:w-64">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search class="w-4 h-4" />
            </span>
            <input 
              v-model="searchFilter"
              type="text" 
              placeholder="Search ID, name, group, address..."
              class="w-full pl-9 pr-4 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <!-- Datatable list -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-950/40 border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th class="py-4 px-6">Public ID</th>
                <th class="py-4 px-6">Name / Details</th>
                <th class="py-4 px-6">Age / Gender</th>
                <th class="py-4 px-6">Grace Cell</th>
                <th class="py-4 px-6">Address Coordinate</th>
                <th class="py-4 px-6">Civil Status</th>
              </tr>
            </thead>
            
            <tbody v-if="filteredMembers.length > 0">
              <tr 
                v-for="m in filteredMembers" 
                :key="m.id"
                class="border-b border-white/5 hover:bg-white/[0.01] transition-all text-xs text-slate-300"
              >
                <!-- Public ID -->
                <td class="py-4 px-6 font-mono font-bold text-indigo-400">{{ m.publicId }}</td>

                <!-- Name Details -->
                <td class="py-4 px-6">
                  <div class="font-bold text-slate-200">{{ m.alias || `${m.firstName} ${m.lastName}` }}</div>
                  <div class="text-[10px] text-slate-500 font-mono">{{ m.firstName }} {{ m.middleName ? m.middleName + ' ' : '' }}{{ m.lastName }}</div>
                </td>

                <!-- Age / Gender -->
                <td class="py-4 px-6 font-semibold font-mono">
                  {{ m.age }} Yrs old <span class="text-slate-500">/</span> {{ m.gender }}
                </td>

                <!-- Cell Group -->
                <td class="py-4 px-6 font-semibold">
                  {{ m.group?.groupName || 'No Group Assignment' }}
                </td>

                <!-- Address Coordinates -->
                <td class="py-4 px-6">
                  <div v-if="m.addresses && m.addresses.length > 0" class="flex items-center gap-1.5">
                    <MapPin class="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div class="font-semibold text-slate-200">
                        {{ m.addresses[0].address.barangay }}, {{ m.addresses[0].address.municipality }}
                      </div>
                      <div class="text-[10px] text-slate-500">
                        {{ m.addresses[0].address.streetAddress }}
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-slate-600 italic">No Address Decoupled</div>
                </td>

                <!-- Civil Status -->
                <td class="py-4 px-6">
                  <span class="px-2 py-0.5 rounded bg-slate-950 border border-white/5 font-bold text-[9px] uppercase tracking-wider">
                    {{ m.civilStatus }}
                  </span>
                </td>

              </tr>
            </tbody>

            <!-- Table empty state -->
            <tbody v-else>
              <tr>
                <td colspan="6" class="py-12 text-center text-slate-500">
                  <div class="flex flex-col items-center justify-center gap-2">
                    <ShieldAlert class="w-8 h-8 text-slate-600 animate-pulse" />
                    <span class="text-xs font-semibold">No member profile matches the search filter.</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </main>

    <!-- REGISTER MEMBER MODAL -->
    <div v-if="showAddModal" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      
      <!-- Modal Box -->
      <div class="bg-slate-900 border border-white/10 w-full max-w-2xl rounded-3xl p-6 shadow-2xl space-y-6 relative animate-zoom max-h-[90vh] overflow-y-auto">
        <button @click="showAddModal = false" class="absolute top-4 right-4 text-slate-500 hover:text-slate-300">
          <X class="w-5 h-5" />
        </button>

        <div class="flex items-center gap-3">
          <div class="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <UserPlus class="w-6 h-6" />
          </div>
          <div class="space-y-0.5">
            <h3 class="text-lg font-bold text-white">Register Church Member</h3>
            <p class="text-xs text-slate-500">Add a member and automatically link a primary address inside a MySQL transaction.</p>
          </div>
        </div>

        <form @submit.prevent="handleAddMember" class="space-y-6">
          
          <!-- SECTION 1: Personal Profiles -->
          <div class="space-y-4">
            <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">1. Personal Profile details</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- First Name -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                <input v-model="firstName" type="text" placeholder="Edgar" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" required />
              </div>

              <!-- Last Name -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                <input v-model="lastName" type="text" placeholder="Limpin" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" required />
              </div>

              <!-- Middle Name -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Middle Name</label>
                <input v-model="middleName" type="text" placeholder="Gozum" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <!-- Alias -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alias (e.g. B. Edgar L)</label>
                <input v-model="alias" type="text" placeholder="B. Edgar L" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Age -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Age</label>
                <input v-model="age" type="number" placeholder="48" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" required />
              </div>

              <!-- Gender -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gender</label>
                <select v-model="gender" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50">
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </div>

              <!-- Civil Status -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Civil Status</label>
                <select v-model="civilStatus" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50">
                  <option value="SINGLE">SINGLE</option>
                  <option value="MARRIED">MARRIED</option>
                  <option value="WIDOWED">WIDOWED</option>
                  <option value="DIVORCED">DIVORCED</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Contact Number -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                <input v-model="contactNumber" type="text" placeholder="0917XXXXXXX" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Baptism Date -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Baptism Date</label>
                <input v-model="baptismDate" type="date" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Cell Group Assignment -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Grace Cell Group</label>
                <select v-model="groupId" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50">
                  <option value="">-- No Group Assignment --</option>
                  <option v-for="g in groups" :key="g.id" :value="g.id">
                    {{ g.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- SECTION 2: Decoupled Address coordinates -->
          <div class="space-y-4">
            <h4 class="text-[10px] font-bold text-indigo-400 uppercase tracking-widest border-b border-white/5 pb-2">2. Decoupled Physical Location</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Street Address -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Street Address (Purok/House #)</label>
                <input v-model="streetAddress" type="text" placeholder="Purok 1" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Barangay -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Barangay</label>
                <input v-model="barangay" type="text" placeholder="Lambac" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Municipality -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Municipality (City/Town)</label>
                <input v-model="municipality" type="text" placeholder="Sasmuan" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Province -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Province</label>
                <input v-model="province" type="text" placeholder="Pampanga" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>

              <!-- Zip Code -->
              <div class="space-y-1.5">
                <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Zip Code</label>
                <input v-model="zipCode" type="text" placeholder="2004" class="w-full px-4 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500/50" />
              </div>
            </div>
          </div>

          <button type="submit" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(99,102,241,0.25)] flex items-center justify-center gap-1.5">
            <UserPlus class="w-4 h-4" />
            Complete Registration in Transaction
          </button>

        </form>
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
