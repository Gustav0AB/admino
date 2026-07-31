import { useTrackerStore } from "@/shared/store/trackerStore";

export function EvidenceUploader() {
  const { evidenceUris, addEvidenceUri, removeEvidenceUri } = useTrackerStore();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-gray-900">Evidence Upload</h2>
      {evidenceUris.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {evidenceUris.map((uri) => (
            <div key={uri} className="relative">
              <img src={uri} alt="" className="h-20 w-20 rounded-lg border border-gray-200 object-cover" />
              <button
                type="button"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                onClick={() => removeEvidenceUri(uri)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <span className="text-2xl">📎</span>
        <span className="mt-1 text-sm text-gray-500">Click to add photos or videos</span>
        <span className="text-xs text-gray-400">{evidenceUris.length > 0 ? `${evidenceUris.length} file(s) selected` : "Images & videos accepted"}</span>
        <input
          className="hidden"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={(event) => {
            for (const file of Array.from(event.target.files ?? [])) {
              addEvidenceUri(URL.createObjectURL(file));
            }
          }}
        />
      </label>
    </div>
  );
}
