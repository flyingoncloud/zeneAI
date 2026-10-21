// 中文文案。
// 英文在 copy.en.ts，两边结构必须一样（copy.ts 里用 typeof 卡住）。

export const zh = {
  global: {
    productName: "生涯探索沙盘",
    spriteName: "伴你小精灵",
    spritePersona: "陪伴者，不评判、不下结论",
    disclaimer: "本内容为体验性观察，不构成医学或心理诊断建议",
    reportDisclaimer: "AI 分析为体验性内容，不构成医学或心理诊断建议",
  },

  // 小精灵话术。创作阶段小精灵不出声，所以没有创作期的台词。
  mobileGate: {
    title: "沙盘要在电脑上玩哦",
    body: "手机屏幕太小，摆沙具、挖沙都不好操作。换到电脑或平板上打开这个网址，我在那边等你。手机上可以先看看你之前的沙盘和觉察卡。",
    history: "看看我的心灵花园",
    home: "回首页",
  },
  sprite: {
    hello: "嗨，我是伴你小精灵，接下来这段时间我陪着你。",
    waiting: "正在看你的沙盘…",
    report: "这是我看到的，不一定全对，你说了算。",
  },

  onboarding: {
    cards: [
      {
        title: "这是一个沙盘",
        body: "你可以按心之所想，摆出你的世界。随便摆，没有对错。",
        image: "/design/onboarding/what.webp",
      },
      {
        title: "摆完，看看这个",
        body: "不是结论，而是观察——帮你发现方向，不替你下判断。",
        image: "/design/onboarding/report.webp",
        // 最后一屏的示例觉察卡，视觉与报告页的真卡一致（components/report/SampleCard）
        sample: {
          no: "021",
          badge: "我的沙盘觉察卡",
          title: "安静的造园人",
          line: "你把每一件都轻轻放好，还留出了彼此呼吸的空隙。",
          skillsLabel: "你身上的小本事",
          skills: ["在吵闹里找回自己的节奏", "先把复杂的事排排坐"],
          foot: "示例。真正的那一张，由你自己的这一盘生成。",
        },
      },
    ],
    skip: "跳过",
    next: "下一步",
    start: "开始",
  },

  prepare: {
    title: "准备好开始了吗？",
    subtitle: "这里没有任务，只有你和你的感受。准备好了，我们就开始。",
    start: "准备好了，开始",
    exit: "暂时不方便，下次再来",
    exitReply: "好的，等你方便的时候再来，我一直在这里。",
    // 小精灵的开场白，覆盖「这是什么」和「怎么玩」
    intro: "这是一个沙盘，你可以按心之所想，摆出你的世界，随便摆，没有对错。摆完，你会拿到一张这样的觉察卡——不是结论，而是观察，帮你发现方向，不替你下判断。",
    // 入口按钮用「历史」，比「心灵花园」更像可点的入口；页面标题仍是「心灵花园」
    history: "历史",
  },

  meditation: {
    title: "冥想引导",
    // 右上角「⋯」菜单里的条目
    skip: "跳过，直接进沙盘",
    hint: "跟随呼吸静心，准备好了随时点「开始」",
    start: "开始",
    next: "继续",
    // 静心准备文案，对应三个进度点
    steps: [
      "这里没有对错，也没有应该。双脚平放在地上，做三次轻松的呼吸。",
      "吸气时，知道自己在吸气；呼气时，让肩膀沉下来。",
      "接下来你放下的每一个沙具、停顿的每一刻，都会被记录下来——不是评判，而是为了拼出一幅更贴近你自己的图景。",
    ],
  },

  // 工具栏、背景音乐控件与 aria-label；曲目名在 src/content/audio.ts
  ui: {
    back: "返回",
    home: "首页",
    signIn: "登录",
    signOut: "退出",
    loading: "加载中…",
    figureCount: (n: number) => `${n}个沙具`,
    size: "大小",
    angle: "角度",
    height: "高度",
    onGround: "贴地",
    brush: "笔刷",
    force: "力度",
    topTwo: "最突出的两项",
    notFound: "没有找到这份记录",
    errNoRecord: "记录不存在",
    errEmptyTray: "这个沙盘还没有摆放沙具",
    errTooOften: "生成得太频繁了，过一会儿再试",
    noReport: "这个沙盘还没有生成分析",
    loginNote: "演示用的登录，正式版接站点账号",
    more: "更多",
    generating: "生成中…",
    tools: { orbit: "转视角", dig: "挖坑", mound: "堆沙", smooth: "抹平", undo: "撤销", reset: "重置" },
    toolHints: {
      dig: "挖坑：按住拖动",
      mound: "堆沙：按住拖动",
      smooth: "抹平：按住拖动",
      orbit: "转视角：拖动旋转沙盘",
      locked: "视角已固定",
      off: "已收起笔刷",
      undo: "已撤销",
      reset: "已重置沙盘",
      soundOn: "沙水声已打开",
      soundOff: "沙水声已关闭",
    },
    handles: { move: "拖动移动", rotate: "拖动旋转", lift: "上下拖动调高度" },
    toolsOpen: "展开工具",
    toolsClose: "收起工具",
    loginTagline: "遇见更好的自己",
    loginPlaceholder: "例如：小知",
  },

  music: {
    title: "背景音乐",
    label: "背景音乐",
    off: "关闭",
    volume: "音量",
    playing: "正在播放",
    failed: "这首没能播放，换一首试试",
  },

  sandtray: {
    title: "沙盘",
    preparing: "正在铺沙子，马上就好",
    noGl: {
      title: "沙盘的画面没能显示出来",
      hint: "浏览器的图形加速可能关掉了。Chrome 里打开「设置 › 系统」，开启「使用图形加速功能」后重启浏览器；也可以换 Edge 或 Safari 试试。",
      reload: "重新加载",
    },
    placeHint: "点一下沙盘就放下它，也可以直接把卡片拖进沙盘",
    autoSave: "自动保存",
    // 顺序与 figures.ts 的分类一一对应
    categories: ["人物", "动物", "建筑", "工具", "自然"],
    // 不暗示沙具数量的上下限，由用户自己决定什么时候停
    empty: "看着它，留意它带给你的第一感觉。第一眼想拿的，就拿。",
    done: "完成创作",
    showNames: "显示名字",
    hideNames: "隐藏名字",
    history: "历史",
    sound: "沙水声",
    // 创作过程中小精灵不出声，只在长时间没动作时做视觉陪伴
    idle: {
      soft: "我还在这里陪着你。",
      title: "我还在这里。选一个你舒服的方式就好。",
      stay: "继续",
      draft: "暂存",
      draftReply: "好的，已存到草稿箱。",
      music: "音乐",
      musicReply: "好，音量可以随时调。",
      musicPending: "背景音乐还没接入（需要有授权的音频素材）",
    },
    // 显存不足时 WebGL 上下文会丢失，画面变黑。浏览器通常能自行恢复，
    // 恢复不了就给一条退路
    lost: {
      title: "画面渲染中断了",
      hint: "手机内存不够时会这样。摆好的沙具没丢，重新加载就能接着来。",
      reload: "重新加载",
    },
    // 中途返回时的确认
    leave: {
      title: "要先离开吗？这次的摆放会保存草稿",
      stay: "继续摆",
      leave: "离开",
    },
  },

  save: {
    title: "给这个沙盘起个名字",
    subtitle: "建议起个名字，方便以后回看这次的心情",
    placeholder: "例如：静谧的海岸线…",
    storyLabel: "这个世界发生了什么？（可选）",
    storyPlaceholder: "说说你看到的…也可以跳过",
    skip: "跳过",
    submit: "保存",
    defaultName: "未命名沙盘",
  },

  confirm: {
    title: "请选一个此刻最想探索的方向",
    later: "以后再分析",
    submit: "生成AI分析",
    // 四个方向取自设计稿
    directions: [
      { id: "self", text: "你到底是个什么样的人？", tag: "自我认识" },
      { id: "career", text: "我到底适合什么工作？", tag: "事业发展" },
      { id: "future", text: "我未来应该往哪里走？", tag: "人生方向" },
      { id: "free", text: "随便聊聊，没有特定问题", tag: "自由探索" },
    ],
  },

  report: {
    title: "AI 观察报告",
    snapshot: { title: "沙盘快照", note: "自动记录你摆好的画面" },
    radar: {
      title: "兴趣雷达",
      // 霍兰德六型标签，不显示分数
      labels: { R: "R实际", I: "I调研", A: "A艺术", S: "S社会", E: "E企业", C: "C常规" },
    },
    observation: {
      title: "AI 观察",
      careers: "职业倾向",
      study: "向学业方向的解读",
      note: "描述性呈现，非诊断",
    },
    action: {
      title: "行动提示",
      quick: "一个可以马上试的小行动",
      think: "一个值得再想想的问题",
    },
    again: "再玩一次",
    badge: "我的沙盘觉察卡",
    seen: "我看到的",
    meaning: "对你意味着什么",
    next: "下一步可以试试",
    expert: {
      networkError: "发送失败，检查一下网络",
      sendError: "发送失败，稍后再试",
      title: "想听听专业人士怎么看？",
      body: "可以预约专业咨询师，和你一起细读这张觉察卡。",
      button: "发邮件预约解读",
      subject: "预约沙盘觉察卡解读",
      copied: "邮箱已经帮你复制好了，打开邮箱粘贴发过去就行。",
      formTitle: "预约专业解读",
      formBody: "留下名字和邮箱，咨询师会通过邮件联系你。",
      name: "你的名字",
      email: "你的邮箱",
      message: "想聊的内容（可选）",
      send: "发送预约",
      sending: "发送中…",
      sent: "收到啦，咨询师会通过邮件联系你。",
      fallback: "暂时没法直接发送，邮箱已帮你复制，用自己的邮箱发过去就好。",
    },
  },

  history: {
    title: "心灵花园",
    filters: ["全部", "已分析", "未分析", "收藏", "草稿"],
    status: { analyzed: "已分析", pending: "未分析", draft: "草稿" },
    actions: {
      view: "查看分析",
      viewShort: "查看",
      analyzeShort: "AI分析",
      analyze: "发起分析",
      edit: "重新编辑",
      resume: "继续编辑",
      remove: "删除",
    },
    // 删除不弹确认，删完给 5 秒撤销
    failed: "操作失败",
    removed: "已删除",
    undo: "撤销",
    empty: "还没有记录，去摆第一个沙盘吧",
  },
}
