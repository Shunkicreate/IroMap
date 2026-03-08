"use client";

import {
  BarChart3,
  Copy,
  Cuboid,
  FileBarChart2,
  ScanLine,
  Sparkles,
  SwatchBook,
} from "lucide-react";
import { toast } from "sonner";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const featureCards = [
  {
    icon: Cuboid,
    title: "RGB Cube",
    description: "Three.jsベースで色空間を回転操作しながら確認。",
  },
  {
    icon: ScanLine,
    title: "Slice View",
    description: "任意軸の断面を2D表示し、変化の連続性を把握。",
  },
  {
    icon: SwatchBook,
    title: "Inspector & Copy",
    description: "選択色をRGB/HEX/HSLで確認し、即コピー。",
  },
  {
    icon: BarChart3,
    title: "Photo Analysis",
    description: "Lab散布図・Hue/Saturationヒストグラム・面積比を統合表示。",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-8 sm:px-8 sm:py-12">
      <header className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              <Sparkles className="size-3.5" />
              Photo Color Analyzer
            </p>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:max-w-2xl">
              Understand the color structure of your photos
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              IroMap
              は、色分布と面積比を定量化して、写真の印象を説明可能にするための分析ワークベンチです。
            </p>
          </div>
          <div className="flex gap-2 self-start">
            <ThemeToggle />
            <Button onClick={() => toast.success("Spec / Design / Tasks を更新してください")}>
              Open Tasks
            </Button>
          </div>
        </div>
      </header>

      <main className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workbench Preview</CardTitle>
            <CardDescription>
              分析UIのベースコンポーネントをshadcn/ui + Radixで統一。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">Image Source</p>
                <Input placeholder="Drop image or paste URL" />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Color Space</p>
                <Select defaultValue="srgb">
                  <SelectTrigger>
                    <SelectValue placeholder="Select color space" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="srgb">sRGB</SelectItem>
                    <SelectItem value="display-p3">Display P3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs defaultValue="cube" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto">
                <TabsTrigger value="cube">RGB Cube</TabsTrigger>
                <TabsTrigger value="slice">Slice</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="cube" className="mt-4">
                <div className="grid gap-3">
                  <Skeleton className="h-52 w-full rounded-xl" />
                  <p className="text-sm text-muted-foreground">3D描画エリア（将来実装）</p>
                </div>
              </TabsContent>
              <TabsContent value="slice" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Skeleton className="h-40 w-full rounded-xl" />
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              </TabsContent>
              <TabsContent value="analysis" className="mt-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </div>
              </TabsContent>
            </Tabs>

            <Separator />

            <div className="flex flex-wrap gap-3">
              <Button>Analyze</Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => toast("HEX copied", { description: "#4A7EFF" })}
                    >
                      <Copy className="size-4" />
                      Copy Sample
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>カラーコピー機能のUIトークン確認</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {featureCards.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="size-4 text-primary" />
                  {item.title}
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileBarChart2 className="size-4 text-primary" />
                Documentation
              </CardTitle>
              <CardDescription>仕様と設計は docs 配下で管理。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <a
                className="block underline decoration-muted-foreground/50 underline-offset-4"
                href="/../docs/specs"
                target="_blank"
                rel="noreferrer"
              >
                docs/specs/
              </a>
              <a
                className="block underline decoration-muted-foreground/50 underline-offset-4"
                href="/../docs/architecture"
                target="_blank"
                rel="noreferrer"
              >
                docs/architecture/
              </a>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
