'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { updateSeriesAction } from '../actions';

interface EditSeriesButtonProps {
  seriesId: string;
  initialTitle: string;
  initialDescription?: string | null;
}

export function EditSeriesButton({
  seriesId,
  initialTitle,
  initialDescription,
}: EditSeriesButtonProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  function handleOpen() {
    setTitle(initialTitle);
    setDescription(initialDescription ?? '');
    setError('');
    setOpen(true);
  }

  async function handleSubmit() {
    if (!title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }

    setPending(true);
    setError('');
    try {
      await updateSeriesAction(seriesId, {
        title: title.trim(),
        description: description.trim() || null,
      });
      setOpen(false);
    } catch (err) {
      console.error('[EditSeriesButton] 수정 실패:', err);
      setError('수정에 실패했습니다');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="rounded border border-border px-3 py-1 text-fg-muted text-xs transition-colors hover:text-fg"
      >
        수정
      </button>

      {open &&
        createPortal(
          // biome-ignore lint/a11y/useKeyWithClickEvents: 배경 클릭 닫기용
          // biome-ignore lint/a11y/noStaticElementInteractions: 배경 오버레이 클릭 닫기
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => {
              if (!pending) setOpen(false);
            }}
          >
            {/* biome-ignore lint/a11y/useKeyWithClickEvents: 이벤트 전파 차단 전용 */}
            {/* biome-ignore lint/a11y/noStaticElementInteractions: 배경 클릭 이벤트 전파 차단용 */}
            <div
              className="mx-4 w-full max-w-sm rounded-xl border border-border bg-bg p-6 shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-4 font-semibold text-fg text-sm">시리즈 수정</h2>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="시리즈 제목"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={pending}
                  className="w-full rounded border border-border bg-bg px-3 py-2 text-fg text-sm placeholder:text-fg-muted focus:border-fg-muted focus:outline-none disabled:opacity-50"
                />
                <textarea
                  placeholder="설명 (선택)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  disabled={pending}
                  className="w-full resize-none rounded border border-border bg-bg px-3 py-2 text-fg text-sm placeholder:text-fg-muted focus:border-fg-muted focus:outline-none disabled:opacity-50"
                />
              </div>

              {error && <p className="mt-2 text-red-500 text-xs">{error}</p>}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="rounded-lg border border-border px-4 py-2 text-fg-muted text-xs transition-colors hover:text-fg disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={pending}
                  className="rounded-lg bg-fg px-4 py-2 text-bg text-xs transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {pending ? '저장 중…' : '저장'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
