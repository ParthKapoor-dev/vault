"use client";
// PageLayout Component
import type { Items } from "@/types/items";
import { getSession } from "@/lib/auth/client";
import { formatter } from "@/lib/formatter";
import { Link as NextViewTransition } from "next-view-transitions";
import React, { useState } from "react";

interface PageProps {
  items: Items;
  path: string;
  isAdmin: boolean;
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
    <div className="border border-border rounded-md p-4 mb-4 bg-background">
      <h3 className="text-sm font-medium mb-3">Create New Item</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as "Directory" | "File")}
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
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
            placeholder="Enter slug (URL-friendly name)"
            className="w-full px-3 py-2 border border-border rounded-md text-sm"
            required
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
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
    <div className="border border-border rounded-md p-4 mb-2 bg-background">
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

const PageLayout = ({ items: initialItems, path, isAdmin }: PageProps) => {
  const [items, setItems] = useState(initialItems);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const sortedItems = items.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateItem = async (newItem: {
    type: "Directory" | "File";
    title: string;
    slug: string;
  }) => {
    try {
      // TODO: Call S3 business logic function here
      // await createS3Item(path, newItem);

      const createdItem = {
        ...newItem,
        createdAt: Date.now(),
      };

      setItems((prev) => [...prev, createdItem]);
      setShowCreateForm(false);

      // Placeholder for success feedback
      console.log("Item created:", createdItem);
    } catch (error) {
      console.error("Failed to create item:", error);
      // TODO: Show error message to user
    }
  };

  const handleUpdateItem = async (
    slug: string,
    updatedData: { title: string; slug: string },
  ) => {
    try {
      // TODO: Call S3 business logic function here
      // await updateS3Item(path, slug, updatedData);

      setItems((prev) =>
        prev.map((item) =>
          item.slug === slug
            ? { ...item, title: updatedData.title, slug: updatedData.slug }
            : item,
        ),
      );
      setEditingItem(null);

      // Placeholder for success feedback
      console.log("Item updated:", updatedData);
    } catch (error) {
      console.error("Failed to update item:", error);
      // TODO: Show error message to user
    }
  };

  const handleDeleteItem = async (slug: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      // TODO: Call S3 business logic function here
      // await deleteS3Item(path, slug);

      setItems((prev) => prev.filter((item) => item.slug !== slug));

      // Placeholder for success feedback
      console.log("Item deleted:", slug);
    } catch (error) {
      console.error("Failed to delete item:", error);
      // TODO: Show error message to user
    }
  };

  const Seperator = () => <div className="border-border border-t" />;

  if (sortedItems.length === 0 && !isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <NextViewTransition href={`/${path}`} className="flex justify-between">
          <h2 className="py-2 text-muted capitalize">
            {path.split("/")[-1]}{" "}
            {sortedItems.length > 0 && `(${sortedItems.length})`}
          </h2>
        </NextViewTransition>

        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
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
              <div className="flex w-full justify-between py-2 group">
                <NextViewTransition
                  href={getSlug(path, item.slug)}
                  className="flex w-full justify-between"
                >
                  <p>{item.title}</p>
                  <p className="mt-0 text-muted">
                    {formatter.date(new Date(item.createdAt))}
                  </p>
                </NextViewTransition>

                {isAdmin && (
                  <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingItem(item.slug);
                      }}
                      className="px-2 py-1 bg-yellow-500 text-white rounded text-xs hover:bg-yellow-600"
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDeleteItem(item.slug);
                      }}
                      className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      title="Delete"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
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
