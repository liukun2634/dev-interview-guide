# 参与贡献

欢迎一起完善程序员面试手册。概念纠错、代码修正和阅读体验改进都很有价值。

## 反馈问题

通过 [提交 Issue](https://github.com/liukun2634/dev-interview-guide/issues/new) 反馈问题，请提供相关页面链接、问题描述和建议的修正方向。代码或页面显示问题请附上必要的复现步骤与环境信息。

## 提交改进

欢迎通过 [Pull Request](https://github.com/liukun2634/dev-interview-guide/compare) 贡献以下内容：

- 补充新的面试主题或完善现有文章。
- 修正概念表述、代码示例或失效链接。
- 增加高频追问、对比表和典型易错点。
- 优化文档结构和阅读体验。

建议一次 PR 聚焦一个主题，说明修改原因、涉及页面和验证结果，并保持与相邻章节一致的写作风格。

## 本地检查

在仓库根目录运行：

```bash
npm install
npm run docs:check:source
npm run docs:check
```

`docs:check:source` 检查文档内部链接与锚点；`docs:check` 运行 AI 示例检查、生产构建、SEO 回归与生成页面检查。修改代码示例时，还需针对示例本身验证运行结果。

## 内容与许可

涉及版本差异、性能数据或能力边界时，请提供可核验来源，不将假设或演示数据写成实测结果。

引用外部文字、代码或图片时，请注明来源并遵守其许可。项目许可证见 [CC BY-SA 4.0](./LICENSE)，第三方内容保留各自的许可声明。