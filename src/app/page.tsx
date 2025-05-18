"use client";
import { useAuth } from "@/context/AuthContext";
import Login from "@/components/auth/Login";
import List from "@/components/list/List";

export default function HomePage() {
  const { loggedIn } = useAuth();
  return loggedIn ? <List /> : <Login />;
}