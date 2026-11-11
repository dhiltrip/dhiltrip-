"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Crown, Flag, Loader2, MailWarning, ShieldCheck, Trash2, UserPlus, UserX } from "lucide-react";
import { callApi } from "@/lib/firebase/client";
import { initialsOf } from "@/lib/initials";

type Role = "admin" | "leader";
type Member = {
  email: string;
  role: Role;
  owner: boolean;
  name: string;
  hasAccount: boolean;
  verified: boolean;
};

const ROLE_LABEL: Record<Role, string> = { admin: "Admin", leader: "Tour leader" };

function RolePicker({ value, onChange, disabled }: { value: Role; onChange: (role: Role) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label="Role" className="grid grid-cols-2 gap-1 rounded-2xl bg-[#F3F4DC] p-1">
      {(["leader", "admin"] as const).map((role) => (
        <button
          key={role}
          type="button"
          role="radio"
          aria-checked={value === role}
          disabled={disabled}
          onClick={() => onChange(role)}
          className={`flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${
            value === role ? "bg-[#0D2A1F] text-white shadow" : "text-[#12372A]"
          }`}
        >
          {role === "admin" ? <ShieldCheck className="h-4 w-4" /> : <Flag className="h-4 w-4" />}
          {ROLE_LABEL[role]}
        </button>
      ))}
    </div>
  );
}

function StatusLine({ member }: { member: Member }) {
  if (!member.hasAccount) {
    return <span key="none" className="text-[#5A4300]">No account yet. Active once they sign up and verify.</span>;
  }
  if (!member.verified) {
    return (
      <span key="unverified" className="flex items-center gap-1 text-[#A33A12]">
        <MailWarning className="h-3.5 w-3.5 shrink-0" />
        Waiting for email verification
      </span>
    );
  }
  return <span key="active" className="text-[#03603F]">Active</span>;
}

