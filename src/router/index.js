import { createRouter, createWebHistory } from 'vue-router'

const backendroutes = [
  {
    path: '/back',
    name: 'backend',
    redirect: '/back/dashboard',
    component: () => import('@/components/BackendLayout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/views/dashboard.vue'),
        meta: {
          title: '数据分析',
          icon: 'PieChart'
        },
      },
      {
        path: 'knowledge',
        component: () => import('@/views/knowledge.vue'),
        meta: {
          title: '知识问答',
          icon: 'ChatLineSquare'
        },
      },
      {
        path: 'consultations',
        component: () => import('@/views/consultations.vue'),
        meta: {
          title: '咨询记录',
          icon: 'Message'
        },
      },
      {
        path: 'emotional',
        component: () => import('@/views/emotional.vue'),
        meta: {
          title: '情绪日志',
          icon: 'User'
        },
      },
    ]
  },
  {
    path: '/auth',
    name: 'auth',
    redirect: '/auth/login',
    component: () => import('@/components/AuthLayout.vue'),
    children: [
      {
        path: 'login',
        name: 'login',
        component: () => import('@/views/login.vue'),
        meta: {
          title: '登录'
        }
      },
      {
        path: 'register',
        name: 'register',
        component: () => import('@/views/register.vue'),
        meta: {
          title: '注册'
        }
      },
    ]
  }
]

const fontendroutes = [
  {
    path: '/',
    redirect: '/home',
    component: () => import('@/components/FrontendLayout.vue'),
    children: [
      {
        path: 'home',
        component: () => import('@/views/home.vue')
      },
      {
        path: 'consultation',
        component: () => import('@/views/consultation.vue')
      },
      {
        path: 'emotion-diary',
        component: () => import('@/views/emotionDiary.vue')
      },
      {
        path: 'knowledge',
        component: () => import('@/views/FrontendKnowledge.vue')
      },
      {
        path: 'knowledge/article/:id',
        component: () => import('@/views/articeleDetail.vue'),
        props: true
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes: [...fontendroutes, ...backendroutes]
})

// 白名单：不需要登录就能访问的页面
const whiteList = [
  '/auth/login',
  '/auth/register',
  '/',
  '/home',
  '/knowledge',
  '/knowledge/article/'
]

router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  
  // 检查是否在白名单中
  const isInWhiteList = whiteList.some(path => {
    // 特殊处理根路径
    if (path === '/') {
      return to.path === '/'
    }
    // 处理其他以斜杠结尾的路径
    if (path.endsWith('/')) {
      return to.path.startsWith(path)
    }
    // 处理精确匹配的路径
    return to.path === path
  })
  
  if (isInWhiteList) {
    return true
  }
  
  // 需要登录的页面
  if(token) {
    const userInfo = JSON.parse(localStorage.getItem('userInfo'))
    if(userInfo.userType === 2) {
      if(to.path.startsWith('/back')) {
        return true
      } else {
        return '/back/dashboard'
      } 
    } else if(userInfo.userType === 1) {
      if(to.path.startsWith('/back') || to.path.startsWith('/auth')) {
        return '/'
      } else {
        return true
      }
    }
  } else {
    return '/auth/login'
  }
  
  return true
})

export default router