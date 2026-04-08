"use client";

import { UploadBasicFields } from "./_components/upload/basic-fields";
import { GalleryDropzone } from "./_components/upload/gallery-dropzone";
import { GalleryPreview } from "./_components/upload/gallery-preview";
import { UploadSubmitActions } from "./_components/upload/submit-actions";
import { UploadSubmitStatus } from "./_components/upload/submit-status";
import { TagsInput } from "./_components/upload/tags-input";
import { useGalleryDropzone } from "./_hooks/use-gallery-dropzone";
import { useTagsInput } from "./_hooks/use-tags-input";
import { useUploadForm } from "./_hooks/use-upload-form";

export function AdminUploadForm() {
  const upload = useUploadForm();
  const gallery = useGalleryDropzone();
  const tags = useTagsInput();

  async function handleUploadFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    await upload.submit({
      galleryFiles: gallery.galleryFiles,
      resolvedTags: tags.tagsForSubmit(),
      onSuccess: () => {
        upload.reset();
        gallery.reset();
        tags.reset();
      },
    });
  }

  function clearForm() {
    upload.reset();
    gallery.reset();
    tags.reset();
  }

  return (
    <form onSubmit={(e) => void handleUploadFormSubmit(e)} className="mt-8 space-y-8">
      <UploadSubmitStatus
        submitError={upload.submitError}
        submitSuccess={upload.submitSuccess}
      />

      <UploadBasicFields
        designName={upload.designName}
        shape={upload.shape}
        priceInput={upload.priceInput}
        onNameChange={upload.setDesignName}
        onShapeChange={upload.setShape}
        onPriceChange={upload.setPriceInput}
      />

      <GalleryDropzone
        dragGallery={gallery.dragGallery}
        galleryInputRef={gallery.galleryInputRef}
        onDragGalleryChange={gallery.setDragGallery}
        onAddGalleryFromList={gallery.addGalleryFromList}
      />

      <GalleryPreview
        galleryFiles={gallery.galleryFiles}
        galleryPreviewUrls={gallery.galleryPreviewUrls}
        onRemove={gallery.removeGalleryAt}
      />

      <TagsInput
        tags={tags.tags}
        tagDraft={tags.tagDraft}
        onTagDraftChange={tags.setTagDraft}
        onTagKeyDown={tags.handleTagKeyDown}
        onTagCommit={tags.commitTagFromDraft}
        onTagRemove={tags.removeTag}
      />

      <UploadSubmitActions
        submitting={upload.submitting}
        disabled={upload.submitting || gallery.galleryFiles.length === 0 || !upload.designName.trim()}
        onClear={clearForm}
      />
    </form>
  );
}