function MemberRow({ member, me, onChanged, onError }: { member: Member; me: string; onChanged: () => void; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isMe = member.email === me.toLowerCase();
  const locked = member.owner || isMe;

  const changeRole = async (role: Role) => {
    if (role === member.role) return;
    setBusy(true);
    const result = await callApi("/api/admin/team", { email: member.email, role });
    setBusy(false);
    if (result.ok) onChanged();
    else onError(result.message);
  };
  const remove = async () => {
    setBusy(true);
    const result = await callApi("/api/admin/team", { email: member.email }, "DELETE");
    setBusy(false);
    if (result.ok) onChanged();
    else onError(result.message);
  };

  return (
    <li className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-[#ADBC9F]/60">
      <div className="flex items-start gap-3">
        <div
          translate="no"
          aria-hidden="true"
          className="notranslate flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#E9E6DF] font-fredoka text-lg font-semibold text-[#12372A]"
        >
          {initialsOf(member.name || member.email)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {member.name && (
              <p translate="no" className="notranslate font-semibold leading-tight">{member.name}</p>
            )}
            {member.owner && (
              <span key="owner" className="flex items-center gap-1 rounded-full bg-[#FBF0C4] px-2 py-0.5 text-[11px] font-bold text-[#5A4300]">
                <Crown className="h-3 w-3" /> Owner
              </span>
            )}
            {isMe && <span key="me" className="rounded-full bg-[#DDE5BE] px-2 py-0.5 text-[11px] font-bold text-[#03603F]">You</span>}
          </div>
          <p translate="no" className="notranslate break-all text-sm text-[#436850]">{member.email}</p>
          <p className="mt-0.5 text-xs font-semibold">
            <StatusLine member={member} />
          </p>
        </div>
        {busy && <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[#436850]" />}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <RolePicker value={member.role} onChange={(role) => void changeRole(role)} disabled={busy || locked} />
        </div>
        {!locked && (
          <button
            onClick={() => setConfirming(true)}
            disabled={busy || confirming}
            aria-label={`Remove ${member.email}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-[#A33A12] ring-1 ring-[#A33A12]/30 hover:bg-[#A33A12]/10 disabled:opacity-40"
          >
            <UserX className="h-5 w-5" />
          </button>
        )}
      </div>
      {member.owner && (
        <p className="mt-2 text-pretty text-xs text-[#436850]">Owners are set in the server settings and always stay admins.</p>
      )}

      {confirming && (
        <div className="mt-3 animate-rise-in rounded-2xl bg-[#A33A12]/10 p-3">
          <p className="text-pretty text-sm font-semibold text-[#A33A12]">
            Remove <span translate="no" className="notranslate break-all">{member.email}</span> from the team? They keep their account and
            points as a regular traveler.
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setConfirming(false)} className="min-h-10 rounded-2xl border border-[#12372A]/30 bg-white text-sm font-semibold">
              Cancel
            </button>
            <button
              onClick={() => void remove()}
              disabled={busy}
              style={{ backgroundColor: "#A33A12" }}
              className="flex min-h-10 items-center justify-center gap-1.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              Yes, remove
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

/** Admins add tour leaders and other admins by email; no code or server settings needed. */
export function TeamManager({ myEmail }: { myEmail: string }) {
  const [items, setItems] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("leader");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    callApi<{ items: Member[] }>("/api/admin/team").then((result) => {
      if (cancelled) return;
      if (result.ok) setItems(result.items);
      else setError(result.message);
    });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const reload = () => setVersion((value) => value + 1);

  const add = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setAdded(null);
    const result = await callApi("/api/admin/team", { email, role });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setAdded(`${email.trim()} is now a ${ROLE_LABEL[role].toLowerCase()}.`);
    setEmail("");
    reload();
  };

  const leaders = items?.filter((item) => item.role === "leader") ?? [];
  const admins = items?.filter((item) => item.role === "admin") ?? [];

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
      <form onSubmit={add} className="space-y-4 rounded-3xl bg-white p-5 shadow lg:sticky lg:top-6">
        <h2 className="title-card flex items-center gap-2 text-xl">
          <UserPlus className="h-5 w-5 text-[#03603F]" />
          Add to the team
        </h2>
        <label className="block text-sm font-semibold">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@gmail.com"
            autoComplete="off"
            className="mt-1.5 w-full rounded-2xl border border-[#ADBC9F] bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[#8DB255]"
          />
        </label>
        <div>
          <p className="text-sm font-semibold">Role</p>
          <div className="mt-1.5">
            <RolePicker value={role} onChange={setRole} />
          </div>
          <p key={role} className="mt-2 text-pretty text-xs text-[#436850]">
            {role === "admin"
              ? "Admins create booking codes, edit packages and stock, and manage the team. They can also use tour leader tools."
              : "Tour leaders create bottle QR codes during trips and hand over redeemed souvenirs."}
          </p>
        </div>
        {error && <p role="alert" className="text-sm font-semibold text-[#A33A12]">{error}</p>}
        {added && <p key={added} className="rounded-2xl bg-[#DDE5BE] px-4 py-3 text-sm font-semibold text-[#03603F]">{added}</p>}
        <button
          disabled={busy}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-white disabled:opacity-70"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}
          Add
        </button>
        <p className="text-pretty text-xs text-[#436850]">
          They can add the email before signing up. Their tools appear in Profile once they sign in with this email and verify it
          (Google sign-in counts as verified).
        </p>
      </form>

      <div className="space-y-5">
        {items === null && !error && (
          <p className="flex items-center gap-2 text-sm text-[#436850]">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </p>
        )}
        {items && (
          <>
            <section>
              <h2 className="title-section flex items-center gap-2 text-black">
                <Flag className="h-5 w-5" /> Tour leaders
                <span translate="no" className="notranslate rounded-full bg-[#DDE5BE] px-2 text-sm">{leaders.length}</span>
              </h2>
              {leaders.length === 0 ? (
                <p className="mt-2 rounded-3xl border-2 border-dashed border-[#ADBC9F] px-5 py-6 text-center text-sm text-[#436850]">
                  No tour leaders yet. Add one with their email.
                </p>
              ) : (
                <ul className="mt-3 grid gap-3 xl:grid-cols-2">
                  {leaders.map((member) => (
                    <MemberRow key={member.email} member={member} me={myEmail} onChanged={reload} onError={setError} />
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h2 className="title-section flex items-center gap-2 text-black">
                <ShieldCheck className="h-5 w-5" /> Admins
                <span translate="no" className="notranslate rounded-full bg-[#DDE5BE] px-2 text-sm">{admins.length}</span>
              </h2>
              <ul className="mt-3 grid gap-3 xl:grid-cols-2">
                {admins.map((member) => (
                  <MemberRow key={member.email} member={member} me={myEmail} onChanged={reload} onError={setError} />
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
