"use client";

import * as React from "react";
import * as Panels from "react-resizable-panels";
import { GripVertical } from "lucide-react";
import { cn } from "./utils";

type PanelLikeProps = {
  children?: React.ReactNode;
  className?: string;
} & Record<string, unknown>;

type PanelLikeComponent = React.ComponentType<PanelLikeProps>;

/**
 * 兼容：某些情况下 TS 看到的 react-resizable-panels 导出不包含 PanelGroup/PanelResizeHandle
 * （通常是类型解析/版本锁/编辑器缓存导致）。
 * - 若能取到真实组件 -> 正常可拖拽 resize（不影响你原逻辑）
 * - 取不到 -> 使用 div 兜底，但 DOM 结构/className 都保持（不改变页面设计）
 */
function getComponent(name: string): PanelLikeComponent {
  const mod = Panels as unknown as Record<string, unknown>;

  const fromNamed = mod[name];
  const fromDefault =
    typeof mod.default === "object" && mod.default !== null
      ? (mod.default as Record<string, unknown>)[name]
      : undefined;

  const impl = fromNamed ?? fromDefault;

  if (typeof impl === "function") return impl as PanelLikeComponent;

  // ✅ 兜底：避免 createElement 重载对 unknown children 报错
  const Fallback: PanelLikeComponent = ({ children, ...rest }) => {
    return <div {...(rest as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>;
  };

  return Fallback;
}

const PanelGroupImpl = getComponent("PanelGroup");
const PanelImpl = getComponent("Panel");
const PanelResizeHandleImpl = getComponent("PanelResizeHandle");

const ResizablePanelGroup = ({ className, ...props }: PanelLikeProps) => (
  <PanelGroupImpl
    className={cn("flex h-full w-full data-[panel-group-direction=vertical]:flex-col", className)}
    {...props}
  />
);

const ResizablePanel = ({ className, ...props }: PanelLikeProps) => (
  <PanelImpl className={cn("h-full w-full", className)} {...props} />
);

const ResizableHandle = ({
  className,
  withHandle = false,
  ...props
}: PanelLikeProps & { withHandle?: boolean }) => (
  <PanelResizeHandleImpl
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-x-0 data-[panel-group-direction=vertical]:after:-translate-y-1/2",
      className,
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-background">
        <GripVertical className="h-3 w-3" />
      </div>
    )}
  </PanelResizeHandleImpl>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
