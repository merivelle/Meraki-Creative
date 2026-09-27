"use client";

import { useRouter } from "next/navigation";
import { Uploader } from "./Uploader";
import { completeAssetUpload, prepareAssetUpload } from "@/app/portal/actions";

export function AssetUploader({ requestId, accept, hint }: { requestId: string; accept: string; hint: string }) {
  const router = useRouter();
  return (
    <>
      <Uploader
        prepare={(meta) => prepareAssetUpload(requestId, meta)}
        complete={(fileId) => completeAssetUpload(requestId, fileId)}
        accept={accept}
        onDone={() => router.refresh()}
      />
      <p className="muted-note">Accepted: {hint}.</p>
    </>
  );
}
