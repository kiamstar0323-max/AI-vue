<template>
  <div class="consultation-container">
    <div class="sidebar">
      <div class="ai-assistant-info">
        <div class="breathing-circle">
          <el-image :src="iconUrl" style="width: 25px;" alt="AI助手"></el-image>
        </div>
        <h3 class="assistant-name">AI助手</h3>
        <div class="online-status">
          <div class="status-dot"></div>
          在线服务中
        </div>
      </div> 
      <div class="emotion-garden">
        <div class="garden-header">
            <div class="garden-title"> 情绪花园 </div>
        </div>
        <div class="emotion-info">
            <div class="emotion-name">中性</div>
            <div class="emotion-score">50</div>
        </div>
        <div class="warm-tips">
            <div class="emotion-status-text">
                <span class="status-label">今天感觉</span>
                <span class="status-emotion">{{ currentEmotion.isNegative ? '需要关注' : '很不错' }}</span>
            </div>
            <div class="emotion-intensity">
                <span class="intensity-dots">
                    <span v-for="dot in 3" :key="dot" class="dot" :class="{'active': getIntensityClass(currentEmotion.emotionScore) >= dot}"></span>
                </span>
                <span class="intensity-text">
                    {{ getRiskText(currentEmotion.riskLevel) }}
                </span>
            </div>
            <div class="warm-suggetion" v-if="currentEmotion.suggestion">
                <div class="suggestion-icon">💝</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">给你的小建议</div>
                    <div class="suggestion-text">{{ currentEmotion.suggestion }}</div>
                </div>
            </div>
            <div class="healing-acions" v-if="(currentEmotion.improvementSuggestions?.length || 0) > 0">
                <div class="actions-title">治愈小行动</div>
                <div class="actions-list">
                    <div v-for="action in currentEmotion.improvementSuggestions" :key="action" class="action-item">
                        <div class="icon">✨</div>
                        <div class="action-text">{{ action }}</div>
                    </div>
                </div>
            </div>
            <div class="risk-notice" v-if="currentEmotion.isNegative && currentEmotion.riskLevel > 1">
                <div class="notice-icon">🤗</div>
                <div class="notice-content">
                    <div class="notice-title">温馨提示</div>
                    <div class="notice-text">{{ currentEmotion.riskDescription }}</div>
                </div>
            </div>
        </div>
      </div>
      <div class="session-history">
        <h4 class="section-title">会话列表</h4>
        <div class="session-list">
            <div v-for="session in sessionList" :key="session.id" @click="handleSessionClick(session)" class="session-item">
                <div class="session-info">
                    <div class="session-title">
                        <span>{{ session.sessionTitle }}</span>
                        <!-- <div class="session-meta">
                            <span class="session-item">{{ session.sessionTitle }}</span>
                        </div> -->
                        <div class="session-preview">
                            {{ session.lastMessageContent }}
                        </div>
                        <div class="session-stats">
                            <span>
                                <el-icon><ChatRound /></el-icon>
                                {{ session.messageCount || 0}}
                            </span>
                            <span>
                                <el-icon><Clock /></el-icon>
                                {{ session.durationMinutes || 0}} 分钟
                            </span>
                        </div>
                    </div>
                    <div class="session-actions">
                        <el-button text type="danger" size="mini" @click="handleDeleteSession(session.id)">
                            <el-icon>
                                <DeleteFilled />
                            </el-icon>
                        </el-button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
    <div class="chat-main">
      <div class="chat-header">
        <div class="header-left">
          <div class="chat-avatar">
            <el-image :src="iconUrl1" style="width: 30px;"></el-image>
          </div>
          <div class="chat-info">
            <h2>AI助手</h2>
            <p>您的贴心AI心理健康助手</p>
          </div>
        </div>
        <el-button circle @click="createNewFrontendSession" title="新建会话">
          <el-icon>
            <Plus />
          </el-icon>
        </el-button>
      </div>
      <div class="chat-messages" ref="chatMessagesRef">
        <div class="message-item ai-message" v-if="messages.length === 0">
          <div class="message-avatar">
            <el-image :src="iconUrl" style="width: 18px; height: 18px;"></el-image>
          </div>
          <div class="message-content">
            <div class="message-bubble">
              <p>您好！我是小涛，您的AI心理健康助手。很高心陪伴你，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？</p>
            </div>
            <div class="message-time">刚刚</div>
          </div>
        </div>
        <div v-for="msg in messages" :key="msg.id" class="message-item" :class="msg.senderType === 1 ? 'user-message' : 'ai-message'">
            <div class="message-avatar">
                <el-image v-if="msg.senderType === 1" style="width:18px;" :src="iconUrl2"></el-image>
                <el-image v-if="msg.senderType === 2" style="width:18px;" :src="iconUrl"></el-image>
            </div>
            <div class="message-content">
                <div class="message-bubble">
                    <div v-if="msg.senderType === 2 && isAiTyping && !msg.content" class="typing-indicator">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                    <div v-else-if="msg.isError" class="error-message">
                        <p>{{ msg.content }}</p>
                    </div>
                    <MarkdownRenderer v-else-if="msg.senderType === 2 && !msg.isError" :content="msg.content" :is-ai-message="true"></MarkdownRenderer>
                    <p v-else-if="msg.content" v-html="formatMessageContent(msg.content)"></p>
                </div>
                <div class="message-time">{{ msg.senderType === 2 && msg.isTyping ? '正在输入中...' : formatTime(msg.createdAt) }}</div>
            </div>
        </div>
      </div>
      <div class="chat-input">
        <div class="input-container">
            <el-input
                v-model="userMessage"
                placeholder="请输入您想要分享的内容..."
                type="textarea"
                :rows="3"
                :disabled="isAiTyping"
                @keydown="handleKeyDown"
                class="message-input"
                clearable
            >
            </el-input>
            <div class="input-footer">
                <span>按Enter发送，Shift+Enter换行</span>
                <span>{{ userMessage.length }}/500</span>
            </div>
        </div>
        <el-button :disabled="!userMessage.trim() || userMessage.length > 500 || isAiTyping" type="primary" class="send-btn" @click="sendMessage">
            <el-icon>
                <Promotion />
            </el-icon>
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { startSession, getSessionList, deleteSession, getSessionDetail, getSessionEmotion } from '@/api/frontend.js'
import { ElMessage } from 'element-plus'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { fetchEventSource } from '@microsoft/fetch-event-source'

