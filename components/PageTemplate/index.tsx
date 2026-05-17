"use client";
// Core vault listing: renders directories/files and admin CRUD + visibility.
import type { Items, Item, Visibility } from "@/types/items";
import { useSession } from "@/components/providers/session";
import { formatter } from "@/lib/formatter";
import { Link as NextViewTransition } from "next-view-transitions";
import React, { useState } from "react";
import { Edit2, Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createS3Item } from "@/actions/s3/create";
import { renameS3Item } from "@/actions/s3/rename";
import { deleteS3Item } from "@/actions/s3/delete";
import { toggleVisibility } from "@/actions/s3/visibility";
import { Upload } from "@/components/upload";

interface PageProps {
  items: Items;
  path: string;
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const fieldClass =
  "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gray-8";

interface CreateItemFormProps {
  onSubmit: (item: {
    type: "Directory" | "File";
    title: string;
    slug: string;
    visibility: Visibility;
  }) => void;
  onCancel: () => void;
  busy: boolean;
}

const CreateItemForm = ({ onSubmit, onCancel, busy }: CreateItemFormProps) => {
  const [type, setType] = useState<"Directory" | "File">("Directory");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>("private");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug = (slugEdited ? slug : slugify(title)).trim();
    if (title.trim() && finalSlug) {
      onSubmit({ type, title: title.trim(), slug: finalSlug, visibility });
    }
  };

  return (
    <div className="my-3 rounded-sm border border-border bg-background p-4">
      <h3 className="mb-3 text-sm font-medium">New item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-3">
          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value as "Directory" | "File")
            }
            className={fieldClass}
          >
            <option value="Directory">Directory</option>
            <option value="File">Blog Post</option>
          </select>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className={fieldClass}
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={fieldClass}
          required
        />
        <input
          type="text"
          value={slugEdited ? slug : slugify(title)}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          placeholder="slug"
          className={fieldClass}
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-sm bg-gray-12 px-4 py-2 text-sm text-gray-1 hover:opacity-80 disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

interface EditItemFormProps {
  item: Item;
  onSubmit: (updatedItem: { title: string; slug: string }) => void;
  onCancel: () => void;
  busy: boolean;
}

