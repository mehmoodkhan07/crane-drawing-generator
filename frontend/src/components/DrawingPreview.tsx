import { useEffect, useRef, useState, useCallback } from 'react';
import type { CraneFormData, ValidationError } from '../types';
import { apiPreview, svgDownloadUrl } from '../api';

interface Props {
  form: CraneFormData;
  editingId: number | null;
  onPreviewErrors: (errors: ValidationError[]) => void;
}

type PreviewState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; svg: string }
  | { status: 'error'; message: string };

export function DrawingPreview({ form, editingId, onPreviewErrors }: Props) {
  const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPreview = useCallback(
    (data: CraneFormData) => {
      // Cancel any in-flight request
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      setPreview({ status: 'loading' });

      apiPreview(data, ctrl.signal)
        .then((res) => {
          onPreviewErrors([]);
          setPreview({ status: 'ok', svg: res.svg });
        })
        .catch((err: unknown) => {
          if (err instanceof Error && err.name === 'AbortError') return; // stale — ignore
          if (err && typeof err === 'object' && 'errors' in err) {
            onPreviewErrors((err as { errors: ValidationError[] }).errors);
            setPreview({ status: 'error', message: 'Fix the errors above to see the preview.' });
          } else {
            onPreviewErrors([]);
            setPreview({ status: 'error', message: 'Preview unavailable (backend unreachable).' });
          }
        });
    },
    [onPreviewErrors]
  );

  // Debounce: fire preview 400ms after last form change
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => fetchPreview(form), 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [form, fetchPreview]);

  // Build a safe blob URL for the SVG (not dangerouslySetInnerHTML)
  const blobUrl = useRef<string | null>(null);
  if (preview.status === 'ok') {
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    blobUrl.current = URL.createObjectURL(
      new Blob([preview.svg], { type: 'image/svg+xml' })
    );
  }

  return (
    <div className="drawing-preview">
      <div className="preview-header">
        <h3>Drawing Preview</h3>
        {editingId && (
          <a
            className="btn-secondary"
            href={svgDownloadUrl(editingId)}
            download={`crane-${editingId}.svg`}
          >
            ↓ Download SVG
          </a>
        )}
      </div>

      {preview.status === 'idle' && (
        <div className="preview-placeholder">Fill the form to see the drawing preview.</div>
      )}
      {preview.status === 'loading' && (
        <div className="preview-placeholder">Generating preview…</div>
      )}
      {preview.status === 'error' && (
        <div className="preview-error">{preview.message}</div>
      )}
      {preview.status === 'ok' && blobUrl.current && (
        <img
          className="preview-svg"
          src={blobUrl.current}
          alt="Crane engineering drawing preview"
        />
      )}
    </div>
  );
}
