'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AddressForm, type AddressValues } from './address-form';
import { deleteAddressAction, setDefaultAddressAction } from '@/actions/address';

export function AddressManager({ addresses }: { addresses: AddressValues[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(addresses.length === 0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function refresh() {
    setEditing(null);
    setAdding(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {addresses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="border border-line bg-white p-5">
              {editing === a.id ? (
                <>
                  <h3 className="mb-4 font-display text-lg text-ink">Edit address</h3>
                  <AddressForm values={a} onDone={refresh} submitLabel="Save changes" />
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="mt-3 text-sm text-ink-3 hover:underline"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-ink">{a.fullName}</p>
                    {a.isDefault && (
                      <span className="bg-leaf-3 px-2 py-0.5 text-[11px] font-medium text-leaf">
                        Default
                      </span>
                    )}
                  </div>
                  <address className="mt-2 text-sm not-italic leading-relaxed text-ink-2">
                    {a.line1}
                    {a.line2 && (
                      <>
                        <br />
                        {a.line2}
                      </>
                    )}
                    {a.landmark && (
                      <>
                        <br />
                        {a.landmark}
                      </>
                    )}
                    <br />
                    {a.city}, {a.state} {a.pincode}
                    <br />
                    {a.phone}
                  </address>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm">
                    <button
                      type="button"
                      onClick={() => setEditing(a.id!)}
                      className="text-leaf hover:underline"
                    >
                      Edit
                    </button>
                    {!a.isDefault && (
                      <>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await setDefaultAddressAction(a.id!);
                              router.refresh();
                            })
                          }
                          className="text-ink-2 hover:underline"
                        >
                          Set as default
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              await deleteAddressAction(a.id!);
                              router.refresh();
                            })
                          }
                          className="text-clay hover:underline"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {adding ? (
        <div className="border border-line bg-white p-6">
          <h3 className="mb-4 font-display text-lg text-ink">Add an address</h3>
          <AddressForm onDone={refresh} />
          {addresses.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="mt-3 text-sm text-ink-3 hover:underline"
            >
              Cancel
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="border border-ink px-5 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white"
        >
          Add a new address
        </button>
      )}
    </div>
  );
}