const iconUrl = new URL('@/assets/robot-fill.png', import.meta.url).href
const iconUrl1 = new URL('@/assets/like.png', import.meta.url).href
const iconUrl2 = new URL('@/assets/users.png', import.meta.url).href

const createNewFrontendSession = () => {
    // 清空消息列表
    messages.value = []
    // 创建新的临时会话
    createNewSession()
    // 显示欢迎消息
    messages.value.push({
        id: Date.now(),
        senderType: 2,
        content: '您好！我是小涛，您的AI心理健康助手。很高兴陪伴你，为您提供温暖的心理支持。请告诉我，今天您感觉怎么样？有什么想要分享的吗？',
        createdAt: new Date().toISOString()
    })
    scrollToBottom()
}

const createNewSession = () => {
    const newSession = {
        sessionId: `temp_${Date.now()}`,
        status: 'TEMP',
        sessionTitle: '新对话'
    }
    currentSession.value = newSession
}

const currentSession = ref(null)
const sessionList = ref([])

const userMessage = ref('')
const messages = ref([])
const isAiTyping = ref(false)
const chatMessagesRef = ref(null)

const currentEmotion = ref({
    primaryEmotion: '中性',
    emotionScore: 50,
    isNegative: false,
    riskLevel: 0,
    suggestion: '情绪状态平稳',
    improvementSuggestions: []
})