const EditItemForm = ({ item, onSubmit, onCancel, busy }: EditItemFormProps) => {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && slug.trim()) {
      onSubmit({ title: title.trim(), slug: slug.trim() });
    }
  };

  return (
    <div className="my-2 rounded-sm border border-border bg-background p-4">
      <h3 className="mb-3 text-sm font-medium">Edit item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className={fieldClass}
          required
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug"
          className={fieldClass}
          required
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="rounded-sm bg-gray-12 px-4 py-2 text-sm text-gray-1 hover:opacity-80 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-border px-4 py-2 text-sm hover:bg-hover"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const PageLayout = ({ items: initialItems, path }: PageProps) => {
  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const { session } = useSession();
  const isAdmin = !!session?.isAdmin;

  const sortedItems = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const handleCreateItem = async (newItem: {
    type: "Directory" | "File";
    title: string;
    slug: string;
    visibility: Visibility;
  }) => {
    setLoading("create");
    try {
      // Blog posts are markdown documents — ensure an .mdx extension.
      const slug =
        newItem.type === "File" && !/\.mdx?$/i.test(newItem.slug)
          ? `${newItem.slug}.mdx`
          : newItem.slug;
      const createdItem: Item = { ...newItem, slug, createdAt: Date.now() };
      await createS3Item(path, createdItem);
      setItems((prev) => [...prev, createdItem]);
      setShowCreateForm(false);
      toast.success(`Created ${newItem.title}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create item",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleUpdateItem = async (
    slug: string,
    updatedData: { title: string; slug: string },
  ) => {
    setLoading(`update-${slug}`);
    try {
      await renameS3Item(path, slug, updatedData);
      setItems((prev) =>
        prev.map((item) =>
          item.slug === slug
            ? { ...item, title: updatedData.title, slug: updatedData.slug }
            : item,
        ),
      );
      setEditingItem(null);
      toast.success("Item updated");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update item",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteItem = async (slug: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setLoading(`delete-${slug}`);
    try {
      await deleteS3Item(path, slug);
      setItems((prev) => prev.filter((item) => item.slug !== slug));
      toast.success("Item deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete item",
      );
    } finally {
      setLoading(null);
    }
  };

  const handleToggleVisibility = async (item: Item) => {
    const next: Visibility =
      item.visibility === "public" ? "private" : "public";
    setLoading(`vis-${item.slug}`);
    try {
      await toggleVisibility(path, item.slug, item.type, next);
      setItems((prev) =>
        prev.map((i) =>
          i.slug === item.slug ? { ...i, visibility: next } : i,
        ),
      );
      toast.success(`${item.title} is now ${next}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update visibility",
      );
    } finally {
      setLoading(null);
    }
  };

  const Separator = () => <div className="border-t border-border" />;
  const here = path.split("/").filter(Boolean).pop() ?? "";

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h2 className="py-2 capitalize text-muted">
          {here} {sortedItems.length > 0 && `(${sortedItems.length})`}
        </h2>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowUpload(!showUpload);
                setShowCreateForm(false);
              }}
              className="rounded-sm border border-border px-3 py-1 text-sm hover:bg-hover"
            >
              {showUpload ? "Cancel" : "Upload"}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setShowUpload(false);
              }}
              className="rounded-sm bg-gray-12 px-3 py-1 text-sm text-gray-1 hover:opacity-80"
            >
              {showCreateForm ? "Cancel" : "Add New"}
            </button>
          </div>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <CreateItemForm
          onSubmit={handleCreateItem}
          onCancel={() => setShowCreateForm(false)}
          busy={loading === "create"}
        />
      )}

      {isAdmin && showUpload && (
        <Upload
          path={path}
          onUploaded={(item) => {
            setItems((prev) => [...prev, item]);
            setShowUpload(false);
          }}
          onCancel={() => setShowUpload(false)}
        />
      )}

      {sortedItems.length === 0 && (
        <div className="flex items-center justify-center py-8 italic text-gray-7">
          No items in this directory
        </div>
      )}

      {sortedItems.map((item) => {
        const isEditing = editingItem === item.slug;
        return (
          <React.Fragment key={item.slug}>
            <Separator />
            {isEditing ? (
              <EditItemForm
                item={item}
                onSubmit={(updatedData) =>
                  handleUpdateItem(item.slug, updatedData)
                }
                onCancel={() => setEditingItem(null)}
                busy={loading === `update-${item.slug}`}
              />
            ) : (
              <NextViewTransition
                href={getSlug(path, item.slug)}
                className="group flex w-full items-center justify-between py-2"
              >
                <p className={item.visibility === "private" ? "text-muted" : ""}>
                  {item.title}
                </p>
                <div className="flex items-center gap-2">
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleVisibility(item);
                        }}
                        disabled={loading === `vis-${item.slug}`}
                        className="rounded p-1.5 text-gray-8 transition-colors hover:text-foreground"
                        title={
                          item.visibility === "public"
                            ? "Public — click to make private"
                            : "Private — click to make public"
                        }
                      >
                        {item.visibility === "public" ? (
                          <Eye size={14} />
                        ) : (
                          <EyeOff size={14} />
                        )}
                      </button>
                      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setEditingItem(item.slug);
                          }}
                          className="rounded p-1.5 text-gray-8 transition-colors hover:text-foreground"
                          title="Rename"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteItem(item.slug);
                          }}
                          disabled={loading === `delete-${item.slug}`}
                          className="rounded p-1.5 text-gray-8 transition-colors hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="mt-0 text-muted">
                    {formatter.date(new Date(item.createdAt))}
                  </p>
                </div>
              </NextViewTransition>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

function getSlug(path: string, slug: string) {
  if (path === "") return `/${slug}`;
  return `/${path}/${slug}`;
}

export default PageLayout;
