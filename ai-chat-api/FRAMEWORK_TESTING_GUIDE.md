# Multi-Framework Psychology Detection Testing Guide

This guide shows you how to test each psychology framework in real conversations by using specific language patterns and topics that trigger their detection.

## 🧠 Framework Overview

The system detects 5 psychology frameworks:
- **IFS** (Internal Family Systems) - Parts work and Self energy
- **CBT** (Cognitive Behavioral Therapy) - Thought patterns and behaviors
- **Jungian Psychology** - Archetypes, dreams, and symbolic content
- **Narrative Therapy** - Externalization and re-authoring stories
- **Attachment Theory** - Relational patterns and emotional regulation

## 🎯 How to Test Each Framework

### 1. IFS (Internal Family Systems) Testing

**Key Phrases to Use:**
- "Part of me feels..."
- "There's a part that..."
- "Different parts of me react..."
- "My inner critic says..."
- "I have a protective part..."
- "When I'm in Self, I feel..."

**Example Conversation:**
```
User: "Part of me wants to take risks, but another part is terrified of failure"
User: "There's a part that tries to be perfect and control everything"
User: "I notice different parts of me show up in different situations"
```

**Expected Detection:** IFS framework with parts like "manager", "firefighter", "exile"

---

### 2. CBT (Cognitive Behavioral Therapy) Testing

**Key Phrases to Use:**
- "I always think..."
- "Everything is either... or..."
- "I should/must/have to..."
- "What if... (catastrophizing)"
- "I can't do anything right"
- "This always happens to me"

**Example Conversation:**
```
User: "I always think the worst case scenario will happen"
User: "Everything is either perfect or a complete disaster"
User: "I should be perfect at everything I do"
User: "What if I fail and everyone thinks I'm incompetent?"
```

**Expected Detection:** CBT framework with cognitive distortions like "catastrophizing", "all_or_nothing", "should_statements"

---

### 3. Jungian Psychology Testing

**Key Phrases to Use:**
- "I had a dream about..."
- "This reminds me of a myth/story..."
- "I feel like the hero/victim/wise old man..."
- "There's something archetypal about..."
- "I'm going through a transformation..."
- "Shadow aspects of myself..."

**Example Conversation:**
```
User: "I had a dream about being chased by a dark figure"
User: "I feel like I'm on a hero's journey, facing challenges to grow"
User: "There's a wise old woman in my dreams who gives me advice"
User: "I'm confronting the shadow aspects of my personality"
```

**Expected Detection:** Jungian framework with archetypes like "hero", "shadow", "wise_old_man"

---

### 4. Narrative Therapy Testing

**Key Phrases to Use:**
- "The problem is..."
- "Depression/anxiety tells me..."
- "I want to rewrite my story..."
- "There was a time when..."
- "I'm not just my problems..."
- "What would my preferred story be?"

**Example Conversation:**
```
User: "Depression tells me I'm worthless, but I know that's not the whole story"
User: "I want to rewrite the narrative about my career failures"
User: "There was a time when I felt confident and capable"
User: "The anxiety tries to convince me I can't handle challenges"
```

**Expected Detection:** Narrative framework with "externalization", "preferred_identity", "unique_outcome"

---

### 5. Attachment Theory Testing

**Key Phrases to Use:**
- "I'm anxious in relationships..."
- "I worry about being abandoned..."
- "I have trouble trusting..."
- "I get clingy when..."
- "I avoid getting too close..."
- "My childhood relationships were..."

**Example Conversation:**
```
User: "I'm always anxious in relationships and worry about being abandoned"
User: "I have trouble trusting people and get clingy when I feel insecure"
User: "I tend to avoid getting too close because I might get hurt"
User: "My childhood relationships taught me that people leave"
```

**Expected Detection:** Attachment framework with styles like "anxious", "avoidant", "disorganized"

---

## 🔧 Testing Steps

### Step 1: Start the API Server
```bash
cd ai-chat-api
python run.py
```

### Step 2: Create a New Conversation
Send a POST request to create a new conversation:
```bash
curl -X POST http://localhost:5000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{"title": "Framework Testing"}'
```

### Step 3: Send Test Messages
Use the conversation ID to send messages that trigger specific frameworks:
```bash
curl -X POST http://localhost:5000/api/conversations/{conversation_id}/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Part of me wants to take risks, but another part is terrified of failure"}'
```

