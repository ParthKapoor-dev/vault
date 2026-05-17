"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Eye,
  EyeOff,
  Lock,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { getVault, saveVault } from "@/actions/s3/passwords";
import {
  createVault,
  sealVault,
  unlockVault,
  type PasswordEntry,
  type VaultBlob,
} from "@/lib/crypto/vault";

const fieldClass =
  "w-full rounded-sm border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gray-8";
const primaryBtn =
  "rounded-sm bg-gray-12 px-4 py-2 text-sm text-gray-1 hover:opacity-80 disabled:opacity-50";
const ghostBtn =
  "rounded-sm border border-border px-4 py-2 text-sm hover:bg-hover";

type Phase = "loading" | "create" | "unlock" | "open";

const emptyDraft = (): Omit<PasswordEntry, "id" | "updatedAt"> => ({
  name: "",
  username: "",
  password: "",
  url: "",
  notes: "",
});

/* ------------------------------ entry editor ------------------------------ */

function EntryForm({
  initial,
  onSave,
  onCancel,
  busy,
}: {
  initial?: PasswordEntry;
  onSave: (draft: Omit<PasswordEntry, "id" | "updatedAt">) => void;
  onCancel: () => void;
  busy: boolean;
}) {
  const [draft, setDraft] = useState(
    initial
      ? {
          name: initial.name,
          username: initial.username,
          password: initial.password,
          url: initial.url ?? "",
          notes: initial.notes ?? "",
        }
      : emptyDraft(),
  );
  const set = (k: keyof typeof draft, v: string) =>
    setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="my-3 space-y-3 rounded-sm border border-border bg-background p-4">
      <h3 className="text-sm font-medium">
        {initial ? "Edit entry" : "New entry"}
      </h3>
      <input
        className={fieldClass}
        placeholder="Name (e.g. GitHub)"
        value={draft.name}
        onChange={(e) => set("name", e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="Username / email"
        value={draft.username}
        onChange={(e) => set("username", e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="Password"
        value={draft.password}
        onChange={(e) => set("password", e.target.value)}
      />
      <input
        className={fieldClass}
        placeholder="URL (optional)"
        value={draft.url}
        onChange={(e) => set("url", e.target.value)}
      />
      <textarea
        className={fieldClass}
        placeholder="Notes (optional)"
        rows={2}
        value={draft.notes}
        onChange={(e) => set("notes", e.target.value)}
      />
      <div className="flex gap-2">
        <button
          className={primaryBtn}
          disabled={busy || !draft.name.trim()}
          onClick={() => onSave(draft)}
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button className={ghostBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ------------------------------- entry row -------------------------------- */

function EntryRow({
  entry,
  onEdit,
  onDelete,
}: {
  entry: PasswordEntry;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Clipboard unavailable");
    }
  };

  return (
    <div className="group flex flex-col gap-1 border-t border-border py-3">
      <div className="flex items-center justify-between">
        <p className="font-medium">{entry.name}</p>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={onEdit}
            className="rounded p-1.5 text-gray-8 hover:text-foreground"
            title="Edit"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            className="rounded p-1.5 text-gray-8 hover:text-red-600"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {entry.username && (
        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="truncate">{entry.username}</span>
          <button
            onClick={() => copy(entry.username, "Username")}
            className="text-gray-8 hover:text-foreground"
            title="Copy username"
          >
            <Copy size={12} />
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-muted">
        <span className="font-mono">
          {revealed ? entry.password : "•".repeat(10)}
        </span>
        <button
          onClick={() => setRevealed((r) => !r)}
          className="text-gray-8 hover:text-foreground"
          title={revealed ? "Hide" : "Reveal"}
        >
          {revealed ? <EyeOff size={12} /> : <Eye size={12} />}
        </button>
        <button
          onClick={() => copy(entry.password, "Password")}
          className="text-gray-8 hover:text-foreground"
          title="Copy password"
        >
          <Copy size={12} />
        </button>
      </div>
      {entry.url && (
        <a
          href={entry.url}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-muted underline-offset-2 hover:underline"
        >
          {entry.url}
        </a>
      )}
      {entry.notes && (
        <p className="whitespace-pre-wrap text-sm text-muted">{entry.notes}</p>
      )}
    </div>
  );
}

/* ------------------------------- controller ------------------------------- */

export function PasswordVault() {
  const [phase, setPhase] = useState<Phase>("loading");
  const [blob, setBlob] = useState<VaultBlob | null>(null);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<string | "new" | null>(null);

  useEffect(() => {
    getVault()
      .then((raw) => {
        if (!raw) {
          setPhase("create");
          return;
        }
        try {
          setBlob(JSON.parse(raw) as VaultBlob);
          setPhase("unlock");
        } catch {
          setPhase("create");
        }
      })
      .catch(() => {
        toast.error("Failed to load vault");
        setPhase("unlock");
      });
  }, []);

  const lock = () => {
    setCryptoKey(null);
    setEntries([]);
    setPassphrase("");
    setEditing(null);
    setPhase("unlock");
  };

  const handleCreate = async () => {
    if (passphrase.length < 8) {
      toast.error("Use a passphrase of at least 8 characters.");
      return;
    }
    if (passphrase !== confirm) {
      toast.error("Passphrases do not match.");
      return;
    }
    setBusy(true);
    try {
      const created = await createVault(passphrase);
      await saveVault(JSON.stringify(created.blob));
      setBlob(created.blob);
      setCryptoKey(created.key);
      setEntries(created.entries);
      setPassphrase("");
      setConfirm("");
      setPhase("open");
      toast.success("Vault created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create vault");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!blob) return;
    setBusy(true);
    try {
      const opened = await unlockVault(blob, passphrase);
      setCryptoKey(opened.key);
      setEntries(opened.entries);
      setPassphrase("");
      setPhase("open");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to unlock");
    } finally {
      setBusy(false);
    }
  };

  const persist = async (next: PasswordEntry[]) => {
    if (!blob || !cryptoKey) return;
    setBusy(true);
    try {
      const sealed = await sealVault(blob, cryptoKey, next);
      await saveVault(JSON.stringify(sealed));
      setBlob(sealed);
      setEntries(next);
      setEditing(null);
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const saveEntry = (draft: Omit<PasswordEntry, "id" | "updatedAt">) => {
    if (editing && editing !== "new") {
      persist(
        entries.map((e) =>
          e.id === editing ? { ...e, ...draft, updatedAt: Date.now() } : e,
        ),
      );
    } else {
      persist([
        ...entries,
        { ...draft, id: crypto.randomUUID(), updatedAt: Date.now() },
      ]);
    }
  };

  const deleteEntry = (id: string) => {
    if (window.confirm("Delete this entry?")) {
      persist(entries.filter((e) => e.id !== id));
    }
  };

  /* --------------------------------- views -------------------------------- */

  if (phase === "loading") {
    return <p className="py-12 text-center text-muted">Loading vault…</p>;
  }

  if (phase === "create") {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-8">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} />
          <h1>Create password vault</h1>
        </div>
        <p className="text-sm text-muted">
          Pick a master passphrase. It is the only key — it never leaves this
          device and cannot be recovered. If you lose it, the vault is gone.
        </p>
        <input
          type="password"
          className={fieldClass}
          placeholder="Master passphrase"
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
        />
        <input
          type="password"
          className={fieldClass}
          placeholder="Confirm passphrase"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <button className={primaryBtn} disabled={busy} onClick={handleCreate}>
          {busy ? "Creating…" : "Create vault"}
        </button>
      </div>
    );
  }

  if (phase === "unlock") {
    return (
      <div className="mx-auto max-w-sm space-y-4 py-8">
        <div className="flex items-center gap-2">
          <Lock size={18} />
          <h1>Unlock vault</h1>
        </div>
        <p className="text-sm text-muted">
          Enter your master passphrase. Decryption happens on this device.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUnlock();
          }}
          className="space-y-4"
        >
          <input
            type="password"
            className={fieldClass}
            placeholder="Master passphrase"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            autoFocus
          />
          <button className={primaryBtn} disabled={busy} type="submit">
            {busy ? "Unlocking…" : "Unlock"}
          </button>
        </form>
      </div>
    );
  }

  // phase === "open"
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h1>Passwords {entries.length > 0 && `(${entries.length})`}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(editing === "new" ? null : "new")}
            className="flex items-center gap-1 rounded-sm bg-gray-12 px-3 py-1 text-sm text-gray-1 hover:opacity-80"
          >
            <Plus size={14} /> Add
          </button>
          <button
            onClick={lock}
            className="flex items-center gap-1 rounded-sm border border-border px-3 py-1 text-sm hover:bg-hover"
          >
            <Lock size={14} /> Lock
          </button>
        </div>
      </div>

      {editing === "new" && (
        <EntryForm
          onSave={saveEntry}
          onCancel={() => setEditing(null)}
          busy={busy}
        />
      )}

      {entries.length === 0 && editing !== "new" && (
        <p className="py-10 text-center italic text-gray-7">
          No entries yet.
        </p>
      )}

      <div className="mt-2">
        {entries
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((entry) =>
            editing === entry.id ? (
              <EntryForm
                key={entry.id}
                initial={entry}
                onSave={saveEntry}
                onCancel={() => setEditing(null)}
                busy={busy}
              />
            ) : (
              <EntryRow
                key={entry.id}
                entry={entry}
                onEdit={() => setEditing(entry.id)}
                onDelete={() => deleteEntry(entry.id)}
              />
            ),
          )}
      </div>
    </div>
  );
}
