"use client";

import { useState, type ChangeEvent } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Check, Eye, EyeOff, ImagePlus, Loader2, Pencil, Trash2 } from "lucide-react";
import type { Memory } from "@/data/content";
import { callApi } from "@/lib/firebase/client";
import { useAllMemories } from "@/lib/site-content";
import { shrinkPhoto } from "@/lib/shrink-photo";
import { FocusPicker, type FocusShape } from "@/components/admin/FocusPicker";
import { focusStyle, type Focus } from "@/data/focus";

const STRIP_SHAPE: FocusShape[] = [{ label: "Photo strip on Home", aspect: "3 / 4", width: "7rem" }];

function MemoryCard({
  memory,
  first,
  last,
  onError,
}: {
  memory: Memory;
  first: boolean;
  last: boolean;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState(memory.caption);
  const [focus, setFocus] = useState<Focus | null>(memory.focus ?? null);
  const [confirming, setConfirming] = useState(false);

  const run = async (name: string, body: object, method?: "DELETE") => {
    setBusy(name);
    const result = await callApi("/api/admin/memories", body, method);
    setBusy(null);
    if (!result.ok) onError(result.message);
    return result.ok;
  };

  const iconButton = "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#12372A] shadow disabled:opacity-30";

  return (
    <li className={`overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#ADBC9F]/60 ${editing ? "col-span-full" : ""}`}>
      <div className={`relative aspect-[3/4] bg-[#DDE5BE] ${memory.hidden ? "grayscale" : ""} ${editing ? "hidden" : ""}`}>
        <Image src={memory.src} alt={memory.caption || "Memory photo"} fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover" style={focusStyle(memory.focus)} />
        {memory.hidden && (
          <span key="hidden" className="absolute left-2 top-2 rounded-full bg-[#E9E6DF] px-2 py-0.5 text-[11px] font-bold text-[#5A4300]">Hidden</span>
        )}
        <div className="absolute right-2 top-2 flex flex-col gap-1.5">
          <button onClick={() => void run("up", { action: "move", id: memory.id, direction: -1 })} disabled={first || busy !== null} aria-label="Move earlier" className={iconButton}>
            <ArrowUp className="h-4 w-4" />
          </button>
          <button onClick={() => void run("down", { action: "move", id: memory.id, direction: 1 })} disabled={last || busy !== null} aria-label="Move later" className={iconButton}>
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
        {busy && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/50">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
        )}
      </div>
      <div className="space-y-2 p-2.5">
        {editing ? (
          <div className="space-y-3 p-1">
            <FocusPicker src={memory.src} focus={focus} onChange={setFocus} shapes={STRIP_SHAPE} />
            <label className="block text-sm font-semibold">
              Caption (optional)
              <input
                value={caption}
                maxLength={120}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="e.g. Merapi trip, October 2026"
                className="mt-1.5 w-full rounded-xl border border-[#ADBC9F] px-3 py-2.5 text-base"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setEditing(false)} className="min-h-11 rounded-2xl border border-[#12372A]/30 text-sm font-semibold">
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (await run("save", { action: "update", id: memory.id, caption, focus })) setEditing(false);
                }}
                disabled={busy !== null}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-[#0D2A1F] text-sm font-semibold text-white disabled:opacity-60"
              >
                {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="line-clamp-2 min-h-[2.5em] text-xs text-[#436850]">{memory.caption || "No caption"}</p>
        )}
        {editing ? null : confirming ? (
          <div className="rounded-2xl bg-[#A33A12]/10 p-2">
            <p className="text-xs font-semibold text-[#A33A12]">Delete this photo for good?</p>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              <button onClick={() => setConfirming(false)} className="min-h-9 rounded-xl border border-[#12372A]/30 bg-white text-xs font-semibold">
                Cancel
              </button>
              <button
                onClick={() => void run("delete", { id: memory.id }, "DELETE")}
                style={{ backgroundColor: "#A33A12" }}
                className="min-h-9 rounded-xl text-xs font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => {
                setCaption(memory.caption);
                setFocus(memory.focus ?? null);
                setEditing(true);
              }}
              aria-label="Edit caption and crop"
              className="flex min-h-9 items-center justify-center rounded-xl hover:bg-[#DDE5BE]"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => void run("hide", { action: "hide", id: memory.id, hidden: !memory.hidden })}
              aria-label={memory.hidden ? "Show on Home" : "Hide from Home"}
              className="flex min-h-9 items-center justify-center rounded-xl hover:bg-[#DDE5BE]"
            >
              {memory.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
            <button onClick={() => setConfirming(true)} aria-label="Delete photo" className="flex min-h-9 items-center justify-center rounded-xl text-[#A33A12] hover:bg-[#A33A12]/10">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/** Admins manage the "Memories from Jogja" photos on Home. */
export function MemoriesManager() {
  const memories = useAllMemories();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [newFocus, setNewFocus] = useState<Focus | null>(null);

  const pick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    try {
      setPreview(await shrinkPhoto(file));
      setNewFocus(null);
    } catch {
      setError("This photo could not be used. Please try another one.");
    }
  };

  const upload = async () => {
    if (!preview) return;
    setBusy(true);
    setError(null);
    const result = await callApi("/api/admin/memories", { action: "add", imageData: preview, caption, focus: newFocus });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setPreview(null);
    setNewFocus(null);
    setCaption("");
  };

  return (
    <div className="space-y-4">
      <section className="space-y-3 rounded-3xl bg-white p-5 shadow">
        <h2 className="title-card flex items-center gap-2 text-xl">
          <ImagePlus className="h-5 w-5 text-[#03603F]" />
          Add a photo
        </h2>
        <div className="flex gap-3">
          <label className="relative flex aspect-[3/4] w-28 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl bg-[#F3F4DC] text-[#436850] ring-1 ring-[#ADBC9F]">
            {preview ? (
              // A data URL from the file picker can't go through the image optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Preview" className="h-full w-full object-cover" style={focusStyle(newFocus)} />
            ) : (
              <ImagePlus className="h-7 w-7" />
            )}
            <input type="file" accept="image/*" onChange={(event) => void pick(event)} className="sr-only" />
          </label>
          <div className="min-w-0 flex-1 space-y-2">
            <label className="block text-sm font-semibold">
              Caption (optional)
              <input
                value={caption}
                maxLength={120}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="e.g. Merapi trip, October 2026"
                className="mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-3 py-2.5 text-base outline-none focus:ring-2 focus:ring-[#8DB255]"
              />
            </label>
            <button
              onClick={() => void upload()}
              disabled={!preview || busy}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka font-semibold text-white disabled:opacity-40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {preview ? "Add to Home" : "Choose a photo first"}
            </button>
          </div>
        </div>
        {preview && <FocusPicker src={preview} focus={newFocus} onChange={setNewFocus} shapes={STRIP_SHAPE} />}
        <p className="text-pretty text-xs text-[#436850]">New photos appear first in &ldquo;Memories from Jogja&rdquo;. Tall photos look best.</p>
        {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
      </section>

      <h2 className="title-section text-black">
        Photos <span translate="no" className="notranslate rounded-full bg-[#DDE5BE] px-2 text-sm">{memories.length}</span>
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {memories.map((memory, index) => (
          <MemoryCard key={memory.id} memory={memory} first={index === 0} last={index === memories.length - 1} onError={setError} />
        ))}
      </ul>
    </div>
  );
}
