import { NAIL_SHAPES, type NailShape } from "@/lib/designInterface";

export function UploadBasicFields({
  designName,
  shape,
  priceInput,
  onNameChange,
  onShapeChange,
  onPriceChange,
}: {
  designName: string;
  shape: NailShape;
  priceInput: string;
  onNameChange: (value: string) => void;
  onShapeChange: (value: NailShape) => void;
  onPriceChange: (value: string) => void;
}) {
  return (
    <>
      <div>
        <label htmlFor="design-name" className="block text-sm font-medium">
          Name
        </label>
        <input
          id="design-name"
          name="name"
          type="text"
          value={designName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. Snowy Mountains"
          required
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
        />
      </div>

      <div>
        <label htmlFor="design-shape" className="block text-sm font-medium">
          Nail shape
        </label>
        <select
          id="design-shape"
          name="shape"
          value={shape}
          onChange={(e) => onShapeChange(e.target.value as NailShape)}
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600 dark:bg-neutral-900 dark:text-neutral-100"
        >
          {NAIL_SHAPES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="design-price" className="block text-sm font-medium">
          Price <span className="font-normal text-neutral-500 dark:text-neutral-400">(optional)</span>
        </label>
        <input
          id="design-price"
          name="price"
          type="text"
          inputMode="decimal"
          value={priceInput}
          onChange={(e) => onPriceChange(e.target.value)}
          placeholder="e.g. 45 or 45.00"
          className="mt-2 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-neutral-400 dark:border-neutral-600"
        />
      </div>
    </>
  );
}
