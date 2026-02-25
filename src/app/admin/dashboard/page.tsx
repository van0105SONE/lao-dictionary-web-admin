"use client";

import { BookOpen, CheckCircle, Users, TrendingUp } from "lucide-react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEffect, useState } from "react";
import { Statistic, Word } from "@/types";

const STAT_ICONS = [BookOpen, CheckCircle, Users, TrendingUp];
const STAT_LABELS = ["Total Words", "Correct/Incorrect", "Active Users", "Examples Added"];

function StatSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-3 w-24 bg-muted rounded" />
          <div className="h-8 w-16 bg-muted rounded" />
          <div className="h-2 w-20 bg-muted rounded" />
        </div>
        <div className="w-12 h-12 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="p-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-2 w-20 bg-muted rounded" />
        </div>
        <div className="h-2 w-16 bg-muted rounded" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<
    { label: string; value: string | number; icon: typeof BookOpen }[]
  >([]);
  const [recentWord, setRecentWord] = useState<Word[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch both APIs in parallel — no sequential waterfall
      const [res, resWord] = await Promise.all([
        fetch(`/api/admin/report`),
        fetch(`/api/admin/recently-word`),
      ]);

      if (!res.ok) throw new Error("Failed to fetch report");
      if (!resWord.ok) throw new Error("Failed to fetch words");

      const [data, wordData]: [Statistic, { words: Word[] }] = await Promise.all([
        res.json(),
        resWord.json(),
      ]);

      setRecentWord(wordData.words);
      setStats([
        { label: "Total Words", value: data.total_word, icon: BookOpen },
        { label: "Correct/Incorrect", value: data.total_incorrect, icon: CheckCircle },
        { label: "Active Users", value: data.total_active_user, icon: Users },
        { label: "Examples Added", value: data.total_example, icon: TrendingUp },
      ]);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
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
        {loading
          ? STAT_LABELS.map((label) => <StatSkeleton key={label} />)
          : stats.map((stat, index) => {
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
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <ActivitySkeleton key={i} />
              ))
            : recentWord.map((word, index) => (
                <div
                  key={index}
                  className="p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">{word.word}</span>{" "}
                      <span className="text-primary">{word.pronunciation}</span>
                    </p>
                  </div>
                </div>
              ))}
          {!loading && recentWord.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No recent activity
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
