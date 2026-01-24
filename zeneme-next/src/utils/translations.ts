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
      initialMessage: "你好。我是 zeneme,你的情感伴侣。你现在感觉如何?",
      aiResponse: "我听到了。听起来你现在背负着很多。能多告诉我一点是什么触发了这些情绪吗?",
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
      subtitle: "在这里你是安全的。如果你感到不知所措、焦虑或恐慌,我们可以帮你重新找回平静。",
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
      subtitle: '你今天感觉如何?',
      logMood: '记录心情',
      notePlaceholder: '添加关于今天的笔记...',
      recentLogs: '最近记录',
      days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
      emptyTitle: '还没有情绪记录',
      emptyDesc: '每天花 1 分钟记录心情,慢慢会看到规律',
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
      subtitle: '把此刻的感受画出来,不需要画得好看。',
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
      mockResult: "你的画作显示出能量线条与开放空间的平衡。左上角的圆周运动暗示着对连接的渴望,而下方的结构化线条表明你正在为思绪建立稳定的基础。你可能正感受到创造性的兴奋与对秩序需求的混合。"
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
      summaryText: '你表现出较强的稳定性和乐观度。这表明你能很好地应对日常压力,并保持积极的心态。然而,你的专注力得分表明你最近可能经历了一些分心或精神杂乱。',
      questions: [
        "当感到压力时,我很容易让自己平静下来。",
        "我经常感到被情绪淹没。",
        "我可以清楚地辨别我现在的感受。",
        "我倾向于对小决定过度思考。",
        "我对未来感到乐观。"
      ]
    },
    history: {
      title: '历史记录',
      subtitle: '你的历史分析报告',
      emptyTitle: '还没有历史记录',
      emptyDesc: '完成一次体验后,这里会自动保存你的对话与报告',
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
      description: '跟随圆圈调节呼吸。圆圈扩大时吸气,保持,收缩时呼气。',
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
          content: '内视涂鸦是 zeneme 中用来帮助你看见情绪的一种方式。你可以通过简单的绘画和提示,觉察当下的感受。这里没有对错,也不需要画得好看。只要如实表达,就已经足够。'
        },
        {
          trigger: '我不会画画,可以使用吗?',
          content: '可以。内视涂鸦关注的是情绪表达,而不是绘画技巧。随手几笔同样有意义。'
        },
        {
          trigger: '内视涂鸦中的引导是做什么的?',
          content: '引导的作用是帮助你整理思路,让你更容易看见自己的情绪和需要。'
        },
        {
          trigger: '我可以中途停止吗?',
          content: '可以。如果感到不适或不想继续,你可以随时暂停或退出。'
        },
        {
          trigger: '我的内容会被保存吗?',
          content: 'zeneme 会保护你的隐私。你的内容仅用于你的个人体验,不会被公开。'
        },
        {
          trigger: '遇到问题怎么办?',
          content: '如果在使用中遇到问题或有反馈,可以通过应用内的支付渠道联系我们。'
        }
      ]
    },
  userGuide: {
    title: '使用指南',
    subtitle: 'ZeneMe 基础功能说明',
    sections: [
     {
      title: '什么是 ZeneMe?',
      content:
        'ZeneMe 是一个实现“自我探索”的心灵空间,陪你看见情绪、照见内在。清晰的内视觉察报告会结构化地呈现你当下的自我认知状态,帮助你遇见更好的自己。'
      },
    {
      title: '如何获得专属内视觉察报告?',
      content:
        '你可以通过以下任意一种方式获得一份覆盖五个维度的专属内视觉察报告,帮助你更清楚地理解当下的状态与内在模式：\n' +
        '1)直接对话：像聊天一样说出你此刻的感受与困扰,ZeneMe 会在对话中自然引导你补充关键内容,让报告所需信息更完整。\n' +
        '2)内视快测：用 5-8 分钟完成一组全面、系统的问题,快速梳理核心维度,提交后立刻生成报告。'
    },
    {
      title: '如何开始一次对话?',
      content:
        '进入主界面后,从一个当下开始：把你此刻最强烈的感受写出来就好。你不必解释得清楚,ZeneMe 会陪你慢慢理顺。'
    },
    {
      title: '什么是「情绪急救」?',
      content:
        '当你情绪波动很大时,通过引导式呼吸训练帮助你快速从情绪漩涡中抽离,回到更清晰、更理性的状态,并支持记录当下情绪与强度。'
    },
    {
      title: '什么是「内视涂鸦」?',
      content:
        '用简单涂鸦把难以言说的感受呈现出来;重点不在画得好, 而在让情绪被看见。ZeneMe 会根据画面捕捉线索,并引导你继续向内探索。'
    },
    {
      title: '什么是「内视快测」?',
      content:
        '用 5-8 分钟快速梳理关键维度,完成后立刻生成专属报告,帮助你更具体地理解自己。'
    },
    {
      title: '关于记录与报告',
      content:
        '在使用过程中,ZeneMe 会整理并保存你的表达,形成个人历史记录,让每一次输入都能沉淀为可回看的内容。'
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
          title: '声明与适用范围',
          content: '（本文件由 AI 辅助生成，仅供参考，不构成法律意见；请在发布或使用前咨询合格律师/法务并进行必要修改。）\n\n生效日期：2026-01-16\n版本号：v1.0\n\n适用范围：本政策适用于你使用 ZeneMe（网站/应用/相关服务）时，我们对个人信息的处理方式。\n\n法律框架：我们遵循澳大利亚《Privacy Act 1988 (Cth)》及《Australian Privacy Principles（APPs）》管理个人信息。'
        },
        {
          title: '我们是谁（Who we are）',
          content: 'ZeneMe 由 [公司法定名称]（ABN：[____]） 运营（下称“我们”或“ZeneMe”）。如你对隐私有任何问题，请通过本政策末尾“联系我们”与我们联系。'
        },
        {
          title: '关键定义（Definitions）',
          content: '• 个人信息（Personal information）：可识别或可合理识别到个人身份的信息。\n• 敏感信息（Sensitive information）：包括健康信息、部分生物识别信息、宗教/政治观点等，受更高标准保护；ZeneMe 的对话与测评可能涉及你的健康/心理状态相关内容，因此通常属于敏感信息范畴。'
        },
        {
          title: '我们收集哪些信息（What we collect）',
          content: '我们可能收集以类别的信息（以实际使用功能为准）：\n\nA) 账号与联系信息\n• 邮箱/手机号、昵称、头像、登录凭证（如第三方登录标识）、账户设置等。\n\nB) 你在服务中产生或提交的内容\n• 对话内容（文本、你上传的图片/音频/文件等，如有）\n• 测评/问卷答案、你主动填写的情绪/状态记录\n• 你生成或查看的报告、收藏、标签、笔记等\n\nC) 使用与设备信息\n• 设备类型、操作系统、浏览器、应用版本、IP 地址、日志、崩溃信息、访问时间、页面/功能使用数据等（用于安全与体验优化）。\n\nD) 交易与付款信息\n• 订单号、订阅状态、支付状态等；银行卡信息通常由第三方支付机构直接处理，我们一般不保存完整卡号（以实际支付链路为准）。'
        },
        {
          title: '我们如何收集信息（How we collect）',
          content: '• 你直接提供：注册、填写、聊天、上传、联系客服时提供的信息。\n• 自动收集：当你使用服务时产生的日志与设备/使用信息。\n• 第三方提供：例如第三方登录/支付/分析服务商在你授权后提供的必要信息。'
        },
        {
          title: '我们为何使用信息（How we use information）',
          content: '我们仅在与业务功能相关且必要的范内使用你的信息，典型目的包括：\n\n提供与维持服务：创建账户、保存你的对话与历史、生成报告与建议、同步多端数据。\n\n个性化体验：根据你的偏好与历史记录优化呈现与引导。\n\n安全与风险控制：防止滥用、欺诈、攻击、内容安全审核与系统稳定性。\n\n客服与沟通：回应咨询、处理投诉、发送与服务相关的重要通知。\n\n合规义务：配合法律要求或监管机关合法请求。\n\n关于“训练/改进 AI”：\n• 默认情况下，我们使用你的对话内容来为你提供服务（例如生成你的报告）。\n• 若我们计划将可识别到你的内容用于模型训练/产品研究，我们会采用更严格做法：先去标识化/聚合；如仍需使用可识别内容，会另行征得你的确同意（opt-in）并提供退出机制。'
        },
        {
          title: '我们何时共享或披露信息（When we disclose information）',
          content: '除非本政策说明或你另行同意，我们不会向第三方出售你的个人信息。我们可能会在以下情形披露：\n• 服务提供商：云存储/托管、日志与分析、客服系统、AI 处理、支付与订阅管理等。我们会采取合理措施（合同条款、访问控制等）要求其仅按我们指示处理并保护数据。\n• 关联实体/重组：如发生并购���重组、资产转让，我们可能在法律允许下转移相关信息，并会求受让方继续遵守本政策或提供等同保护。\n• 法律要求：为遵守法律、法院命令、执法机关合法请求，或为保护用户与公众安全。\n• 紧急情形：在你或他人面临严重风险时，且法律允许的情况下，为防止或减少严重伤害而进行必要披露（我们会记录依据与范围）。'
        },
        {
          title: '跨境披露与存储（Overseas disclosure）',
          content: '我们可能使用位于澳大利亚境外的供应商/服务器（例如云服务或 AI 服务）。当个人信息可能被披露至海外时，我们将依据 APP 的跨境规则采取合理步骤，确保海外接收方提供可比的隐私保护，或在法律��许的情况下取得你的同意并向你说明相关风险。\n建议在此处列明主要数据可能流向的国家/地区（例如：Australia / United States / Singapore / EU 等），透明度更高、更不容易被质疑“信息不充分”。'
        },
        {
          title: '数据安全（Security）',
          content: '我们会采取合理的技术与组织措施保护你的信息，可能包括：\n• 传输加密（TLS）、存储加密（如适用）、访问控制与权限分级\n• 安全审计与监控、漏洞修复流程、最小化访问原则\n• 对敏感信息采用更高等级的控制与隔离（如适用）\n重要提示：任何系统都无法保证绝对安全；但我们会持续改进并在发生事件时按法律要求处理。'
        },
        {
          title: '保存期限与删除（Retention）',
          content: '• 登录后对话内容会被保存，用于让你持续使用历史记录与报告功能。\n• 我们仅在实现上述目的所需期间保留信息，或在法律/争议解决/合规要求下保留更长时间。\n• 当信息不再需要时，我们会采取合理步骤删除或去标识化。\n你可以申请注销账户或删除内容；我们会在核验身份后处理，但某些信息可能因法律或安全原因需要保留一段时间（例如审计日志、争议处理记录）。'
        },
        {
          title: '你的权利：访问与更正（Access & correction）',
          content: '你可以请求访问或更正我们持有的你的个人信息。我们的隐私政策将说明你如何提出访问/更正请求，这是 APP 的要求之一。\n\n流程（示例）：\n发送邮件至 zenet2026@gmail.com，说明你的请求与账户信息；\n我们会进行合理身份核验；\n在合理时间内答复；如无法满足请求，我们会说明原因与可用的申诉路径。'
        },
        {
          title: '投诉处理（Complaints）',
          content: '若你认为我们处理个人信息的方式不当，你可以：\n先通过 zenet2026@gmail.com 向我们投诉，我们会在合理时间内调查并回复；\n若你对结果不满意，你可向澳大利亚隐私监管机构 OAIC 提出投诉。'
        },
        {
          title: '数据泄露通报（Notifiable Data Breaches）',
          content: '若发生符合“可通报数据泄露（eligible data breach）”标准、且可能对个人造成严重伤害的事件，我们将按澳大利亚 NDB 机制通知受影响个人并通知 OAIC。'
        },
        {
          title: 'Cookie 与分析（Cookies & analytics）',
          content: '我们可能使用 cookie/SDK/类似技术来：\n• 维持登录与偏好设置\n• 统计访问与功能使用情况\n你可通过浏览器/系统设置限制 cookie 或重置广告标识符（可能影响部分功能）。'
        },
        {
          title: '儿童与未成年人（Children）',
          content: 'ZeneMe 不以儿童为主要服务对象。若我们发现未经监护人同意收集了未成年人的个人信息，我们将采取合理措施删除或停止处理。'
        },
        {
          title: '第三方链接（Third-party services）',
          content: '我们的服务可能包含第三方链接或集成。第三方的隐私实践不受本政策约束，请你阅读其隐私政策。'
        },
        {
          title: '政策更新（Updates）',
          content: '我们可��不时更新本政策。若更新涉及重大变更，我们会通过应用内提示/邮件等方式通知你。更新后的政策自发布之日起生效。'
        },
        {
          title: '联系我们（Contact）',
          content: '隐私负责人/团队：Privacy Officer\n邮箱：zenet2026@gmail.com'
        }
      ]
    },
    modals: {
      logoutTitle: '确认退出登录?',
      logoutDesc: '退出后你仍可随时重新登录',
      deleteTitle: '确认删除账户?',
      deleteDesc: '删除后你的数据将无法恢复,请谨慎操作',
      limitTitle: '次数不足',
      limitDesc: '当前版本可用次数已用完,升级后可继续使用',
      later: '稍后再说',
      toUpgrade: '去升级'
    },
    upgrade: {
      title: '升级至深度版',
      subtitle: '解锁更完整的报告与长期情绪回顾',
      freePlan: '免费版',
      proPlan: '深度版',
      price: '30元 / 月',
      autoRenew: '按月自动续费,可随时取消',
      freeFeatures: [
        '5次完整体验',
        '生成基础版报告',
        '对话与报告可回看'
      ],
      proFeatures: [
        '无限次完整体验',
        '生成深度版报告（含内在角色、建议)',
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
      failedDesc: '未收到支付结果,请重试或稍后再试',
      retry: '重新支付',
      successTitle: '已开通深度版',
      successDesc: '你现在可以生成深度版报告,并查看情绪与使用轨迹总览',
      unlockReport: '立即解锁报告',
      continueSession: '继续本次体验',
      viewBenefits: '去查看权益',
      alreadyProTitle: '你已开通深度版',
      alreadyProDesc: '你的订阅正在生效中。',
      manageTitle: '管理订阅',
      cancelAutoRenew: '取消自动续费',
      restore: '恢复订阅',
      confirmCancelTitle: '确认取消自动续费?',
      confirmCancelDesc: '取消后你仍可使用至当前周期结束',
      cancelSuccess: '已取消自动续费,将在本周期结束后恢复为免费版',
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
