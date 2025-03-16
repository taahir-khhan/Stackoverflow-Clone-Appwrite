"use client";
import { useAuthStore } from "@/store/Auth";
import React, { FormEvent, useState } from "react";

export default function Register() {
  const { login, createAccount } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // collect data
    const formData = new FormData(e.currentTarget);
    const firstname = formData.get("firstname");
    const lastname = formData.get("lastname");
    const email = formData.get("email");
    const password = formData.get("password");

    // validation
    if (!firstname || !lastname || !email || !password) {
      setError(() => "Please fill out all the fields");
      return;
    }

    setLoading(() => true);
    setError(() => "");

    // create user account => from zustand store
    const response = await createAccount(
      `${firstname} ${lastname}`,
      email.toString(),
      password.toString()
    );

    // If some error occured while creating account handle them
    if (response.error) {
      setError(() => response.error!.message);
    } else {
      const loginResponse = await login(email.toString(), password.toString());

      if (loginResponse.error) {
        setError(() => loginResponse.error!.message);
      }
    }

    setLoading(() => false);
  };
}
