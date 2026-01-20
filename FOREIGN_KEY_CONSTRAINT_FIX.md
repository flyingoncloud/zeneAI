# 外键约束修复 (Foreign Key Constraint Fix)

## 问题描述 (Problem Description)

用户在提交第4个问卷时遇到500错误：

```
insert or update on table "psychology_assessments" violates foreign key constraint "psychology_assessments_user_id_fkey"
DETAIL: Key (user_id)=(session_1768917717577_y7gp31wg8) is not present in table "user_profiles"
```

## 根本原因 (Root Cause)

`psychology_assessments` 表的 `user_id` 字段有外键约束，指向 `user_profiles.user_id`。

当使用 `session_id` 作为 `user_id` 的 fallback 时（因为 `conversation.user_id` 可能为 null），这个 session_id 在 `user_profiles` 表中不存在，导致外键约束违反。

### 数据库架构
```
user_profiles (user_id)
    ↓ (FK constraint)
psychology_assessments (user_id)
    ↓ (FK constraint)
psychology_reports (assessment_id)
```

## 修复方案 (Solution)

在创建 `PsychologyAssessment` 之前，先确保 `UserProfile` 存在。如果不存在，自动创建一个。

### 代码修改

**文件**: `ai-chat-api/src/api/app.py`

**位置**: 在创建 assessment 之前（约第 885 行）

**新增代码**:
```python
# Get user_id (use conversation.user_id or fallback to session_id)
user_id = conversation.user_id or conversation.session_id
logger.info(f"Using user_id: {user_id}")

# NEW: Ensure UserProfile exists for this user_id
from src.database.psychology_models import UserProfile

user_profile = db.query(UserProfile).filter(
    UserProfile.user_id == user_id
).first()

if not user_profile:
    # Create a user profile for this session/user
    user_profile = UserProfile(
        user_id=user_id,
        username=f"User_{user_id[:8]}",  # Generate a display name
        language_preference='zh'
    )
    db.add(user_profile)
    db.commit()
    db.refresh(user_profile)
    logger.info(f"Created UserProfile for user_id: {user_id}")

# Now safe to create assessment (foreign key constraint satisfied)
assessment = db.query(PsychologyAssessment).filter(
    PsychologyAssessment.user_id == user_id,
    PsychologyAssessment.assessment_type == 'questionnaire'
).order_by(PsychologyAssessment.created_at.desc()).first()
```

## 工作原理 (How It Works)

1. **获取 user_id**: 使用 `conversation.user_id` 或 fallback 到 `session_id`
2. **检查 UserProfile**: 查询 `user_profiles` 表是否存在该 user_id
3. **自动创建**: 如果不存在，创建一个新的 `UserProfile` 记录
4. **满足约束**: 现在可以安全地创建 `PsychologyAssessment`，因为外键约束已满足

## 测试步骤 (Testing Steps)

1. **重启后端**:
   ```bash
   cd ai-chat-api
   python run.py
   ```

2. **清除浏览器缓存并刷新前端**

3. **完整测试流程**:
   - 打开 Inner Quick Test 工具
   - 完成所有4个问卷
   - 提交最后一个问卷
   - 应该成功提交，不再出现500错误

4. **验证数据库**:
   ```sql
   -- 检查 user_profiles 表（应该有新记录）
   SELECT id, user_id, username, created_at
   FROM user_profiles
   WHERE user_id LIKE 'session_%'
   ORDER BY created_at DESC LIMIT 5;

   -- 检查 psychology_assessments 表
   SELECT id, user_id, assessment_type, is_complete
   FROM psychology_assessments
   ORDER BY created_at DESC LIMIT 1;
   ```

## 预期结果 (Expected Results)

- ✅ 不再出现外键约束违反错误
- ✅ `UserProfile` 自动创建（如果不存在）
- ✅ `PsychologyAssessment` 成功创建
- ✅ 报告生成成功触发
- ✅ 完整流程正常工作

## 相关修复 (Related Fixes)

此修复是系列修复的一部分：

1. **Frontend 导入修复**: 添加 `getPsychologyReportStatus` 和 `downloadPsychologyReport` 导入
2. **Backend user_id fallback**: 在创建 report 时使用 `user_id` 而不是 `conversation.user_id`
3. **UserProfile 自动创建** (本修复): 确保外键约束满足

## 注意事项 (Notes)

1. **外键完整性**: 这个修复确保了数据库的引用完整性
2. **自动化**: 系统会自动为新的 session_id 创建 UserProfile
3. **向后兼容**: 对已有的 user_id 不影响，只处理新的 session_id
4. **性能**: 只在需要时创建 UserProfile，不会重复创建

## 下一步 (Next Steps)

修复完成后，用户应该能够：
1. 顺利完成所有4个问卷
2. 系统自动处理 UserProfile 创建
3. 看到报告生成进度
4. 下载完整的 DOCX 心理报告

如果仍有问题，请检查后端日志获取详细错误信息。
