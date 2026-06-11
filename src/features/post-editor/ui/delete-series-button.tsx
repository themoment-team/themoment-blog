'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { deleteSeriesAction } from '../actions';

interface DeleteSeriesButtonProps {
  seriesId: string;
  title: string;
  postCount: number;
}

export function DeleteSeriesButton({ seriesId, title, postCount }: DeleteSeriesButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await deleteSeriesAction(seriesId);
      setOpen(false);
    } catch (err) {
      console.error('[DeleteSeriesButton] 삭제 실패:', err);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-red-400 text-xs transition-colors hover:text-red-500"
      >
        삭제
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
              <h2 className="mb-2 font-semibold text-fg text-sm">시리즈 삭제</h2>
              <p className="mb-1 text-fg text-sm font-medium">{title}</p>
              <p className="mb-6 text-fg-muted text-sm">
                {postCount > 0
                  ? `이 시리즈에 ${postCount}개의 글이 있습니다. 삭제하면 글들은 시리즈에서 분리되며 복구할 수 없습니다.`
                  : '이 시리즈를 삭제하시겠습니까?'}
              </p>
              <div className="flex justify-end gap-2">
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
                  onClick={handleConfirm}
                  disabled={pending}
                  className="rounded-lg bg-red-500 px-4 py-2 text-white text-xs transition-colors hover:bg-red-600 disabled:opacity-50"
                >
                  {pending ? '삭제 중…' : '삭제'}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
