// src/app/(auth)/login/page.tsx
"use client";

import { BookOpen, Mail, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast"; // Adjust path if needed
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Important! Sends & receives cookies
      });

      const data = await res.json();
      console.log("result: ", data);
      if (res.ok && data.success) {
        toast({
          title: "Welcome back!",
          description: "You've been logged in successfully.",
        });
        router.push("/admin/dashboard");
      } else {
        toast({
          title: "Login failed",
          description: data.error || "Please check your credentials",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-sky shadow-soft mb-6">
              <BookOpen className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to manage Our lao dictionary
            </p>
          </div>

          {/* Form uses formAction instead of onSubmit */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email" // Important: name attributes for FormData
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password" // Important
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-10 h-12"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={false}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-8">
            ທົດລອງໃຊ້ລະບົບຈັດເກັບຄຳສັບພາສາລາວ, ເພື່ອໃຫ້ການເຂົ້າເຖິ່ງພາສາລາວ ແລະ
            ຣຽນຮູ້ພາສາລາວຜ່ານໂລກ internet ສະດວກ ແລະ ງ່າຍຂື້ນ😊
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 gradient-sky items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md">
          <h2 className="text-4xl font-bold mb-4">ຄັ່ງລ່ວມຄຳສັບພາສາລາວ🌍</h2>
          <p className="text-lg opacity-90">
            ຄັງຄຳສັບພາສາລາວສ້າງຂຶ້ນມາໂດຍມີຈຸດປະສົ່ງເພື່ອໃຫ້ການເຂົ້າ ເຖິ່ງພາສາລາວ
            ແລະ ຮຽນຮູ້ພາສາລາວງ່າຍຂື້ນ.
            ຢາກເຊີນຊວນອາສາສະໝັກທຸກຄົນມາຮ່ວມຜູ້ບັນທຶກຂໍ້ມູນ ແລະ
            ເພີຍແພ່ຂໍ້ມູນພາສາລາວນຳກັນ,
            ເພື່ອຍົກລະດັບຄວາມດ້ານພາສາລາວຂອງຫນຸ່ມທີ່ນັບຫນ້ອຍຖອຍລົງ
          </p>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold">0+</div>
              <div className="text-sm opacity-80">ຄຳສັບ</div>
            </div>
            <div>
              <div className="text-4xl font-bold">0+</div>
              <div className="text-sm opacity-80">ຕົວຢ່າງປະໂຫຍກ</div>
            </div>
            <div>
              <div className="text-4xl font-bold">1</div>
              <div className="text-sm opacity-80">Contributor</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
