import { createFileRoute } from "@tanstack/react-router";
import { Upload, Trash2 } from "lucide-react";
import { useUploadFiles } from "@xixixao/uploadstuff/react";
import { useDoubleCheck } from "@/ui/use-double-check";
import { Input } from "@/ui/input";
import { convexQuery, useConvexMutation } from "@convex-dev/react-query";
import { api } from "~/convex/_generated/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import * as validators from "@/utils/validators";
import { useSignOut } from "@/utils/misc";

export const Route = createFileRoute("/_app/_auth/dashboard/_layout/settings/")(
  {
    component: DashboardSettings,
  },
);

export default function DashboardSettings() {
  const { data: user } = useQuery(convexQuery(api.app.getCurrentUser, {}));
  const signOut = useSignOut();
  const { mutateAsync: updateUsername } = useMutation({
    mutationFn: useConvexMutation(api.app.updateUsername),
  });
  const { mutateAsync: updateUserImage } = useMutation({
    mutationFn: useConvexMutation(api.app.updateUserImage),
  });
  const { mutateAsync: removeUserImage } = useMutation({
    mutationFn: useConvexMutation(api.app.removeUserImage),
  });
  const { mutateAsync: deleteCurrentUserAccount } = useMutation({
    mutationFn: useConvexMutation(api.app.deleteCurrentUserAccount),
  });
  const generateUploadUrl = useConvexMutation(api.app.generateUploadUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadFiles(generateUploadUrl, {
    onUploadComplete: async (uploaded) => {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await updateUserImage({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        imageId: (uploaded[0].response as any).storageId,
      });
    },
  });
  const { doubleCheck, getButtonProps } = useDoubleCheck();

  const usernameForm = useForm({
    validatorAdapter: zodValidator(),
    defaultValues: {
      username: user?.username,
    },
    onSubmit: async ({ value }) => {
      await updateUsername({ username: value.username || "" });
    },
  });

  const handleDeleteAccount = async () => {
    await deleteCurrentUserAccount({});
    signOut();
  };

  if (!user) {
    return null;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-5xl font-black mb-2 text-black">Settings</h1>
      <p className="text-lg text-gray-700 font-medium mb-8">
        Manage your account preferences
      </p>

      <div className="space-y-6">
        {/* Avatar Section */}
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8">
            <h2 className="text-2xl font-black mb-4 text-black">Your Avatar</h2>
            <p className="text-sm text-gray-600 mb-6">
              This is your avatar. It will be displayed on your profile.
            </p>

            <div className="flex items-start gap-6">
              <label
                htmlFor="avatar_field"
                className="group relative cursor-pointer"
              >
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black overflow-hidden">
                  {user.image ? (
                    <img
                      src={user.image}
                      className="h-24 w-24 object-cover"
                      alt={user.name || user.email || "User"}
                    />
                  ) : (
                    <div className="h-24 w-24 bg-gradient-to-br from-orange-300 to-orange-400 flex items-center justify-center text-4xl font-black text-black">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="h-8 w-8 text-white" />
                  </div>
                </div>
              </label>

              <div className="flex-1">
                <input
                  id="avatar_field"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const files = e.target.files;
                    if (!files || files.length === 0) {
                      return;
                    }
                    void startUpload(Array.from(files));
                  }}
                />
                <p className="text-sm text-gray-600 mb-3">
                  Click on the avatar to upload a custom one from your files.
                </p>
                {user.image && (
                  <button
                    onClick={() => removeUserImage({})}
                    className="relative inline-block"
                  >
                    <div className="absolute -bottom-0.5 -right-0.5 h-full w-full bg-black"></div>
                    <div className="relative border-[2px] border-black bg-red-200 px-4 py-2 font-bold hover:bg-red-300 transition-colors text-sm">
                      Reset Avatar
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Username Section */}
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8">
            <h2 className="text-2xl font-black mb-4 text-black">Your Username</h2>
            <p className="text-sm text-gray-600 mb-6">
              This is your username. It will be displayed on your profile.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                usernameForm.handleSubmit();
              }}
              className="space-y-4"
            >
              <usernameForm.Field
                name="username"
                validators={{
                  onChange: validators.username,
                }}
                children={(field) => (
                  <div>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="username"
                      className="mb-2"
                    />
                    {field.state.meta.errors.length > 0 && (
                      <span className="text-sm text-red-600 font-medium">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Please use 32 characters at maximum.
                    </p>
                  </div>
                )}
              />

              <button
                type="submit"
                className="relative"
              >
                <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
                <div className="relative border-[3px] border-black bg-orange-300 px-6 py-2 font-bold hover:bg-orange-400 transition-colors">
                  Save
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Delete Account Section */}
        <div className="relative">
          <div className="absolute -bottom-2 -right-2 h-full w-full bg-black"></div>
          <div className="relative border-[4px] border-black bg-white p-8">
            <h2 className="text-2xl font-black mb-4 text-black">Delete Account</h2>
            <p className="text-sm text-gray-600 mb-2">
              Permanently delete your Humanly account, all of your agents, links and their respective stats.
            </p>
            <p className="text-sm text-red-600 font-bold mb-6">
              This action cannot be undone, proceed with caution.
            </p>

            <button
              {...getButtonProps({
                onClick: handleDeleteAccount,
              })}
              className="relative"
            >
              <div className="absolute -bottom-1 -right-1 h-full w-full bg-black"></div>
              <div className="relative border-[3px] border-black bg-red-400 px-6 py-3 font-bold hover:bg-red-500 transition-colors flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                {doubleCheck ? "Are you sure?" : "Delete Account"}
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
