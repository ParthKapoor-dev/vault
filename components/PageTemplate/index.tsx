"use client";
// PageLayout Component
import type { Items } from "@/types/items";
import { getSession } from "@/lib/auth/client";
import { formatter } from "@/lib/formatter";
import { Link as NextViewTransition } from "next-view-transitions";
import React, { useEffect, useState } from "react";
import { Delete, Edit, Edit2, Trash2 } from "lucide-react";
import { createS3Item } from "@/actions/s3/create";
import { renameS3Item } from "@/actions/s3/rename";
import { deleteS3Item } from "@/actions/s3/delete";

interface PageProps {
  items: Items;
  path: string;
  isAdmin: boolean;
  user: {
    name: string;
    email: string;
  };
}

interface CreateItemFormProps {
  onSubmit: (item: {
    type: "Directory" | "File";
    title: string;
    slug: string;
  }) => void;
  onCancel: () => void;
}

const CreateItemForm = ({ onSubmit, onCancel }: CreateItemFormProps) => {
  const [type, setType] = useState<"Directory" | "File">("Directory");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && slug.trim()) {
      onSubmit({ type, title: title.trim(), slug: slug.trim() });
      setTitle("");
      setSlug("");
    }
  };

  return (
    <div className="border border-border rounded-sm p-4 mb-4 bg-background">
      <h3 className="text-sm font-medium mb-3">Create New Item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Directory" | "File")}
            className="w-full p-3 border border-border rounded-md text-sm"
          >
            <option value="Directory">Directory</option>
            <option value="File">File</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter title"
            className="w-full p-3 border border-border rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Enter slug (URL-friendly name)"
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-gray-5 text-white rounded-sm text-sm hover:bg-gray-3"
          >
            Create
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

interface EditItemFormProps {
  item: Items[0];
  onSubmit: (updatedItem: { title: string; slug: string }) => void;
  onCancel: () => void;
}

const EditItemForm = ({ item, onSubmit, onCancel }: EditItemFormProps) => {
  const [title, setTitle] = useState(item.title);
  const [slug, setSlug] = useState(item.slug);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && slug.trim()) {
      onSubmit({ title: title.trim(), slug: slug.trim() });
    }
  };

  return (
    <div className="border border-border rounded-sm p-4 mb-2 bg-background">
      <h3 className="text-sm font-medium mb-3">Edit Item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
          >
            Update
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const PageLayout = ({
  items: initialItems,
  path,
  isAdmin,
  user,
}: PageProps) => {
  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const sortedItems = items.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateItem = async (newItem: {
    type: "Directory" | "File";
    title: string;
    slug: string;
  }) => {
    setLoading("create");
    try {
      const createdItem = {
        ...newItem,
        createdAt: Date.now(),
      };

      await createS3Item(path, createdItem);
      setItems((prev) => [...prev, createdItem]);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create item:", error);
      // TODO: Show error toast/notification
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
    } catch (error) {
      console.error("Failed to update item:", error);
      // TODO: Show error toast/notification
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteItem = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    setLoading(`delete-${slug}`);
    try {
      await deleteS3Item(path, slug);
      setItems((prev) => prev.filter((item) => item.slug !== slug));
    } catch (error) {
      console.error("Failed to delete item:", error);
      // TODO: Show error toast/notification
    } finally {
      setLoading(null);
    }
  };

  const Seperator = () => <div className="border-border border-t" />;

  console.log("isAdmin in PageTemplate", isAdmin);
  console.log("User Email: ", user.email);
  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <NextViewTransition href={`/${path}`} className="flex justify-between">
          <h2 className="py-2 text-muted capitalize">
            {path.split("/")[path.split("/").length - 1]}{" "}
            {sortedItems.length > 0 && `(${sortedItems.length})`}
          </h2>
        </NextViewTransition>

        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-gray-5 text-white rounded-sm text-sm hover:bg-gray-3"
          >
            {showCreateForm ? "Cancel" : "Add New"}
          </button>
        )}
      </div>

      {isAdmin && showCreateForm && (
        <CreateItemForm
          onSubmit={handleCreateItem}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {sortedItems.length == 0 && (
        <div className="py-8 italic flex justify-center items-center text-gray-7">
          No Items in this directory
        </div>
      )}

      {sortedItems.map((item) => {
        const isEditing = editingItem === item.slug;

        return (
          <React.Fragment key={item.slug}>
            <Seperator />

            {isEditing ? (
              <EditItemForm
                item={item}
                onSubmit={(updatedData) =>
                  handleUpdateItem(item.slug, updatedData)
                }
                onCancel={() => setEditingItem(null)}
              />
            ) : (
              <NextViewTransition
                href={getSlug(path, item.slug)}
                className="flex w-full justify-between items-center py-2 group"
              >
                <p>{item.title}</p>
                <div className="flex gap-2 items-center justify-between">
                  {isAdmin && (
                    <div className="flex items-center gap-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setEditingItem(item.slug);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50/10 rounded-md transition-colors"
                        title="Edit"
                        // disabled={itemLoading}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteItem(item.slug);
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50/10 rounded-md transition-colors"
                        title="Delete"
                        // disabled={itemLoading}
                      >
                        <Trash2 size={14} />
                      </button>
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
