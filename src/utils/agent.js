// Agent核心逻辑
import { OpenAI } from 'openai';

// 初始化OpenAI客户端
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // 仅开发环境使用
});

// 系统提示词（Prompt工程）
const systemPrompt = `
你是一位【专业、严谨、安全的AI健康管理助手】，遵循以下规则：
1. 你不能进行医疗诊断，只能提供健康建议、科普、生活方式指导。
2. 如果用户描述急症，必须提醒及时就医。
3. 回答必须温和、清晰、结构化、易懂。
4. 你拥有Agent能力，可以自主调用工具：BMI计算、饮食建议、运动计划、睡眠分析。
5. 回答风格：简洁、专业、有温度。
`.trim();

// 意图识别函数
export function detectIntent(input) {
  if (input.includes('身高') || input.includes('体重') || input.includes('BMI')) return 'bmi';
  if (input.includes('睡') || input.includes('失眠') || input.includes('熬夜')) return 'sleep';
  if (input.includes('吃') || input.includes('饮食') || input.includes('食谱')) return 'diet';
  if (input.includes('运动') || input.includes('健身') || input.includes('减肥')) return 'sport';
  if (input.includes('压力') || input.includes('焦虑') || input.includes('情绪')) return 'emotion';
  return 'chat';
}

// 工具函数
export function calculateBMI(height, weight) {
  const bmi = (weight / (height * height / 10000)).toFixed(2);
  let level = '';
  if (bmi < 18.5) level = '偏瘦';
  else if (bmi < 24) level = '正常';
  else if (bmi < 28) level = '超重';
  else level = '肥胖';
  return { bmi, level };
}

// Agent执行函数
export async function runAgent(userInput) {
  // 1. 意图识别
  const intent = detectIntent(userInput);
  
  // 2. 调用工具
  let toolResult = '';
  if (intent === 'bmi') {
    // 提取身高体重（简化处理，实际可优化）
    const heightMatch = userInput.match(/(\d+)cm/);
    const weightMatch = userInput.match(/(\d+)kg/);
    if (heightMatch && weightMatch) {
      const { bmi, level } = calculateBMI(parseInt(heightMatch[1]), parseInt(weightMatch[1]));
      toolResult = `BMI=${bmi}，体型=${level}`;
    } else {
      toolResult = '需要身高和体重信息';
    }
  } else if (intent === 'sleep') {
    toolResult = '用户有睡眠问题，建议规律作息，睡前避免蓝光';
  } else if (intent === 'diet') {
    toolResult = '用户需要饮食建议';
  } else if (intent === 'sport') {
    toolResult = '用户需要运动计划';
  } else if (intent === 'emotion') {
    toolResult = '用户有情绪问题，建议放松训练';
  }
  
  // 3. 生成最终回答
  const finalPrompt = `
    ${systemPrompt}
    用户问题：${userInput}
    工具执行结果：${toolResult}
    请给出最终专业建议。
  `;
  
  // 4. 调用OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: finalPrompt }
    ]
  });
  
  return response.choices[0].message.content;
}