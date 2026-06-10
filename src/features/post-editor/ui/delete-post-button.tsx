"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { deletePostAction } from "../actions";

interface DeletePostButtonProps {
  postId: string;
  published: boolean;
}

export function DeletePostButton({ postId, published }: DeletePostButtonProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleConfirm() {
    setPending(true);
    try {
      await deletePostAction(postId);
      setOpen(false);
    } catch (err) {
      console.error("[DeletePostButton] 삭제 실패:", err);
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-400 hover:text-red-500 transition-colors"
      >
        삭제
      </button>

      {open &&
        createPortal(
          // biome-ignore lint/a11y/useKeyWithClickEvents: Escape는 아래 useEffect 없이 처리 불가, 단순 배경 닫기용
          // biome-ignore lint/a11y/noStaticElementInteractions: 배경 오버레이 클릭 닫기
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => {
              if (!pending) setOpen(false);
            }}
          >
            <div
              className="bg-bg border border-border rounded-xl shadow-lg w-full max-w-sm mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-sm font-semibold text-fg mb-2">글 삭제</h2>
              <p className="text-sm text-fg-muted mb-6">
                {published
                  ? "발행된 글을 삭제하면 복구할 수 없습니다. 정말 삭제하시겠습니까?"
                  : "임시저장 글을 삭제하시겠습니까?"}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="px-4 py-2 text-xs text-fg-muted hover:text-fg border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={pending}
                  className="px-4 py-2 text-xs text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  {pending ? "삭제 중…" : "삭제"}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
