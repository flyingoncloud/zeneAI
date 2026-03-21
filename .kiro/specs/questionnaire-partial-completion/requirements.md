# 需求文档：问卷部分完成与分段报告

## 简介

本功能旨在提升心理问卷的完成率，分两个阶段实施。Phase 1（方案 C）允许用户在回答一定数量的问题后提前退出并获取基于已答题目的部分报告。Phase 2（方案 A）将问卷按五大心理维度分段组织，每完成一个维度即可生成该维度的迷你报告，用户可选择继续或停止。两个阶段均复用现有的 `current_question_index` 进度追踪和 resume 机制。

## 术语表

- **Questionnaire_Service**: 负责问卷进度管理、答案保存和状态追踪的系统组件
- **Report_Service**: 负责生成心理评估报告（完整报告和部分报告）的系统组件
- **Scoring_Service**: 负责按维度计算分数和归一化处理的系统组件
- **Partial_Report**: 基于用户已回答问题生成的不完整评估报告，明确标注数据不完整
- **Dimension_Report**: 针对单个心理维度生成的迷你报告/摘要
- **Minimum_Answer_Threshold**: 允许生成部分报告所需的最少已答题数（默认 5 题）
- **Dimension_Section**: 按心理维度组织的问卷分段，每段包含 5-8 道题目
- **Five_Dimensions**: 五大心理维度，包括情绪调节能力（emotional_regulation）、认知灵活度（cognitive_flexibility）、关系敏感度（relationship_sensitivity）、内在冲突度（internal_conflict）、成长潜能（growth_potential）
- **Early_Exit_Button**: 问卷界面中的"先看结果"按钮，允许用户提前退出获取部分报告
- **Quiz_Component**: 前端问卷组件（InnerQuickTest），负责展示问题和收集答案

## 需求

### 需求 1：提前退出按钮显示（Phase 1）

**User Story:** 作为用户，我希望在回答足够多的问题后看到"先看结果"按钮，以便我可以选择提前退出获取部分报告。

#### 验收标准

1. WHILE 用户已回答的题目数量少于 Minimum_Answer_Threshold，THE Quiz_Component SHALL 隐藏 Early_Exit_Button
2. WHEN 用户已回答的题目数量达到 Minimum_Answer_Threshold，THE Quiz_Component SHALL 显示 Early_Exit_Button，按钮文案为"先看结果"
3. THE Quiz_Component SHALL 在 Early_Exit_Button 旁显示当前已完成题目数和总题目数（例如"已完成 8/30 题"）
4. WHEN 用户点击 Early_Exit_Button，THE Quiz_Component SHALL 显示确认对话框，提示用户部分报告基于不完整数据
5. THE Questionnaire_Service SHALL 支持通过配置设置 Minimum_Answer_Threshold 的值，默认值为 5

### 需求 2：部分完成状态管理（Phase 1）

**User Story:** 作为用户，我希望提前退出后系统正确记录我的进度状态，以便我可以查看部分报告或稍后继续答题。

#### 验收标准

1. WHEN 用户确认提前退出，THE Questionnaire_Service SHALL 将进度状态更新为 "partial_completed"
2. WHEN 进度状态为 "partial_completed"，THE Questionnaire_Service SHALL 保留所有已回答的答案和 category_scores
3. WHEN 用户选择继续答题，THE Questionnaire_Service SHALL 从 current_question_index 恢复问卷进度
4. WHEN 进度状态为 "partial_completed" 且用户重新进入问卷，THE Quiz_Component SHALL 提供"继续答题"和"查看部分报告"两个选项
5. WHEN 用户完成所有剩余题目后，THE Questionnaire_Service SHALL 将状态从 "partial_completed" 更新为 "completed"

### 需求 3：部分报告生成（Phase 1）

**User Story:** 作为用户，我希望基于已回答的问题获得一份部分心理评估报告，以便我可以初步了解自己的心理状态。

#### 验收标准

1. WHEN 用户确认提前退出且已答题数达到 Minimum_Answer_Threshold，THE Report_Service SHALL 生成 Partial_Report
2. THE Scoring_Service SHALL 仅基于已回答的题目计算各维度分数，使用已答题目的最大可能分数作为归一化分母
3. IF 某个维度没有任何已回答的题目，THEN THE Scoring_Service SHALL 将该维度标记为"数据不足"而非显示 0 分
4. THE Partial_Report SHALL 在报告顶部明确标注"此报告基于部分回答（已完成 X/Y 题），结果仅供参考"
5. THE Partial_Report SHALL 对每个维度标注数据完整度百分比（该维度已答题数/该维度总题数）
6. THE Report_Service SHALL 将 Partial_Report 的 report_type 设置为 "partial" 以区别于完整报告
7. WHEN 用户后续完成所有题目，THE Report_Service SHALL 生成新的完整报告替代 Partial_Report

### 需求 4：部分报告展示（Phase 1）

**User Story:** 作为用户，我希望部分报告清晰地展示哪些维度有数据、哪些维度数据不足，以便我理解报告的局限性。

#### 验收标准

1. THE Quiz_Component SHALL 在部分报告页面顶部显示醒目的提示横幅，说明报告基于不完整数据
2. WHEN 某维度数据完整度低于 50%，THE Quiz_Component SHALL 将该维度的分数显示为灰色并标注"数据不足，建议继续答题"
3. THE Quiz_Component SHALL 在部分报告页面提供"继续答题"按钮，引导用户完成剩余题目
4. THE Quiz_Component SHALL 在部分报告页面提供"下载部分报告"按钮
5. WHEN 部分报告的雷达图中某维度数据不足，THE Quiz_Component SHALL 使用虚线而非实线绘制该维度的连线

### 需求 5：问卷按维度分段组织（Phase 2）

