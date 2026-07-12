# SYNC — 将 workspace 版邮箱修改同步到运行版

- [ ] 1. 在 team_chat_main.py 中添加 DELETE /api/plugins/team_chat/email/{tab}/{email_id} 路由（含 inbox/sent 移入回收站）
- [ ] 2. 在 team_chat_main.py 中添加 POST /api/plugins/team_chat/email/trash/{email_id}/restore 恢复路由
- [ ] 3. 修复 email-management-v2.js 的 API_BASE 从 18888 改为相对路径 + 修复 Promise 链语法
- [ ] 4. 验证前端删除按钮在 email-management-v2.js 中的作用（已有但可能在 dist/index.js 中）
- [ ] 5. 检查 dist/index.js 中的邮箱部分是否需要同步