<template>
  <div class="min-h-screen flex flex-col bg-gray-50">
    <!-- Header (hidden on admin pages) -->
    <Header v-if="!isAdminRoute" />
    
    <!-- Page Content -->
    <main class="grow flex flex-col">
      <router-view />
    </main>

    <!-- Footer (hidden on admin pages) -->
    <Footer v-if="!isAdminRoute" />

    <!-- Chatbot Widget (hidden on admin pages) -->
    <Chatbot v-if="!isAdminRoute" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import Chatbot from './components/Chatbot.vue'

const route = useRoute()

// Check if the current route path is under /admin
const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})
</script>

<style>
/* Global fade transition or animation triggers */
.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
