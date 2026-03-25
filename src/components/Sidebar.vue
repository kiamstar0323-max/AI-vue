<template>
  <el-aside :width="isCollapse ? '64px' : '264px'">
      <el-menu
      default-active="2"
      :collapse="isCollapse"
      :collapse-transition="false"
      @open="handleOpen"
      @close="handleClose"
      class="menu-style"
      router
    >
      <div class="brand">
        <el-image :src="iconUrl" style="width: 50px; margin-right: 10px;"></el-image>
        <div v-show="!isCollapse" class="info-card">
          <h1 class="brand-title">心理健康AI助手</h1>
          <p clas="brand-subtitle">管理后台</p>
        </div>
      </div>
      <el-menu-item v-for="item in router.options.routes[1].children" :key="item.path" :index="`/back/${item.path}`">
        <el-icon><icon-menu /><component :is="item.meta.icon" /></el-icon>
        <span>{{ item.meta.title }}</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>

<script setup>
import {useRouter} from 'vue-router'
import {computed} from 'vue'
import {useAdminStore} from '@/store/admin'

const router = useRouter()

const iconUrl = new URL('../assets/机器人.png', import.meta.url).href

const isCollapse = computed(() => useAdminStore().isCollapse)

</script>

<style lang="scss" scoped>
:deep(el-aside) {
  height: 100%;
}
.menu-style {
  height: 100%;
  .brand {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    background-color: #fff;
    border-bottom: 1px solid #e5e7eb;
    .info-card {
      .brand-title {
        font-size: 20px;
        font-weight: bold;
        margin-bottom: 5px;
        color: #1f2937;
      }
      .brand-subtitle {
        font-size: 14px;
        color: #6b7280;
      }
      }
  }
}
</style>