const loadSessionEmotion = (sessionId) => {
    const id = sessionId.toString().startsWith('session_') ? sessionId : `session_${sessionId}`
    getSessionEmotion(id).then(res => {
        // 添加默认值处理，确保improvementSuggestions是数组
        currentEmotion.value = {
            ...res,
            improvementSuggestions: res.improvementSuggestions || []
        }
    }).catch(error => {
        console.error('加载情绪分析失败:', error)
        // 错误情况下也确保improvementSuggestions是数组
        currentEmotion.value = {
            ...currentEmotion.value,
            improvementSuggestions: []
        }
    })
}

const getIntensityClass = (score) => {
    if(score >= 61) {
        return 3
    }
    if (score >= 31) {
        return 2
    }
    return 1
}

const getRiskText = (level) => {
    switch (level) {
        case 0:
            return '正常'
        case 1:
            return '关注'
        case 2:
            return '预警'
        case 3:
            return '危机'
        default:
            return '正常'
    }
}

const handleKeyDown = (e) => {
    if(e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
    }
}

const sendMessage = () => {
    if(!userMessage.value.trim())   return 
    if(isAiTyping.value) {
        ElMessage.error('AI助手正在输入中，请稍后')
        return
    }
    const message = userMessage.value.trim()
    userMessage.value=''

    if(currentSession.value.status === 'TEMP') {
        startNewSession(message)
    } else {
        messages.value.push({
            id: Date.now(),
            senderType: 1,
            content: message,
            createdAt: new Date().toISOString()
        })
        scrollToBottom()
        startAIResponse(currentSession.value.sessionId, message)
    }
}

