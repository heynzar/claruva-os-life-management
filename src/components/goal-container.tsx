import type React from "react";
interface GoalContainerProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export default function GoalContainer({
  title,
  subtitle,
  children,
}: GoalContainerProps) {
  return (
    <section className="w-full h-full bg-muted/40 flex flex-col">
      <h2 className="flex flex-col m-4">
        <span className="text-muted-foreground text-sm">{subtitle}</span>
        <span className="text-2xl font-medium uppercase">{title}</span>
      </h2>
      <ul className="w-full flex flex-col h-full border-t border-muted">
        {children}
      </ul>
    </section>
  );
}
