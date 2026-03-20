"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { updateUser, deleteUser } from "@/lib/api/user";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { ApiError } from "@/lib/api/client";
import {
  type AuthCredential,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser as deleteFirebaseUser,
} from "firebase/auth";
import { Modal } from "@/components/ui/modal";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [credentialPassword, setCredentialPassword] = useState("");
  const [credentialError, setCredentialError] = useState("");
  const credentialResolverRef = useRef<
    ((value: AuthCredential | null) => void) | null
  >(null);

  if (!user) return null;

  const promptForCredentials = (reason: "password" | "delete") => {
    setCredentialPassword("");
    setCredentialError("");
    setOpenModal(true);

    return new Promise<AuthCredential | null>((resolve) => {
      credentialResolverRef.current = resolve;
    });
  };

  const closeCredentialModal = () => {
    setOpenModal(false);
    setCredentialPassword("");
    setCredentialError("");
  };

  const handleCredentialCancel = () => {
    credentialResolverRef.current?.(null);
    credentialResolverRef.current = null;
    closeCredentialModal();
  };

  const handleCredentialConfirm = () => {
    const currentEmail = auth.currentUser?.email || user.email;

    if (!credentialPassword.trim()) {
      setCredentialError("Current password is required");
      return;
    }

    const credential = EmailAuthProvider.credential(
      currentEmail,
      credentialPassword,
    );
    credentialResolverRef.current?.(credential);
    credentialResolverRef.current = null;
    closeCredentialModal();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const data: Record<string, string> = {};
      if (username !== user.username) data.username = username;
      if (email !== user.email) data.email = email;

      if (Object.keys(data).length === 0 && !password) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      if (password) {
        // Re-authenticate user before allowing password change
        const credential = await promptForCredentials("password");
        const firebaseUser = auth.currentUser;

        if (!credential || !firebaseUser) {
          setError("Password update cancelled");
          setSaving(false);
          return;
        }

        await reauthenticateWithCredential(firebaseUser, credential);
        await updatePassword(firebaseUser, password);
      }

      if (Object.keys(data).length > 0) {
        await updateUser(user.id, data);
      }

      toast("Profile updated", "success");
      setPassword("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    setError("");
    try {
      const firebaseUser = auth.currentUser;

      if (!firebaseUser) {
        setError("No authenticated user found");
        setDeleting(false);
        return;
      }
      await deleteUser(user.id);
      await deleteFirebaseUser(firebaseUser);
      await logout();
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete account",
      );
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      <Modal open={openModal} onClose={handleCredentialCancel}>
        <h3 className="text-lg font-semibold text-gray-900">
          Confirm your identity
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Enter your current password to change your password.
        </p>
        <div className="mt-4 space-y-2">
          <Input
            label="Current Password"
            type="password"
            value={credentialPassword}
            onChange={(e) => {
              setCredentialPassword(e.target.value);
              if (credentialError) setCredentialError("");
            }}
          />
          {credentialError && (
            <p className="text-sm text-red-600">{credentialError}</p>
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={handleCredentialCancel}>
            Cancel
          </Button>
          <Button onClick={handleCredentialConfirm}>Confirm</Button>
        </div>
      </Modal>

      <form onSubmit={handleSave} className="space-y-4">
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <div>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {/* TODO: PLACEHOLDER — Email change requires OTP verification via backend */}
          <p className="mt-1 text-xs text-gray-400">
            (Email change requires OTP verification)
          </p>
        </div>
        <Input
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>

      {error && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="mt-10 border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-2">
          To delete your account, type &quot;DELETE&quot; below:
        </p>
        <div className="flex gap-3">
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            placeholder='Type "DELETE"'
          />
          <Button
            variant="danger"
            disabled={deleteConfirm !== "DELETE" || deleting}
            onClick={handleDelete}
          >
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          A confirmation email will be sent to you.
        </p>
      </div>
    </div>
  );
}
