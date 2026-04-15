import { lazy } from "react";
import { Route, Routes } from "react-router-dom";

import { MainLayout } from "@/components/layout/main-layout";
import { Toaster } from "@/components/ui/sonner";

import { HomePage } from "@/pages/home-page";
import { LibraryPage } from "@/pages/library-page";
import { LoginPage } from "@/pages/login-page";
import { NotificationsPage } from "@/pages/notifications-page";
import { PostPage } from "@/pages/post-page";
import { ProfilePage } from "@/pages/profile-page";
import { PublicationPage } from "@/pages/publication-page";
import { RegisterPage } from "@/pages/register-page";
import { SearchPage } from "@/pages/search-page";
import { TagPage } from "@/pages/tag-page";

const WritePage = lazy(() =>
  import("@/pages/write-page").then((m) => ({ default: m.WritePage })),
);
const PublicationSettingsPage = lazy(() =>
  import("@/pages/publication-settings-page").then((m) => ({
    default: m.PublicationSettingsPage,
  })),
);

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="p/:username/:slug" element={<PostPage />} />
          <Route path="u/:username" element={<ProfilePage />} />
          <Route path="tag/:slug" element={<TagPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="me" element={<LibraryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route
            path="pub/:slug/settings"
            element={<PublicationSettingsPage />}
          />
          <Route path="pub/:slug" element={<PublicationPage />} />
          <Route path="write" element={<WritePage />} />
          <Route path="write/:postId" element={<WritePage />} />
        </Route>
      </Routes>
      <Toaster richColors position="top-center" />
    </>
  );
}
