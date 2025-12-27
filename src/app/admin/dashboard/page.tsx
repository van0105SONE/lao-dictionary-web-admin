"use client";

import { BookOpen, CheckCircle, Users, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEffect, useState } from "react";
import { Statistic, Word } from "@/types";

export default function Dashboard() {
  const [stats, setStats] = useState<any[]>([
    {
      label: "Total Words",
      value: "0",
      icon: BookOpen,
    },
    {
      label: "Correct/Incorrect",
      value: "0",
      icon: CheckCircle,
    },
    { label: "Active Users", value: "0", icon: Users },
    {
      label: "Examples Added",
      value: "0",
      icon: TrendingUp,
    },
  ]);

  const [recentWord, setRecentWord] = useState<Word[]>([]);

  const loadData = async () => {
    const res = await fetch(`/api/admin/report`);
    const resWord = await fetch(`/api/admin/recently-word`);

    if (!resWord.ok) throw new Error("failed to fetch word");
    const wordData = await resWord.json();
    setRecentWord(wordData.words)
    if (!res.ok) throw new Error("Failed to fetch");
    const data: Statistic = await res.json();
    setStats([
      {
        label: "Total Words",
        value: data.total_word,
        icon: BookOpen,
      },
      {
        label: "Correct/Incorrect",
        value: data.total_incorrect,
        icon: CheckCircle,
      },
      { label: "Active Users", value: data.total_active_user, icon: Users },
      {
        label: "Examples Added",
        value: data.total_example,
        icon: TrendingUp,
      },
    ]);
  };

  useEffect(() => {
    loadData();
  }, []);
  return (
    <AdminLayout>
      <PageHeader
        title="Dashboard"
        description="Overview of your dictionary management system"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-6 shadow-card border border-border animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-primary mt-2">{stat.trend}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center">
                  <Icon className="w-6 h-6 text-accent-foreground" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div
        className="bg-card rounded-xl shadow-card border border-border animate-fade-in"
        style={{ animationDelay: "400ms" }}
      >
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h2>
        </div>
        <div className="divide-y divide-border">
          {recentWord.map((word, index) => (
            <div
              key={index}
              className="p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">
                    <span className="font-medium">{word.word}</span>{" "}
                    <span className="text-primary">{word.meaning}</span>
                  </p>
      
                </div>
                <span className="text-xs text-muted-foreground">
                  {/* {new Date(word.createdAt).toISOString()} */}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