const startNewSession = (message) => {
    const sessionParams = {
        initialMessage: message
    }
    if(currentSession.value.sessionTitle === '新对话') {
        const now = new Date()
        const dateTime = `${now.toLocaleDateString()} ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
        sessionParams.sessionTitle = `AI助手 - ${dateTime}`
    } else {
        sessionParams.sessionTitle = currentSession.value.sessionTitle
    }
    
    startSession(sessionParams).then(res => {
        const sessionData = {
            sessionId: res.sessionId,
            status: res.status,
            sessionTitle: sessionParams.sessionTitle
        }
        if(currentSession.value && currentSession.value.status === 'TEMP') {
            Object.assign(currentSession.value, sessionData)
        } else {
            currentSession.value = sessionData
        }
        getSessionPage()
        
        // 添加用户消息
        const userMsg = {
            id: Date.now(),
            senderType: 1,
            content: message,
            createdAt: new Date().toISOString()
        }
        messages.value.push(userMsg)
        scrollToBottom()
        
        // 使用正确的 sessionId 调用 AI 回复
        if (res.sessionId) {
            startAIResponse(res.sessionId, message)
        } else {
            throw new Error('会话ID不存在')
        }
    }).catch(error => {
        ElMessage.error('创建会话失败: ' + (error.message || '未知错误'))
        // 确保在错误情况下重置 isAiTyping 状态
        isAiTyping.value = false
    })
}

const startAIResponse = (sessionId, userMessage) => {
    if(isAiTyping.value) {
        ElMessage.error('AI助手正在输入中，请稍后')
        return
    }
    
    // 检查参数
    if (!sessionId) {
        handleError('会话ID不存在，请重试')
        return
    }
    
    // 确保会话ID格式正确，添加session_前缀
    const formattedSessionId = sessionId.toString().startsWith('session_') ? sessionId : `session_${sessionId}`
    
    // 确保 userMessage 是字符串
    const messageText = typeof userMessage === 'string' ? userMessage : JSON.stringify(userMessage)
    
    isAiTyping.value = true
    const aiMessage = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        senderType: 2,
        content: '',
        createdAt: new Date().toISOString(),
        isTyping: true
    }
    messages.value.push(aiMessage)
    scrollToBottom()

    const ctrl = new AbortController()
    fetchEventSource('/api/psychological-chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'token': localStorage.getItem('token') || '',
            'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
            sessionId: formattedSessionId,
            userMessage: messageText
        }),
        signal: ctrl.signal,
        onopen: (response) => {
            if (response.status === 403) {
                handleError('认证失败，请重新登录')
                ctrl.abort()
                return
            }
        },
        onmessage: (event) => {
            const raw = event.data.trim()
            if (!raw) return
            
            const aiMessage = messages.value[messages.value.length - 1]

            if (raw === '[DONE]' || event.event === 'done') {
                isAiTyping.value = false
                // 找到当前正在输入的消息并设置 isTyping 为 false
                const aiMessage = messages.value[messages.value.length - 1]
                if (aiMessage) {
                    aiMessage.isTyping = false
                }
                ctrl.abort()
                // 只有当不是临时会话时才加载情绪分析
                if (currentSession.value && currentSession.value.status !== 'TEMP') {
                    loadSessionEmotion(currentSession.value.sessionId)
                }
                return
            }
            
            // 处理错误事件
            if (event.event === 'error') {
                try {
                    const payload = JSON.parse(raw)
                    handleError(payload.msg || payload.message || '对话服务异常')
                } catch (error) {
                    handleError('对话服务异常')
                }
                ctrl.abort()
                return
            }
            
            try {
                const payload = JSON.parse(raw)
                const ok = String(payload.code) === '200'
                if(ok && payload.data && payload.data.content) {
                    aiMessage.content += payload.data.content
                    scrollToBottom()
                } else if(!ok) {
                    handleError(payload.message || payload.msg || 'AI回复失败')
                    ctrl.abort()
                }
            } catch (error) {
                // 直接将原始数据作为内容添加
                aiMessage.content += raw
                scrollToBottom()
            }
        },
        onerror: (err) => {
            // 只有在确实发生错误时才显示错误信息
            // 避免在正常的连接关闭时误报错误
            if (err && err.message && !err.message.includes('abort')) {
                handleError('AI回复失败，请重试')
            } else {
                // 即使没有显示错误信息，也需要将 isTyping 设为 false
                const aiMessage = messages.value[messages.value.length - 1]
                if (aiMessage) {
                    aiMessage.isTyping = false
                }
                isAiTyping.value = false
            }
            ctrl.abort()
        },
        onclose: () => {
            isAiTyping.value = false
            // 只有当不是临时会话时才加载情绪分析
            if (currentSession.value && currentSession.value.status !== 'TEMP') {
                loadSessionEmotion(currentSession.value.sessionId)
            }
        }
    })
}

const handleError = (message = 'AI回复失败，请重试') => {
    const aiMessage = messages.value[messages.value.length - 1]
    if(aiMessage) {
        aiMessage.content = message
        aiMessage.isTyping = false
    }
    isAiTyping.value = false
    ElMessage.error(message)
}

const getSessionPage = () => {
    return getSessionList({
        pageNum: 1,
        pageSize: 10
    }).then(res => {
        sessionList.value = res.records
        if (sessionList.value && sessionList.value.length > 0) {
            const sessionData = {
                sessionId: sessionList.value[0].id,
                status: 'ACTIVE',
                sessionTitle: sessionList.value[0].sessionTitle
            }
            currentSession.value = sessionData
        } else {
            // 当没有会话时，创建一个临时会话
            createNewSession()
        }
    })
}

const handleSessionClick = (session) => {
    // 更新当前会话
    currentSession.value = {
        sessionId: session.id,
        status: 'ACTIVE',
        sessionTitle: session.sessionTitle
    }
    // 加载会话消息
    getSessionDetail(session.id).then(res => {
        messages.value = res
        scrollToBottom()
    })
    // 加载会话情绪分析结果
    loadSessionEmotion(session.id)
}

const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId).then(res => {
        ElMessage.success('删除成功')
        getSessionPage()
    })
}

const formatMessageContent = (content) => {
    if (!content || typeof content !== 'string') return ''
    return content.replace(/\n/g,'<br>')
}

const formatTime = (timeString) => {
    if (!timeString) return ''
    const date = new Date(timeString)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const scrollToBottom = () => {
    // 延迟执行，确保DOM已更新
    setTimeout(() => {
        if (chatMessagesRef.value) {
            chatMessagesRef.value.scrollTop = chatMessagesRef.value.scrollHeight
        }
    }, 50)
}

onMounted(() => {
    getSessionPage().then(() => {
        // 只有当没有会话时才创建新的前端会话
        if (!currentSession.value || !currentSession.value.sessionId) {
            createNewFrontendSession()
        } else {
            // 只有当不是临时会话时才加载会话详情和情绪分析
            if (currentSession.value.status !== 'TEMP') {
                // 如果有会话，加载会话详情
                getSessionDetail(currentSession.value.sessionId).then(res => {
                    messages.value = res
                }).catch(error => {
                    console.error('加载会话详情失败:', error)
                    // 加载失败时创建新会话
                    createNewFrontendSession()
                })
                // 加载会话情绪分析结果
                loadSessionEmotion(currentSession.value.sessionId)
            }
        }
    })
})
</script>



<style lang="scss" scoped>
.consultation-container {
    margin: 0 auto;
    width: 1200px;
    display: flex;
    gap: 20px;
    padding: 20px;
    .sidebar {
        width: 320px;
        .ai-assistant-info {
            margin-bottom: 20px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 8px 32px rgba(251, 146, 60, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
            border: 1px solid rgba(251, 146, 60, 0.08);
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
            .breathing-circle {
                width: 60px;
                height: 60px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 12px;
                animation: breathing 4s ease-in-out infinite;
                box-shadow: 0 6px 24px rgba(251, 146, 60, 0.25);
                position: relative;
            }
            .assistant-name {
                font-size: 16px;
                font-weight: 700;
                background: linear-gradient(135deg, #fb923c, #f59e0b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                text-align: center;
                background-clip: text;
                margin: 0 0 12px;
            }
            .online-status {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #059669;
                font-size: 12px;
                font-weight: 600;
                .status-dot {
                    width: 8px;
                    height: 8px;
                    background: #059669;
                    border-radius: 50%;
                    margin-right: 8px;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 8px rgba(5, 150, 105, 0.4);
                }
            }
        }
        .session-history {
            background: white;
            border-radius: 16px;
            padding: 16px;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
            min-height: 250px;
            display: flex;
            flex-direction: column;
            .section-title {
                font-size: 16px;
                font-weight: 600;
                color: #333;
                margin: 0 0 16px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                
            }
            .session-list {
                overflow-y: auto;
                max-height: 200px;
                scrollbar-width: thin;
                scrollbar-color: rgba(64, 150, 255, 0.3) transparent;
                .session-item {
                    position: relative;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid transparent;
                    &:hover {
                        background: #f8f9ff;
                        border-color: #e6f0ff;
                    }
                    &.active {
                        background: #e6f0ff;
                        border-color: #4096ff;
                    }
                    .session-info {
                        flex: 1;
                        .session-title {
                            font-weight: 500;
                            font-size: 14px;
                            color: #333;
                            margin-bottom: 4px;
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            .session-meta {
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                margin-bottom: 6px;
                                .session-time {
                                    font-size: 12px;
                                    color: #999;
                                }
                            }
                            .session-preview {
                                width: 200px;
                                font-size: 12px;
                                color: #666;
                                margin-bottom: 6px;
                                white-space: nowrap;
                                overflow: hidden;
                                text-overflow: ellipsis;
                            }
                            .session-stats {
                                display: flex;
                                align-items: center;
                                gap: 12px;
                                span {
                                    font-size: 12px;
                                    color: #999;
                                    display: flex;
                                    align-items: center;
                                    gap: 4px;
                                }
                            }
                        }
                        .session-actions {
                            position: absolute;
                            top: 10px;
                            right: 12px;
                        }
                    }
                }
                .no-sessions-text {
                    text-align: center;
                    font-size: 14px;
                    color: #999;
                }
            }
        }
        .emotion-garden {
            background: linear-gradient(135deg, #fef9e7 0%, #fcf4e6 50%, #f6f0e8 100%);
            border-radius: 20px;
            padding: 16px;
            margin-bottom: 20px;
            box-shadow: 0 8px 32px rgba(252, 244, 230, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            min-height: 300px;
            
            .garden-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 20px;
                position: relative;
                z-index: 2;
                .garden-title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: #8b4513;
                }
            }
            .emotion-info {
                margin: 0 auto;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                z-index: 10;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.8);
                background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%);
                color: #fff;
                .emotion-name {
                    font-size: 15px;
                    font-weight: 600;
                    line-height: 1;
                    margin-bottom: 2px;
                }
                .emotion-score {
                    font-size: 14px;
                    font-weight: 700;
                    opacity: 0.9;
                }
            }
            .warm-tips {
                text-align: center;
                margin-bottom: 16px;
                .emotion-status-text {
                    margin-bottom: 12px;
                    .status-label {
                        font-size: 14px;
                        color: #8b7355;
                        margin-right: 8px;
                    }
                    .status-emotion {
                        font-size: 16px;
                        font-weight: 600;
                        padding: 4px 12px;
                        border-radius: 16px;
                        display: inline-block;
                    }
                }
                .emotion-intensity {
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    .intensity-dots {
                        display: flex;
                        gap: 4px;
                        .dot {
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            background: #e0e0e0;
                            transition: all 0.3s ease;
                            &.active {
                                background: linear-gradient(135deg, #ff9a9e, #fecfef);
                                transform: scale(1.2);
                                box-shadow: 0 2px 8px rgba(255, 154, 158, 0.4);
                            }
                        }
                    }
                    .intensity-text {
                        font-size: 12px;
                        color: #8b7355;
                        font-weight: 500;
                    }
                }
                .warm-suggestion {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.8));
                    border-radius: 16px;
                    padding: 12px;
                    margin-bottom: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 10px;
                    border: 1px solid rgba(255, 255, 255, 0.6);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
                    .suggestion-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .suggestion-content {
                        text-align: left;
                        flex: 1;
                        .suggestion-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #8b7355;
                            margin-bottom: 6px;
                        }
                        .suggestion-text {
                            font-size: 13px;
                            color: #6b5b47;
                            line-height: 1.5;
                        }
                    }
                }
                .healing-actions {
                    margin-bottom: 16px;
                    .actions-title {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        color: #8b7355;
                        margin-bottom: 16px;
                    }
                    .actions-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                        .action-item {
                            background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.7));
                            border-radius: 12px;
                            padding: 12px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            border: 1px solid rgba(255, 255, 255, 0.5);
                            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
                            text-align: left;
                            .action-icon {
                                font-size: 14px;
                                color: #ffd700;
                                flex-shrink: 0;
                            }
                            .action-text {
                                font-size: 12px;
                                color: #6b5b47;
                                line-height: 1.4;
                                flex: 1;
                            }
                        }
                    }
                }
                .risk-notice {
                    background: linear-gradient(135deg, #fff9e6, #ffeaa7);
                    border-radius: 16px;
                    padding: 16px;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    border: 1px solid rgba(255, 234, 167, 0.6);
                    box-shadow: 0 6px 20px rgba(255, 234, 167, 0.3);
                    .notice-icon {
                        font-size: 20px;
                        flex-shrink: 0;
                        margin-top: 2px;
                    }
                    .notice-content {
                        flex: 1;
                        .notice-title {
                            font-size: 14px;
                            font-weight: 600;
                            color: #d4840f;
                            margin-bottom: 6px;
                        }
                        .notice-text {
                            font-size: 13px;
                            color: #b8740c;
                            line-height: 1.5;
                        }
                    }
                }
            }
        }
    }
    .chat-main {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 252, 250, 0.98) 100%);
        border-radius: 20px;
        box-shadow: 0 12px 40px rgba(251, 146, 60, 0.08), 0 4px 16px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(251, 146, 60, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        flex: 1;
        .chat-header {
            background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
            color: white;
            padding: 20px 24px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            position: relative;
            flex-shrink: 0;
            .header-left {
                display: flex;
                align-items: center;
                .chat-avatar {
                    width: 48px;
                    height: 48px;
                    background: rgba(255, 255, 255, 0.25);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                    position: relative;
                    z-index: 1;
                }
                .chat-info {
                    h2 {
                        font-size: 20px;
                        font-weight: 700;
                        margin-bottom: 4px;
                    }
                    p {
                        font-size: 14px;
                    }
                }
            }
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 252, 248, 0.05) 100%);
            min-height: 0;
            max-height: calc(100vh - 200px);
            scrollbar-width: thin;
            scrollbar-color: rgba(251, 146, 60, 0.3) transparent;
            .message-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                .message-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    color: white;
                    flex-shrink: 0;
                }
                &.ai-message {
                    .message-avatar {
                        background: linear-gradient(135deg, #fb923c, #f59e0b);
                        box-shadow: 0 4px 12px rgba(251, 146, 60, 0.3);
                    }
                }
                &.user-message {
                    .message-avatar {
                        background: linear-gradient(135deg, #6b7280, #4b5563);
                        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.3);
                    }
                }
                .message-content {
                    max-width: 70%;
                    .message-bubble {
                        background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 252, 248, 0.95) 100%);
                        border-radius: 16px;
                        padding: 12px 16px;
                        position: relative;
                        animation: fadeInUp 0.4s ease-out;
                        border: 1px solid rgba(251, 146, 60, 0.1);
                        box-shadow: 0 4px 16px rgba(251, 146, 60, 0.05);
                        .typing-indicator {
                            display: flex;
                            gap: 4px;
                            padding: 8px 0;
                            .typing-dot {
                                width: 8px;
                                height: 8px;
                                background: #ccc;
                                border-radius: 50%;
                                animation: typing 1.5s ease-in-out infinite;
                                &:nth-child(2) {
                                    animation-delay: 0.2s;
                                }
                                &:nth-child(3) {
                                    animation-delay: 0.4s;
                                }   
                            }
                        }
                        /* 错误消息样式 */
                        .error-message {
                            background: linear-gradient(135deg, #FEF2F2 0%, #FECACA 100%);
                            border: 1px solid #F87171;
                            border-radius: 12px;
                            padding: 12px 16px;
                            color: #991B1B;
                            font-weight: 500;
                            display: flex;
                            align-items: center;
                            gap: 8px;
                        }
                    }
                    .message-time {
                        font-size: 12px;
                        color: #999;
                        margin-top: 4px;
                    }
                }
            }
        }
        .chat-input {
            border-top: 1px solid rgba(251, 146, 60, 0.1);
            padding: 20px 24px;
            display: flex;
            gap: 12px;
            align-items: flex-end;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 252, 248, 0.7) 100%);
            backdrop-filter: blur(10px);
            flex-shrink: 0;
            .input-container {
                flex: 1;
            }
            .input-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 12px;
                color: #78716c;
                font-weight: 500;
            }
            .send-btn {
                height: 60px;
                width: 60px;
                border-radius: 16px;
                background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%) !important;
                border: none !important;
                box-shadow: 0 6px 20px rgba(251, 146, 60, 0.25);
                transition: all 0.3s ease;
            }

        }

    }
}
</style>