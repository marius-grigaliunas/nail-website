"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminShell } from "./_components/admin-shell";
import { AdminSidebar } from "./_components/admin-sidebar";
import { LoginForm } from "./_components/login-form";
import { useAdminSession } from "./_hooks/use-admin-session";
import { AdminGallery } from "./admin-gallery";
import { AdminUploadForm } from "./admin-upload-form";

function parseAdminPanel(panel: string | null): "home" | "upload" | "gallery" {
  if (panel === "upload") return "upload";
  if (panel === "gallery") return "gallery";
  return "home";
}

export function AdminClient() {
  const session = useAdminSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminPanel = parseAdminPanel(searchParams.get("panel"));

  if (session.auth === "signed-in") {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] w-full flex-1 items-start">
        <AdminSidebar
          adminPanel={adminPanel}
          onUploadClick={() => router.push("/admin?panel=upload")}
          onGalleryClick={() => router.push("/admin?panel=gallery")}
          onLogoutClick={() => void session.logout()}
          submitting={session.submitting}
        />
        <AdminShell
          adminPanel={adminPanel}
          serverGate={session.serverGate}
          uploadView={<AdminUploadForm />}
          galleryView={<AdminGallery />}
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
