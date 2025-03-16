"use client";
import { useAuthStore } from "@/store/Auth";
import React, { FormEvent, useState } from "react";

export default function Login() {
  const { login } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // collect data
    const formData = new FormData();
    const email = formData.get("email");
    const password = formData.get("password");

    // validation
    if (!email || !password) {
      setError(() => "Please fill out all the fields");
      return;
    }

    setLoading(() => true);
    setError(() => "");

    const loginResponse = await login(email.toString(), password.toString());
    if (loginResponse.error) {
      setError(() => loginResponse.error!.message);
    }

    setLoading(() => false);
  };
}
