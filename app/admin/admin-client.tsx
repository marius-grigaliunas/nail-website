"use client";

import { useState } from "react";
import { AdminShell } from "./_components/admin-shell";
import { AdminSidebar } from "./_components/admin-sidebar";
import { LoginForm } from "./_components/login-form";
import { useAdminSession } from "./_hooks/use-admin-session";
import { AdminUploadForm } from "./admin-upload-form";

export function AdminClient() {
  const session = useAdminSession();
  const [adminPanel, setAdminPanel] = useState<"home" | "upload">("home");

  async function handleLogout() {
    await session.logout();
    setAdminPanel("home");
  }

  if (session.auth === "signed-in") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] flex-1 items-start">
        <AdminSidebar
          adminPanel={adminPanel}
          onUploadClick={() => setAdminPanel("upload")}
          onLogoutClick={() => void handleLogout()}
          submitting={session.submitting}
        />
        <AdminShell
          adminPanel={adminPanel}
          serverGate={session.serverGate}
          uploadView={<AdminUploadForm />}
        />
      </div>
    );
  }

  return (
    <LoginForm
      email={session.email}
      password={session.password}
      error={session.error}
      bootstrapError={session.bootstrapError}
      sessionCheck={session.sessionCheck}
      submitting={session.submitting}
      onEmailChange={session.setEmail}
      onPasswordChange={session.setPassword}
      onSubmit={session.login}
    />
  );
}
