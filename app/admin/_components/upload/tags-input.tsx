import type { KeyboardEvent } from "react";

export function TagsInput({
  tags,
  tagDraft,
  onTagDraftChange,
  onTagKeyDown,
  onTagCommit,
  onTagRemove,
}: {
  tags: string[];
  tagDraft: string;
  onTagDraftChange: (value: string) => void;
  onTagKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onTagCommit: () => void;
  onTagRemove: (tag: string) => void;
}) {
  return (
    <div>
      <label htmlFor="design-tags" className="block text-sm font-medium">
        Tags
      </label>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        Type a tag and press Enter or comma. Use semicolons for several at once.
      </p>
      <div className="mt-2 flex min-h-[42px] flex-wrap gap-2 rounded-lg border border-neutral-300 bg-transparent px-2 py-1.5 dark:border-neutral-600">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => onTagRemove(tag)}
              className="rounded p-0.5 hover:bg-neutral-300 dark:hover:bg-neutral-600"
              aria-label={`Remove tag ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="design-tags"
          type="text"
          value={tagDraft}
          onChange={(e) => onTagDraftChange(e.target.value)}
          onKeyDown={onTagKeyDown}
          onBlur={onTagCommit}
          placeholder={"Add tag…"}
          className="min-w-[120px] flex-1 bg-transparent py-1 text-sm outline-none"
        />
      </div>
    </div>
  );
}