**User Story:** 作为用户，我希望问卷按心理维度分段呈现，以便我可以一个维度一个维度地完成评估。

#### 验收标准

1. THE Questionnaire_Service SHALL 将问卷题目按 Five_Dimensions 分为 5 个 Dimension_Section
2. THE Questionnaire_Service SHALL 按照以下顺序组织 Dimension_Section：情绪调节能力、认知灵活度、关系敏感度、内在冲突度、成长潜能
3. WHEN 问卷以分段模式加载，THE Quiz_Component SHALL 显示当前维度名称和维度进度（例如"维度 1/5：情绪调节能力"）
4. THE Quiz_Component SHALL 在每个 Dimension_Section 开始前显示该维度的简要介绍
5. WHEN 用户开始新的 Dimension_Section，THE Questionnaire_Service SHALL 记录当前维度的起始 question_index

### 需求 6：维度完成与迷你报告（Phase 2）

**User Story:** 作为用户，我希望每完成一个维度就能看到该维度的评估结果，以便我获得即时反馈并决定是否继续。

#### 验收标准

1. WHEN 用户完成一个 Dimension_Section 的所有题目，THE Scoring_Service SHALL 计算该维度的归一化分数（0-100）
2. WHEN 维度分数计算完成，THE Report_Service SHALL 生成该维度的 Dimension_Report
3. THE Dimension_Report SHALL 包含：维度名称、归一化分数、分数对应的阶段描述、简要分析文本
4. WHEN Dimension_Report 生成完成，THE Quiz_Component SHALL 展示该维度的迷你报告页面
5. THE Quiz_Component SHALL 在迷你报告页面提供"继续下一维度"和"暂时停止"两个按钮
6. WHEN 用户选择"暂时停止"，THE Questionnaire_Service SHALL 将进度状态更新为 "partial_completed" 并保存当前进度

### 需求 7：分段问卷的恢复机制（Phase 2）

**User Story:** 作为用户，我希望可以随时恢复之前中断的分段问卷，以便我可以从上次停止的维度继续。

#### 验收标准

1. WHEN 用户重新进入分段问卷且存在 "partial_completed" 状态的进度，THE Quiz_Component SHALL 显示已完成维度的摘要列表
2. THE Quiz_Component SHALL 在摘要列表中为每个已完成的维度显示分数和状态标记（✓ 已完成）
3. WHEN 用户选择继续，THE Questionnaire_Service SHALL 从下一个未完成的 Dimension_Section 开始恢复
4. THE Questionnaire_Service SHALL 利用现有的 current_question_index 确定恢复位置
5. WHEN 所有 5 个 Dimension_Section 完成，THE Questionnaire_Service SHALL 将状态更新为 "completed" 并触发完整报告生成

### 需求 8：部分评分逻辑（Phase 1 & Phase 2 共用）

**User Story:** 作为系统，我需要支持基于部分数据的维度评分计算，以便为部分报告和维度迷你报告提供准确的分数。

#### 验收标准

1. THE Scoring_Service SHALL 仅使用已回答题目计算维度原始分数（已答题目得分之和）
2. THE Scoring_Service SHALL 仅使用已回答题目的最大可能分数作为归一化分母（而非全部题目的最大可能分数）
3. THE Scoring_Service SHALL 为每个维度返回以下数据：原始分数、归一化分数（0-100）、已答题数、该维度总题数、数据完整度百分比
4. IF 某维度已答题数为 0，THEN THE Scoring_Service SHALL 返回该维度分数为 null 并标记为"无数据"
5. THE Scoring_Service SHALL 跳过 template 为 F7 的题目（方向盘题，发送 0-360 度数据，非评分题）
6. THE Scoring_Service SHALL 对 template 为 F6 的排序题应用现有的排名转分数逻辑（rank 1→5, rank 2→3, rank 3→1）

### 需求 9：API 端点扩展

**User Story:** 作为前端应用，我需要新的 API 端点来支持提前退出和分段问卷功能。

#### 验收标准

1. THE Questionnaire_Service SHALL 提供 POST /api/questionnaire/early-exit 端点，接受 progress_id 参数
2. WHEN early-exit 端点被调用，THE Questionnaire_Service SHALL 验证已答题数达到 Minimum_Answer_Threshold
3. IF 已答题数未达到 Minimum_Answer_Threshold，THEN THE Questionnaire_Service SHALL 返回错误信息，说明需要至少回答 N 道题
4. THE Report_Service SHALL 提供 GET /api/questionnaire/dimension-report/{progress_id}/{dimension} 端点，返回指定维度的迷你报告
5. THE Questionnaire_Service SHALL 提供 GET /api/questionnaire/sections/{questionnaire_id} 端点，返回按维度分段的题目结构
6. THE Questionnaire_Service SHALL 在现有的 save-answer 响应中增加 current_section 和 section_completed 字段

### 需求 10：错误处理与边界情况

**User Story:** 作为系统，我需要妥善处理部分完成流程中的各种边界情况，以确保系统稳定性。

#### 验收标准

1. IF 用户在确认提前退出后网络中断，THEN THE Questionnaire_Service SHALL 在下次请求时重试状态更新
2. IF 部分报告生成失败，THEN THE Report_Service SHALL 返回错误信息并保持进度状态为 "in_progress"（而非 "partial_completed"）
3. WHEN 管理员在后台修改了问卷题目，THE Questionnaire_Service SHALL 检测题目变更并在用户恢复时提示"问卷已更新"
4. IF 用户已有 "partial_completed" 状态的进度记录且再次请求提前退出，THEN THE Report_Service SHALL 基于最新答案重新生成 Partial_Report
5. THE Questionnaire_Service SHALL 在 progress 记录的 to_dict() 中包含 partial_report_id 字段（如有）
