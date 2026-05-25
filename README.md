# 桌面记事本

一个 Windows 桌面悬浮备忘录小工具，使用 React、Vite 和 Electron 构建。

## 功能

- 代办事项和完成事项分区
- 本地保存备忘录数据
- 星级重要程度，并按星级排序
- 完成事项时播放金币提示音
- 多套配色皮肤，可本地保存选择
- 无边框悬浮窗，始终置顶
- 支持拖动窗口
- 拖到屏幕边缘后自动收起，只保留小把手
- 从边缘小把手拖出后恢复完整窗口

## 开发

```powershell
npm install
npm run build
npm run dist
```

快速启动版会生成在：

```text
release/win-unpacked/桌面备忘录.exe
```

注意：`win-unpacked` 目录里的 exe 需要和同目录文件一起保留，不能只单独拷贝 exe。
