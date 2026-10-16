"use client";

import {
  DownloadIcon,
  FilePlusIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  UploadIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isPlan, usePlanStore } from "@/lib/store";

export function Toolbar() {
  const fileInput = useRef<HTMLInputElement>(null);
  const { resolvedTheme, setTheme } = useTheme();
  const clear = usePlanStore((s) => s.clear);
  const exportPlan = usePlanStore((s) => s.exportPlan);
  const importPlan = usePlanStore((s) => s.importPlan);

  const download = () => {
    const blob = new Blob([JSON.stringify(exportPlan(), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "anno-plan.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  const upload = async (file: File) => {
    try {
      const plan: unknown = JSON.parse(await file.text());
      if (!isPlan(plan)) throw new Error("Not an Anno Modeler plan");
      importPlan(plan);
      toast.success(`Imported ${plan.nodes.length} nodes`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Import failed");
    }
  };

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" aria-label="Menu" />}
        >
          <MenuIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-48">
          <DropdownMenuItem
            onClick={() => {
              if (confirm("Discard the current plan?")) clear();
            }}
          >
            <FilePlusIcon /> New plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => fileInput.current?.click()}>
            <UploadIcon /> Import JSON…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={download}>
            <DownloadIcon /> Export JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <h1 className="font-heading font-semibold">Anno 1800 Modeler</h1>
      <span className="text-muted-foreground text-xs">Old World</span>
      <Button
        variant="ghost"
        size="icon"
        className="ml-auto"
        aria-label="Toggle theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {resolvedTheme === "dark" ? <SunIcon /> : <MoonIcon />}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />
    </header>
  );
}