### Step 4: Check Framework Detection
Look for the psychology analysis in the response. The system will show:
- Which frameworks were detected
- Confidence scores for each framework
- Specific elements found (parts, distortions, archetypes, etc.)

---

## 🎨 Advanced Testing Scenarios

### Multi-Framework Conversations
Try combining patterns from multiple frameworks:
```
User: "Part of me (IFS) always thinks the worst will happen (CBT), especially in relationships where I worry about abandonment (Attachment)"
```

### Progressive Framework Emergence
Start with one framework and gradually introduce others:
1. Begin with CBT patterns
2. Add IFS language about parts
3. Introduce attachment concerns
4. Include narrative externalization

### Framework Switching
Test how the system handles when the dominant framework changes:
1. Start strong with Jungian dream content
2. Shift to CBT catastrophizing
3. Move to IFS parts work

---

## 📊 Monitoring Framework Detection

### Check Analysis Intervals
Each framework has different analysis intervals:
- **CBT**: Every 2 messages
- **IFS**: Every 3 messages  
- **Attachment**: Every 3 messages
- **Narrative**: Every 3 messages
- **Jungian**: Every 4 messages

### Confidence Thresholds
Frameworks need minimum confidence to influence AI responses:
- **Minimum**: 0.3 confidence
- **Good**: 0.6+ confidence
- **Strong**: 0.8+ confidence

### Framework Prioritization
The system prioritizes frameworks by:
1. **Confidence score** (highest first)
2. **Number of elements detected**
3. **Recency of detection**

---

## 🚀 Quick Test Commands

Here are some ready-to-use test messages for each framework:

### IFS Test Messages:
```bash
# Message 1
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "Part of me wants to be vulnerable, but my protective part won't let me"}'

# Message 2  
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I notice different parts of me show up in different situations"}'
```

### CBT Test Messages:
```bash
# Message 1
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I always think the worst case scenario will happen"}'

# Message 2
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "Everything is either perfect or a complete disaster"}'
```

### Jungian Test Messages:
```bash
# Message 1
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I had a dream about being chased by a dark shadow figure"}'

# Message 2
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I feel like I'm on a hero's journey, facing challenges to transform myself"}'
```

### Narrative Test Messages:
```bash
# Message 1
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "Depression tells me I'm worthless, but I want to rewrite that story"}'

# Message 2
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "There was a time when I felt confident and capable"}'
```

### Attachment Test Messages:
```bash
# Message 1
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I'm always anxious in relationships and worry about being abandoned"}'

# Message 2
curl -X POST http://localhost:5000/api/conversations/{id}/messages -H "Content-Type: application/json" -d '{"content": "I have trouble trusting people and get clingy when I feel insecure"}'
```

---

## 🎯 Expected AI Response Changes

When frameworks are detected, you should see the AI responses change to incorporate therapeutic insights:

### IFS-Informed Response:
- Acknowledges different parts
- Speaks to Self energy
- Validates internal complexity

### CBT-Informed Response:
- Gently challenges cognitive distortions
- Focuses on thought patterns
- Suggests behavioral observations

### Jungian-Informed Response:
- Honors symbolic content
- References archetypal themes
- Supports individuation process

### Narrative-Informed Response:
- Supports externalization of problems
- Encourages re-authoring
- Highlights unique outcomes

### Attachment-Informed Response:
- Focuses on relational dynamics
- Validates attachment needs
- Addresses emotional regulation

---

## 🔍 Troubleshooting

### Framework Not Detected?
1. **Check message count**: Ensure you've sent enough messages for the framework's analysis interval
2. **Use stronger patterns**: Include more specific keywords and phrases
3. **Check confidence**: Framework might be detected but below threshold (0.3)

### Wrong Framework Prioritized?
1. **Confidence scores**: The highest confidence framework takes priority
2. **Multiple detections**: System shows all detected frameworks in context
3. **Pattern strength**: Use more specific language for your target framework

### No Psychology Context?
1. **Enable detection**: Check `PSYCHOLOGY_DETECTION_ENABLED=true` in settings
2. **Framework registration**: Ensure all frameworks are properly registered
3. **API integration**: Verify psychology analysis is passed to AI response

---

## 📈 Success Metrics

You'll know the system is working when:
- ✅ Framework detection appears in API responses
- ✅ AI responses change based on detected frameworks
- ✅ Psychology context is generated and prioritized by confidence
- ✅ Multiple frameworks can be detected simultaneously
- ✅ Framework-specific therapeutic language appears in responses

Happy testing! 🚀