export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // ... existing translations ...
    common: {
      credits: 'Credits',
      save: 'Save',
      confirm: 'Confirm',
      finish: 'Finish',
      continue: 'Continue',
      loading: 'Loading...',
      generating: 'Generating...',
      completed: 'Completed',
      empty: 'No Data',
      cancel: 'Cancel',
      back: 'Back',
      close: 'Close',
      settings: 'Settings',
      profile: 'Profile',
      billing: 'Billing',
      logout: 'Log out',
      deleteAccount: 'Delete Account',
      menu: 'Menu',
      upgrade: 'Upgrade',
      upgradePro: 'Upgrade to Pro',
      upgradeDesc: 'Get unlimited AI analysis and detailed reports.',
      recentChats: 'Recent Chats',
      subscription: 'Subscription',
      free: 'Free',
      manageSubscription: 'Manage Subscription',
      proMember: 'Pro Member',
      freeAccount: 'Free Account',
      accountSettings: 'Account Settings',
      userGuide: 'User Guide',
      privacyPolicy: 'Privacy Policy',
      helpSupport: 'Help & Support',
      proPlanActive: 'Your Pro plan is active.',
      upgradeUnlock: 'Upgrade to unlock all features.',
      error: 'Error',
      failed: 'Failed',
      search: 'Search',
      email: 'Email',
      password: 'Password',
      username: 'Username',
      dangerZone: 'Danger Zone',
      verified: 'Verified',
      currentPassword: 'Current Password',
      newPassword: 'New Password',
      nextBilling: 'Next billing date',
      active: 'Active',
      plan: 'Plan',
      security: 'Security',
      accountAndPlan: 'Account & Plan',
      twoFactor: 'Two-Factor Authentication',
      twoFactorDesc: 'Add an extra layer of security to your account by enabling 2FA.',
      enableTwoFactor: 'Enable 2FA',
    },
    menu: {
      chat: 'New Chat',
      history: 'History Reports',
      firstAid: 'Emotional First Aid',
      sketch: 'Inner Sketch',
      test: 'Inner Quick Test',
      mood: 'Mood Tracker',
    },
    settings: {
      title: 'Settings',
      description: 'Manage your profile, preferences, and security settings.',
      account: 'Account',
      notifications: 'Notifications',
      name: 'Name',
      username: 'Username',
      language: 'Language',
      emailNotifs: 'Email Notifications',
      emailNotifsDesc: 'Receive daily summaries.',
      pushNotifs: 'Push Notifications',
      pushNotifsDesc: 'Receive real-time alerts.',
    },
    chat: {
      placeholder: 'Type your message...',
      initialMessage: "Hello. I'm Zeneme, your emotional companion. How are you feeling right now?",
      aiResponse: "I hear you. It sounds like you're carrying a lot right now. Could you tell me more about what triggered these feelings?",
      dataCollection: 'Data Collection',
      messagesCount: 'Messages',
      dataReady: 'Data Ready',
      analyzing: 'Analyzing...',
      generateReport: 'Generate Report',
      tooltips: {
        sendImage: 'Send Image',
        voiceInput: 'Voice Input',
        innerGallery: 'Inner Gallery',
        innerSketchpad: 'Inner Sketch'
      }
    },
    firstAid: {
      title: 'Emotional First Aid',
      subtitle: "You are safe here. If you're feeling overwhelmed, anxious, or panicked, we can help you find your ground again.",
      startBreathing: 'Start Breathing',
      groundingExercise: 'Grounding Exercise',
      stopExercise: 'Stop Exercise',
      breathingTitle: 'Box Breathing',
      breathingDesc: 'Follow the circle to regulate your breath',
      inhale: 'Inhale...',
      hold: 'Hold...',
      exhale: 'Exhale...',
      groundingTitle: '5-4-3-2-1 Technique',
      groundingItems: [
        "5 things you can see",
        "4 things you can touch",
        "3 things you can hear",
        "2 things you can smell",
        "1 thing you can taste"
      ]
    },
    mood: {
      title: 'Mood Tracker',
      subtitle: 'How are you feeling today?',
      logMood: 'Log Mood',
      notePlaceholder: 'Add a note about your day...',
      recentLogs: 'Recent Logs',
      days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      emptyTitle: 'No mood logs yet',
      emptyDesc: 'Spend 1 minute a day to track your mood and see patterns.',
      addFirstLog: 'Add First Log',
      moods: {
        Happy: 'Happy',
        Calm: 'Calm',
        Anxious: 'Anxious',
        Sad: 'Sad',
        Overwhelmed: 'Overwhelmed',
        Neutral: 'Neutral',
        Angry: 'Angry',
        Relieved: 'Relieved',
        Confused: 'Confused',
        Tired: 'Tired',
        Grateful: 'Grateful'
      }
    },
    sketch: {
      title: 'Inner Sketch',
      subtitle: 'Visualize your emotions through drawing.',
      analyze: 'Analyze with AI',
      analyzing: 'Analyzing...',
      clear: 'Clear Canvas',
      save: 'Save to Journal',
      share: 'Share',
      returnToChat: 'Return to Chat',
      steps: {
        scanning: 'Scanning lines...',
        interpreting: 'Interpreting patterns...',
        generating: 'Generating insights...'
      },
      resultTitle: 'Zeneme Analysis',
      mockResult: "Your drawing shows a balance of energetic lines and open spaces. The circular motions in the upper left suggest a desire for connection, while the structured lines below indicate you're building a stable foundation for your thoughts. You might be feeling a mix of creative excitement and a need for order."
    },
    test: {
      title: 'Inner Quick Test',
      subtitle: 'Take a quick assessment to understand your emotional state.',
      start: 'Start Assessment',
      resultTitle: 'Your Emotional Profile',
      retake: 'Retake',
      saveReport: 'Save Report',
      summary: 'Summary',
      stressLevel: 'Stress Level',
      primaryEmotion: 'Primary Emotion',
      low: 'Low',
      peaceful: 'Peaceful',
      question: 'Question',
      duration: '5-8 Minutes',
      scientific: 'Scientific Analysis',
      options: ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
      labels: {
        stability: 'Stability',
        selfAwareness: 'Self-Awareness',
        resilience: 'Resilience',
        optimism: 'Optimism',
        social: 'Social',
        focus: 'Focus'
      },
      summaryText: 'You demonstrate strong Stability and Optimism. This suggests you handle daily stressors well and maintain a positive outlook. However, your Focus score indicates you might be experiencing some distraction or mental clutter recently.',
      questions: [
        "I find it easy to calm myself down when I'm stressed.",
        "I often feel overwhelmed by my emotions.",
        "I can clearly identify what I am feeling.",
        "I tend to overthink small decisions.",
        "I feel optimistic about the future."
      ]
    },
    history: {
      title: 'History',
      subtitle: 'Your past analysis reports',
      emptyTitle: 'No history yet',
      emptyDesc: 'Your conversations and reports will appear here after your first session.',
      startSession: 'Start a Session',
      selectReport: 'Select a report to view details',
      filters: {
        all: 'All',
        firstAid: 'First Aid',
        sketch: 'Inner Sketch',
        test: 'Quick Test',
        mood: 'Mood Tracker'
      },
      types: {
        lite: 'Basic Report',
        pro: 'Deep Report'
      }
    },
    breathing: {
      stepLabel: 'Step 1: Breathing',
      title: 'Box Breathing',
      description: 'Follow the circle to regulate your breath. Inhale as the circle expands, hold, and exhale as it contracts.',
      mute: 'Mute',
      soundOn: 'Sound On',
      continueButton: 'Continue',
      skipButton: 'Skip',
      inhale: 'Inhale',
      hold: 'Hold',
      exhale: 'Exhale'
    },
    emotion: {
      stepLabel: 'Step 2: Naming',
      title: 'Name Your Emotion',
      description: 'Identify what you are feeling right now. Naming your emotion is the first step to taming it.',
      saveAndExit: 'Save & Exit',
      emotions: ['Anxious', 'Sad', 'Angry', 'Happy', 'Relieved', 'Confused', 'Tired', 'Grateful']
    },
    help: {
      title: 'Help & Support',
      subtitle: 'ZENEME Guide',
      items: [
        {
          trigger: 'How to use Inner Sketch',
          content: 'Inner Sketch is a way to help you see your emotions in ZENEME. You can be aware of your current feelings through simple drawing and prompts. There is no right or wrong here, and you don\'t need to draw well. Just expressing truthfully is enough.'
        },
        {
          trigger: 'Can I use it if I can\'t draw?',
          content: 'Yes. Inner Sketch focuses on emotional expression, not painting skills. A few casual strokes are equally meaningful.'
        },
        {
          trigger: 'What are the prompts for?',
          content: 'The prompts help you organize your thoughts, making it easier for you to see your emotions and needs.'
        },
        {
          trigger: 'Can I stop halfway?',
          content: 'Yes. If you feel uncomfortable or don\'t want to continue, you can pause or exit at any time.'
        },
        {
          trigger: 'Will my content be saved?',
          content: 'ZENEME protects your privacy. Your content is only used for your personal experience and will not be made public.'
        },
        {
          trigger: 'What if I encounter problems?',
          content: 'If you encounter problems or have feedback during use, you can contact us through the support channels in the app.'
        }
      ]
    },
    userGuide: {
      title: 'User Guide',
      subtitle: 'ZENEME Basics',
      sections: [
        {
          title: 'What is ZENEME',
          content: 'ZENEME is a space to help you perceive emotions and organize inner experiences. You can understand your current state more gently through dialogue, drawing, and recording.'
        },
        {
          title: 'How to start a chat',
          content: 'After entering the main interface, you can directly input your feelings or troubles. No need to organize language, just express truthfully.'
        },
        {
          title: 'What is Inner Sketch',
          content: 'Inner Sketch is a way to express emotions through simple drawing. The point is not to draw well, but to let emotions be seen.'
        },
        {
          title: 'About Records & Reports',
          content: 'During use, ZENEME will help you organize your expressions and generate personal records for you to better understand yourself.'
        },
        {
          title: 'Tips',
          list: [
            'Use in a quiet, safe environment',
            'Proceed at your own pace',
            'You can pause or end at any time'
          ]
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle: 'How we protect your information',
      sections: [
        {
          title: 'We value your privacy',
          content: 'ZENEME values your privacy and data security. Your trust is crucial to us.'
        },
        {
          title: 'Information Usage',
          content: 'The content you generate in ZENEME is only used to provide you with functional experiences.'
        }
      ]
    },
    modals: {
      logoutTitle: 'Confirm Logout?',
      logoutDesc: 'You can log back in at any time.',
      deleteTitle: 'Confirm Delete Account?',
      deleteDesc: 'Your data cannot be recovered. Please proceed with caution.',
      limitTitle: 'Limit Reached',
      limitDesc: 'Usage limit reached for current version. Upgrade to continue.',
      later: 'Later',
      toUpgrade: 'Upgrade Now'
    },
    upgrade: {
      title: 'Upgrade to Pro',
      subtitle: 'Unlock complete reports and long-term history',
      freePlan: 'Free Plan',
      proPlan: 'Pro Plan',
      price: '30 RMB / month',
      autoRenew: 'Auto-renew monthly, cancel anytime',
      freeFeatures: [
        '5 full experiences',
        'Basic reports',
        'Chat & report history'
      ],
      proFeatures: [
        'Unlimited experiences',
        'Deep reports (Inner Roles, Advice)',
        'Mood & Usage Analytics'
      ],
      cancel: 'Cancel',
      subscribe: 'Subscribe Now',
      confirmTitle: 'Confirm Subscription',
      planLabel: 'Plan',
      priceLabel: 'Price',
      renewLabel: 'Renewal',
      terms: 'I have read and agree to the Terms of Service and Privacy Policy',
      termsError: 'Please agree to the terms first',
      processing: 'Processing Payment...',
      failedTitle: 'Payment Failed',
      failedDesc: 'Could not complete payment. Please try again.',
      retry: 'Retry',
      successTitle: 'Upgrade Successful',
      successDesc: 'You can now generate deep reports and view full analytics.',
      unlockReport: 'Unlock Report',
      continueSession: 'Continue Session',
      viewBenefits: 'View Benefits',
      alreadyProTitle: 'You are already Pro',
      alreadyProDesc: 'Your subscription is active.',
      manageTitle: 'Manage Subscription',
      cancelAutoRenew: 'Cancel Auto-Renew',
      restore: 'Restore Subscription',
      confirmCancelTitle: 'Confirm Cancellation?',
      confirmCancelDesc: 'You will still have access until the end of the current period.',
      cancelSuccess: 'Auto-renewal cancelled. Will revert to Free at end of period.',
      lockedTitle: 'Deep Content Locked',
      lockedDesc: 'Upgrade to view Inner Roles and Advice cards',
      analyticsLockedTitle: 'Unlock Long-term History',
      analyticsLockedDesc: 'Upgrade to view mood trends and analytics',
      remaining: 'Remaining',
      used: 'Used',
      times: 'times'
    }
  },
  zh: {
    // ... existing translations ...
    common: {
      credits: '积分',
      save: '保存',
      confirm: '确认',
      finish: '完成',
      continue: '继续',
      loading: '加载中…',
      generating: '正在生成…',
      completed: '已完成',
      empty: '暂无数据',
      cancel: '取消',
      back: '返回',
      close: '关闭',
      settings: '设置',
      profile: '个人资料',
      billing: '订阅与额度',
      logout: '退出登录',
      deleteAccount: '删除账户',
      menu: '菜单',
      upgrade: '升级',
      upgradePro: '升级至深度版',
      upgradeDesc: '升级以解锁全部功能',
      recentChats: '最近对话',
      subscription: '订阅管理',
      free: '免费版',
      manageSubscription: '管理订阅',
      proMember: '深度版会员',
      freeAccount: '免费账户',
      accountSettings: '账户设置',
      userGuide: '使用指南',
      privacyPolicy: '隐私政策',
      helpSupport: '帮助与支持',
      proPlanActive: '您的深度版计划已激活。',
      upgradeUnlock: '升级以解锁全部功能',
      error: '出错了',
      failed: '失败了',
      search: '搜索',
      email: '邮箱',
      password: '密码',
      username: '用户名',
      dangerZone: '危险区域',
      verified: '已验证',
      currentPassword: '当前密码',
      newPassword: '新密码',
      nextBilling: '下次扣费日期',
      active: '生效中',
      plan: '当前版本',
      security: '账号与安全',
      accountAndPlan: '个人资料',
      twoFactor: '双重认证',
      twoFactorDesc: '开启双重认证以增加账户安全性。',
      enableTwoFactor: '开启双重认证',
    },
    menu: {
      chat: '新建对话',
      history: '历史记录',
      firstAid: '情绪急救',
      sketch: '内视涂鸦',
      test: '内视快测',
      mood: '情绪追踪',
    },
    settings: {
      title: '账户设置',
      description: '管理您的个人资料、偏好设置与安全选项。',
      account: '账户',
      notifications: '通知设置',
      name: '姓名',
      username: '用户名',
      language: '语言',
      emailNotifs: '邮件通知',
      emailNotifsDesc: '接收每日摘要。',
      pushNotifs: '推送通知',
      pushNotifsDesc: '接收实时提醒。',
    },
    chat: {
      placeholder: '输入您的消息...',
      initialMessage: "你好。我是 zeneme，你的情感伴侣。你现在感觉如何？",
      aiResponse: "我听到了。听起来你现在背负着很多。能多告诉我一点是什么触发了这些情绪吗？",
      dataCollection: '数据收集',
      messagesCount: '条对话',
      dataReady: '数据就绪',
      analyzing: '分析中...',
      generateReport: '生成报告',
      tooltips: {
        sendImage: '发送图片',
        voiceInput: '语音输入',
        innerGallery: '内视画廊',
        innerSketchpad: '内视涂鸦'
      }
    },
    firstAid: {
      title: '情绪急救',
      subtitle: "在这里你是安全的。如果你感到不知所措、焦虑或恐慌，我们可以帮你重新找回平静。",
      startBreathing: '开始呼吸练习',
      groundingExercise: '着陆练习',
      stopExercise: '停止练习',
      breathingTitle: '箱式呼吸法',
      breathingDesc: '跟随圆圈调节呼吸',
      inhale: '吸气...',
      hold: '保持...',
      exhale: '呼气...',
      groundingTitle: '5-4-3-2-1 技术',
      groundingItems: [
        "5 种你能看到的东西",
        "4 种你能触摸的东西",
        "3 种你能听到的声音",
        "2 种你能闻到的气味",
        "1 种你能尝到的味道"
      ]
    },
    mood: {
      title: '情绪追踪',
      subtitle: '你今天感觉如何？',
      logMood: '记录心情',
      notePlaceholder: '添加关于今天的笔记...',
      recentLogs: '最近记录',
      days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      emptyTitle: '还没有情绪记录',
      emptyDesc: '每天花 1 分钟记录心情，慢慢会看到规律',
      addFirstLog: '添加第一条记录',
      moods: {
        Happy: '开心',
        Calm: '平静',
        Anxious: '焦虑',
        Sad: '悲伤',
        Overwhelmed: '不知所措',
        Neutral: '中性',
        Angry: '愤怒',
        Relieved: '宽慰',
        Confused: '困惑',
        Tired: '疲惫',
        Grateful: '感激'
      }
    },
    sketch: {
      title: '内视涂鸦',
      subtitle: '把此刻的感受画出来，不需要画得好看。',
      analyze: '开始分析',
      analyzing: '正在分析你的涂鸦...',
      clear: '清空画布',
      save: '保存到本次记录',
      share: '发送给 zeneme',
      returnToChat: '返回对话',
      steps: {
        scanning: '正在扫描线条...',
        interpreting: '正在解读模式...',
        generating: '正在生成洞察...'
      },
      resultTitle: 'zeneme 分析',
      mockResult: "你的画作显示出能量线条与开放空间的平衡。左上角的圆周运动暗示着对连接的渴望，而下方的结构化线条表明你正在为思绪建立稳定的基础。你可能正感受到创造性的兴奋与对秩序需求的混合。"
    },
    test: {
      title: '内视快测',
      subtitle: '进行快速评估以了解你的情绪状态。',
      start: '开始测评',
      resultTitle: '你的情绪状态',
      retake: '重新测试',
      saveReport: '保存报告',
      summary: '分析总结',
      stressLevel: '压力指数',
      primaryEmotion: '核心情绪',
      low: '低',
      peaceful: '平静',
      question: '问题',
      duration: '5-8 分钟',
      scientific: '科学分析',
      options: ['非常不同意', '不同意', '一般', '同意', '非常同意'],
      labels: {
        stability: '稳定性',
        selfAwareness: '自我觉察',
        resilience: '韧性',
        optimism: '乐观度',
        social: '社交力',
        focus: '专注力'
      },
      summaryText: '你表现出较强的稳定性和乐观度。这表明你能很好地应对日常压力，并保持积极的心态。然而，你的专注力得分表明你最近可能经历了一些分心或精神杂乱。',
      questions: [
        "当感到压力时，我很容易让自己平静下来。",
        "我经常感到被情���淹没。",
        "我可以清楚地辨别我现在的感受。",
        "我倾向于对小决定过度思考。",
        "我对未来感到乐观。"
      ]
    },
    history: {
      title: '历史记录',
      subtitle: '你的历史分析报告',
      emptyTitle: '还没有历史记录',
      emptyDesc: '完成一次体验后，这里会自动保存你的对话与报告',
      startSession: '开始一次体验',
      selectReport: '选择一份报告以查看详情',
      filters: {
        all: '全部',
        firstAid: '情绪急救',
        sketch: '内视涂鸦',
        test: '内视快测',
        mood: '情绪追踪'
      },
      types: {
        lite: '基础版报告',
        pro: '深度版报告'
      }
    },
    breathing: {
      stepLabel: '步骤 1: 呼吸',
      title: '箱式呼吸法',
      description: '跟随圆圈调节呼吸。圆圈扩大时吸气，保持，收缩时呼气。',
      mute: '静音',
      soundOn: '开启声音',
      continueButton: '继续',
      skipButton: '跳过',
      inhale: '吸气',
      hold: '保持',
      exhale: '呼气'
    },
    emotion: {
      stepLabel: '步骤 2: 命名',
      title: '命名你的情绪',
      description: '识别你现在的感受。命名情绪是平复情绪的第一步。',
      saveAndExit: '保存并退出',
      emotions: ['焦虑', '悲伤', '愤怒', '开心', '宽慰', '困惑', '疲惫', '感激']
    },
    help: {
      title: '帮助与支持',
      subtitle: 'zeneme 使用说明',
      items: [
        {
          trigger: '如何使用内视涂鸦',
          content: '内视涂鸦是 zeneme 中用来帮助你看见情绪的一种方式。你可以通过简单的绘画和提示，觉察当下的感受。这里没有对错，也不需要画得好看。只要如实表达，就已经足够。'
        },
        {
          trigger: '我不会画画，可以使用吗？',
          content: '可以。内视涂鸦关注的是情绪表达，而不是绘画技巧。随手几笔同样有意义。'
        },
        {
          trigger: '内视涂鸦中的引导是做什么的？',
          content: '引导的作用是帮助你整理思路，让你更容易看见自己的情绪和需要。'
        },
        {
          trigger: '我可以中途停止吗？',
          content: '可以。如果感到不适或不想继续，你可以随时暂停或退出。'
        },
        {
          trigger: '我的内容会被保存吗？',
          content: 'zeneme 会保护你的隐私。你的内容仅用于你的个人体验，不会被公开。'
        },
        {
          trigger: '遇到问题怎么办？',
          content: '如果在使用中遇到问题或有反馈，可以通过应用内的支���渠道联系我们。'
        }
      ]
    },
    userGuide: {
      title: '使用指南',
      subtitle: 'zeneme 基础功能说明',
      sections: [
        {
          title: '什么是 zeneme',
          content: 'zeneme 是一个帮助你觉察情绪、整理内在体验的空间。你可以通过对话、涂鸦和记录，更温和地理解自己当下的状态。'
        },
        {
          title: '如何开始一次对话',
          content: '进入主界面后，你可以直接输入你此刻的感受或困扰。不需要组织语言，如实表达即可。'
        },
        {
          title: '什么是内视涂鸦',
          content: '内视涂鸦是一种通过简单绘画来表达情绪的方式。重点不在于画得好，而在于让情绪被看见。'
        },
        {
          title: '关于记录与报告',
          content: '在使用过程中，zeneme 会帮助你整理你的表达，生成仅属于你的个人记录，用于你更好地理解自己。'
        },
        {
          title: '使用建议',
          list: [
            '在相对安静、安全的环境中使用',
            '按照自己的节奏进行',
            '任何时候都可以暂停或结束'
          ]
        }
      ]
    },
    privacy: {
      title: '隐私政策',
      subtitle: '我们如何保护你的信息',
      sections: [
        {
          title: '我们重视你的隐私',
          content: 'zeneme 非常重视你的隐私与数据安全。你的信任对我们至关重要。'
        },
        {
          title: '信息的使用',
          content: '你在 zeneme 中产生的内容，仅用于为你提供功能体验，'
        }
      ]
    },
    modals: {
      logoutTitle: '确认退出登录？',
      logoutDesc: '退出后你仍可随时重新登录',
      deleteTitle: '确认删除账户？',
      deleteDesc: '删除后你的数据将无法恢复，请谨慎操作',
      limitTitle: '次数不足',
      limitDesc: '当前版本可用次数已用完，升级后可继续使用',
      later: '稍后再说',
      toUpgrade: '去升级'
    },
    upgrade: {
      title: '升级至深度版',
      subtitle: '解锁更完整的报告与长期情绪回顾',
      freePlan: '免费版',
      proPlan: '深度版',
      price: '30元 / 月',
      autoRenew: '按月自动续费，可随时取消',
      freeFeatures: [
        '5次完整体验',
        '生成基础版报告',
        '对话与报告可回看'
      ],
      proFeatures: [
        '无限次完整体验',
        '生成深度版报告（含内在角色、建议）',
        '解锁情绪与使用轨迹总览'
      ],
      cancel: '取消',
      subscribe: '立即开通',
      confirmTitle: '确认订阅',
      planLabel: '套餐',
      priceLabel: '价格',
      renewLabel: '续费说明',
      terms: '我已阅读并同意《服务条款》和《隐私政策》',
      termsError: '请先同意条款与政策',
      processing: '正在处理支付…',
      failedTitle: '支付未完成',
      failedDesc: '未收到支付结果，请重试或稍后再试',
      retry: '重新支付',
      successTitle: '已开通深度版',
      successDesc: '你现在可以生成深度版报告，并查看情绪与使用轨迹总览',
      unlockReport: '立即解锁报告',
      continueSession: '继续本次体验',
      viewBenefits: '去查看权益',
      alreadyProTitle: '你已开通深度版',
      alreadyProDesc: '你的订阅正在生效中。',
      manageTitle: '管理订阅',
      cancelAutoRenew: '取消自动续费',
      restore: '恢复订阅',
      confirmCancelTitle: '确认取消自动续费？',
      confirmCancelDesc: '取消后你仍可使用至当前周期结束',
      cancelSuccess: '已取消自动续费，将在本周期结束后恢复为免费版',
      lockedTitle: '深度内容已锁定',
      lockedDesc: '开通深度版后可查看内在角色卡片与建议卡片',
      analyticsLockedTitle: '解锁长期情绪回顾',
      analyticsLockedDesc: '开通深度版后可查看情绪波动、常见标签与使用频率统计',
      remaining: '剩余',
      used: '已用',
      times: '次'
    }
  }
};
