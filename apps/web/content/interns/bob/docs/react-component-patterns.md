---
title: React 组件设计模式笔记
slug: react-component-patterns
date: 2026-06-25
updated: 2026-07-03
tags: [React, 组件设计, TypeScript, 前端]
---

## 概述

记录在开发 InternWiki 组件库时用到的 React 组件设计模式，包括复合组件、受控与非受控、Render Props 等。

## 复合组件模式

复合组件让多个组件协同工作，共享隐式状态，同时保持各自的灵活性。

```tsx
// Card 组件族
function Card({ children }: { children: React.ReactNode }) {
  return <div className="lo-card">{children}</div>
}

Card.Header = function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="border-b border-border p-4">{children}</div>
}

Card.Body = function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="p-4">{children}</div>
}

// 使用
<Card>
  <Card.Header>标题</Card.Header>
  <Card.Body>内容</Card.Body>
</Card>
```

## 受控与非受控

支持两种模式，让组件既能被外部完全控制，也能独立运行。

```tsx
interface InputProps {
  value?: string          // 受控
  defaultValue?: string   // 非受控
  onChange?: (v: string) => void
}

function Input({ value, defaultValue, onChange }: InputProps) {
  const isControlled = value !== undefined
  // ...
}
```

## 使用 cn() 工具合并样式

```tsx
import { cn } from '@/lib/utils'

function Button({ className, variant, ...props }) {
  return (
    <button
      className={cn(
        'rounded-md px-3 py-1.5 text-sm',
        variant === 'primary' && 'bg-primary text-primary-foreground',
        variant === 'ghost' && 'hover:bg-muted',
        className  // 允许外部覆盖
      )}
      {...props}
    />
  )
}
```
