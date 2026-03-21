# Bugfix Requirements Document

## Introduction

在历史记录（HistoryReports）页面中，点击非涂鸦类型的心理报告（type !== 'sketch'）时，应用会导航到 InnerQuickTest 组件（`setCurrentView('test')`），而不是像涂鸦报告一样在当前页面内显示内联详情视图。这导致用户体验不一致，且脱离了历史记录的上下文。

涂鸦报告已经正确实现了内联详情视图模式（使用 `viewingSketch` 状态），非涂鸦报告应遵循相同的模式：在历史记录页面内展示报告详情，包含返回按钮、报告数据（维度分数、分析文本）和下载选项。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user clicks a non-sketch report (type === 'comprehensive' or other non-sketch type) in the history list THEN the system navigates away to the InnerQuickTest component by calling `setViewingReportId(report.id)` and `setCurrentView('test')`, leaving the history page context

1.2 WHEN a user is viewing a non-sketch report via the InnerQuickTest navigation THEN the system does not provide a "返回历史记录" back button to return to the history list, breaking the navigation flow

### Expected Behavior (Correct)

2.1 WHEN a user clicks a non-sketch report (type === 'comprehensive' or other non-sketch type) in the history list THEN the system SHALL display an inline detail view within the HistoryReports component (similar to the sketch detail view pattern), showing the report title, date, mind indices/dimension scores, preview/analysis text, and a download button (if `has_file` is true)

2.2 WHEN a user is viewing a non-sketch report inline detail view THEN the system SHALL display a "返回历史记录" back button that returns the user to the history report list without navigating to a different view

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user clicks a sketch report (type === 'sketch') in the history list THEN the system SHALL CONTINUE TO display the inline sketch detail view with the sketch image, AI analysis text, and "返回历史记录" back button

3.2 WHEN a user clicks the "返回历史记录" button in the sketch detail view THEN the system SHALL CONTINUE TO return to the history report list by clearing the `viewingSketch` state

3.3 WHEN a user clicks the download button on a report with `has_file === true` THEN the system SHALL CONTINUE TO download the psychology report file via `downloadPsychologyReport`

3.4 WHEN the user is a guest (status === 'guest') THEN the system SHALL CONTINUE TO show the login gate instead of the report list

3.5 WHEN the history list is loading or empty THEN the system SHALL CONTINUE TO show the loading skeleton or empty state respectively
