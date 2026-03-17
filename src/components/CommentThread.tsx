"use client";

import React from "react";

export interface SquareComment {
    id: number;
    author: string;
    avatar: string | null;
    content: string;
    time: string;
    likes: number;
    isLiked: boolean;
    replies: SquareComment[];
    image?: string | null;
}

interface CommentThreadProps {
    comment: SquareComment;
    postId: number;
    depth: number;
    user: any;
    replyingTo: { postId: number; commentId: number | null; author: string } | null;
    setReplyingTo: (val: { postId: number; commentId: number | null; author: string } | null) => void;
    replyText: string;
    setReplyText: (val: string) => void;
    handleReply: (postId: number, parentCommentId: number | null, image?: string | null) => void;
    handleCommentLike: (postId: number, commentId: number) => void;
}

const CommentThread: React.FC<CommentThreadProps> = ({
    comment,
    postId,
    depth,
    user,
    replyingTo,
    setReplyingTo,
    replyText,
    setReplyText,
    handleReply,
    handleCommentLike
}) => {
    const isCurrentReplying = replyingTo?.postId === postId && replyingTo?.commentId === comment.id;
    const [replyImage, setReplyImage] = React.useState<string | null>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setReplyImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="mt-2 group/thread">
            <div className="flex gap-3 relative">
                {/* Vertical line connector */}
                {depth > 0 && (
                    <div className="absolute -left-4 top-0 bottom-0 w-[1.5px] bg-neutral-dark-border/30"></div>
                )}

                <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-dark-surface border border-neutral-dark-border flex items-center justify-center overflow-hidden z-10 shadow-sm">
                    <span className="text-primary text-[10px] font-bold">{comment.avatar}</span>
                </div>

                <div className="flex-1">
                    <div className="bg-neutral-dark-surface/30 rounded-2xl p-3 border border-transparent group-hover/thread:border-neutral-dark-border/40 transition-all">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-200 text-xs">{comment.author}</span>
                            <span className="text-slate-500 text-[10px]">• {comment.time}</span>
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed mb-1 break-words whitespace-pre-wrap overflow-wrap-anywhere w-full">
                            {comment.content}
                        </p>
                        {comment.image && (
                            <div className="mt-2 rounded-xl overflow-hidden border border-neutral-dark-border/50 max-h-64 w-full shadow-md hover:border-primary/30 transition-all">
                                <img src={comment.image} alt="Comment content" className="w-full h-full object-cover" />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-6 mt-1.5 ml-2 text-slate-500">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCommentLike(postId, comment.id);
                            }}
                            className={`flex items-center gap-1.5 transition-colors hover:text-pink-500 hover:scale-105 active:scale-95 ${comment.isLiked ? 'text-pink-500' : ''}`}
                        >
                            <span className={`material-symbols-outlined text-[16px] ${comment.isLiked ? 'icon-filled' : ''}`}>favorite</span>
                            <span className="text-[10px] font-bold">{comment.likes}</span>
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setReplyingTo({ postId, commentId: comment.id, author: comment.author });
                            }}
                            className={`flex items-center gap-1.5 transition-colors hover:text-primary hover:scale-105 active:scale-95 ${isCurrentReplying ? 'text-primary' : ''}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                            <span className="text-[10px] font-bold">Responder</span>
                        </button>
                        <button className="flex items-center gap-1.5 transition-colors hover:text-[#11d473] hover:scale-105">
                            <span className="material-symbols-outlined text-[16px]">repeat</span>
                        </button>
                        <button className="flex items-center gap-1.5 transition-colors hover:text-primary hover:scale-105">
                            <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                        </button>
                    </div>

                    {/* Nested Reply Input */}
                    {isCurrentReplying && (
                        <div className="mt-3 flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="relative">
                                    <textarea
                                        autoFocus
                                        className="w-full bg-neutral-dark-surface border border-neutral-dark-border rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-primary transition-all resize-none shadow-inner"
                                        placeholder={`Respondendo a @${comment.author}...`}
                                        rows={replyImage ? 1 : 2}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    ></textarea>

                                    {/* Preview Image for Reply */}
                                    {replyImage && (
                                        <div className="mt-2 relative inline-block group/preview">
                                            <div className="rounded-xl overflow-hidden border border-neutral-dark-border shadow-lg max-h-32 max-w-[200px]">
                                                <img src={replyImage} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                onClick={() => setReplyImage(null)}
                                                className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1 border border-neutral-dark-border hover:bg-black transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">close</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between items-center px-1">
                                    <div className="flex items-center gap-3 text-slate-500">
                                        <label className="cursor-pointer hover:text-primary transition-colors flex items-center">
                                            <span className="material-symbols-outlined text-[18px]">image</span>
                                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                                        </label>
                                        <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary transition-colors">sentiment_satisfied</span>
                                        <span className="material-symbols-outlined text-[18px] cursor-pointer hover:text-primary transition-colors">bar_chart</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setReplyImage(null);
                                            }}
                                            className="px-3 py-1 rounded-full text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleReply(postId, comment.id, replyImage);
                                                setReplyImage(null);
                                            }}
                                            disabled={!replyText.trim() && !replyImage}
                                            className="bg-primary text-black px-4 py-1 rounded-full font-bold text-[10px] hover:bg-primary-hover transition-colors disabled:opacity-50"
                                        >
                                            Responder
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rendering nested replies with indentation and line connection */}
                    {comment.replies.length > 0 && (
                        <div className="mt-3 pl-4 border-l border-neutral-dark-border/20 flex flex-col gap-2">
                            {comment.replies.map((nestedReply) => (
                                <CommentThread
                                    key={nestedReply.id}
                                    comment={nestedReply}
                                    postId={postId}
                                    depth={depth + 1}
                                    user={user}
                                    replyingTo={replyingTo}
                                    setReplyingTo={setReplyingTo}
                                    replyText={replyText}
                                    setReplyText={setReplyText}
                                    handleReply={handleReply}
                                    handleCommentLike={handleCommentLike}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommentThread;
