"use client";

import React from "react";
import CommentThread, { SquareComment } from "./CommentThread";

export interface SquarePost {
    id: number;
    author: string;
    avatar: string | null;
    avatarImage: string | null;
    verified: boolean;
    role: string;
    time: string;
    sentiment: string;
    sentimentIcon: string;
    sentimentColor: string;
    ticker: string;
    content: string;
    likes: number;
    comments: number;
    reposts: number;
    views: string;
    hasChart: boolean;
    isLiked: boolean;
    replies: SquareComment[];
    isQuote?: boolean;
    quotedPost?: any;
    postImage?: string | null;
    poll?: { question: string; options: { text: string; votes: number }[] } | null;
}

interface InsightCardProps {
    post: SquarePost;
    user: any;
    handleLike: (postId: number) => void;
    handleReply: (postId: number, parentCommentId: number | null, image?: string | null) => void;
    handleCommentLike: (postId: number, commentId: number) => void;
    setReplyingTo: (val: { postId: number; commentId: number | null; author: string } | null) => void;
    replyingTo: { postId: number; commentId: number | null; author: string } | null;
    replyText: string;
    setReplyText: (val: string) => void;
    setReposting: (post: SquarePost) => void;
    renderContent: (content: string) => React.ReactNode;
}

const InsightCard: React.FC<InsightCardProps> = ({
    post,
    user,
    handleLike,
    handleReply,
    handleCommentLike,
    setReplyingTo,
    replyingTo,
    replyText,
    setReplyText,
    setReposting,
    renderContent
}) => {
    const [replyImage, setReplyImage] = React.useState<string | null>(null);

    const handleImageUploadReply = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        <article className="p-4 bg-[#121212] border border-neutral-dark-border rounded-2xl hover:bg-neutral-dark-surface/50 hover:border-primary/50 transition-all cursor-pointer group relative flex flex-col min-h-[300px] shadow-sm w-full max-w-full overflow-hidden">
            <div className="flex gap-3 h-full">
                <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-dark-surface border border-neutral-dark-border flex items-center justify-center overflow-hidden font-bold text-white">
                    {post.avatarImage ? (
                        <img src={post.avatarImage} alt={post.author} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-primary text-xs">{post.avatar}</span>
                    )}
                </div>
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 truncate">
                            <span className="text-white font-bold text-sm hover:text-primary transition-colors truncate">{post.author}</span>
                            {post.verified && <span className="material-symbols-outlined text-primary text-[16px] shrink-0">verified</span>}
                        </div>
                        <span className="text-slate-500 text-[10px] shrink-0">{post.time}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-1">
                        <span className={`${post.sentimentColor} font-bold text-[10px] px-2 py-0.5 rounded flex items-center gap-1`}>
                            <span className="material-symbols-outlined text-[14px]">{post.sentimentIcon}</span> {post.sentiment}
                        </span>
                        {post.ticker && <span className="text-slate-400 text-[10px] font-medium">{post.ticker}</span>}
                    </div>

                    <p className="text-slate-200 text-sm leading-relaxed mb-3 break-words whitespace-pre-wrap overflow-wrap-anywhere w-full">
                        {renderContent(post.content)}
                    </p>

                    {/* Post Image Display */}
                    {post.postImage && (
                        <div className="mb-4 rounded-xl overflow-hidden border border-neutral-dark-border shadow-lg max-h-40">
                            <img src={post.postImage} alt="Post content" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Poll Display */}
                    {post.poll && (
                        <div className="mb-4 p-4 rounded-xl bg-neutral-dark-surface/50 border border-neutral-dark-border/50">
                            <div className="flex flex-col gap-2">
                                {post.poll.options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        className="w-full text-left p-3 rounded-lg bg-black/40 border border-neutral-dark-border hover:border-primary/50 transition-all group/poll"
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-slate-300 group-hover/poll:text-white">{opt.text}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">0%</span>
                                        </div>
                                        <div className="mt-2 h-1 w-full bg-neutral-dark-border rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/20 w-0 transition-all duration-1000"></div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {post.isQuote && post.quotedPost && (
                        <div className="border border-neutral-dark-border rounded-2xl p-4 mb-3 hover:bg-neutral-dark-surface transition-colors cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-5 w-5 rounded-full bg-neutral-dark-surface flex items-center justify-center text-[10px] font-bold border border-neutral-dark-border">
                                    {post.quotedPost.avatar}
                                </div>
                                <span className="text-white font-bold text-xs">{post.quotedPost.author}</span>
                                <span className="text-slate-500 text-xs">• {post.quotedPost.time}</span>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                                {renderContent(post.quotedPost.content)}
                            </p>
                        </div>
                    )}

                    {post.hasChart && (
                        <div className="w-full h-32 bg-neutral-dark-surface rounded-lg border border-neutral-dark-border p-3 mb-3 relative overflow-hidden group-hover:border-primary/50 transition-colors flex items-center justify-center">
                            <span className="text-slate-500 text-xs italic">Visualização de gráfico simplificada</span>
                        </div>
                    )}

                    <div className="mt-auto pt-2 flex items-center justify-between border-t border-neutral-dark-border/30">
                        <div className="flex gap-4 text-slate-500 justify-between w-full">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleLike(post.id);
                                }}
                                className={`flex items-center gap-1.5 transition-all text-[11px] ${post.isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
                            >
                                <span className={`material-symbols-outlined text-[18px] ${post.isLiked ? 'icon-filled' : ''}`}>favorite</span>
                                <span className="font-bold">{post.likes}</span>
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setReplyingTo(replyingTo?.postId === post.id && replyingTo?.commentId === null ? null : { postId: post.id, commentId: null, author: post.author });
                                }}
                                className={`flex items-center gap-1.5 hover:text-primary transition-all text-[11px] ${replyingTo?.postId === post.id && replyingTo?.commentId === null ? 'text-primary' : ''}`}
                            >
                                <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                                <span className="font-bold">{post.comments}</span>
                            </button>

                            <button className="flex items-center gap-1.5 hover:text-primary transition-all text-[11px] hidden sm:flex">
                                <span className="material-symbols-outlined text-[18px]">bar_chart</span>
                                <span className="font-bold">{post.views}</span>
                            </button>
                        </div>
                    </div>

                    {/* Expandable Replies Section */}
                    {replyingTo?.postId === post.id && replyingTo?.commentId === null && (
                        <div className="mt-4 pt-4 border-t border-neutral-dark-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                            <div className="flex gap-3 mb-4">
                                <div className="h-8 w-8 shrink-0 rounded-full bg-neutral-dark-surface border border-neutral-dark-border flex items-center justify-center overflow-hidden">
                                    <span className="text-primary text-[10px] font-bold">{user?.name?.substring(0, 2).toUpperCase() || "TA"}</span>
                                </div>
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="relative">
                                        <textarea
                                            autoFocus
                                            className="w-full bg-neutral-dark-surface border border-neutral-dark-border rounded-xl p-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary transition-all resize-none"
                                            placeholder="Escreva sua resposta..."
                                            rows={replyImage ? 1 : 2}
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                        ></textarea>

                                        {/* Preview Image for Reply */}
                                        {replyImage && (
                                            <div className="mt-2 relative inline-block group/preview">
                                                <div className="rounded-xl overflow-hidden border border-neutral-dark-border shadow-lg max-h-48 max-w-full">
                                                    <img src={replyImage} alt="Preview" className="w-full h-full object-cover" />
                                                </div>
                                                <button
                                                    onClick={() => setReplyImage(null)}
                                                    className="absolute -top-2 -right-2 bg-black/60 text-white rounded-full p-1.5 border border-neutral-dark-border hover:bg-black transition-colors"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">close</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-center px-1">
                                        <div className="flex items-center gap-3 text-slate-500">
                                            <label className="cursor-pointer hover:text-primary transition-colors flex items-center">
                                                <span className="material-symbols-outlined text-[20px]">image</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUploadReply} />
                                            </label>
                                            <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-primary transition-colors">sentiment_satisfied</span>
                                            <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-primary transition-colors">bar_chart</span>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReplyingTo(null);
                                                    setReplyImage(null);
                                                }}
                                                className="px-3 py-1 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReply(post.id, null, replyImage);
                                                    setReplyImage(null);
                                                }}
                                                disabled={!replyText.trim() && !replyImage}
                                                className="bg-primary text-black px-4 py-1 rounded-full font-bold text-xs hover:bg-primary-hover transition-colors disabled:opacity-50"
                                            >
                                                Responder
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recursive Comment List */}
                    <div className="mt-4 flex flex-col gap-1">
                        {post.replies.map(reply => (
                            <CommentThread
                                key={reply.id}
                                comment={reply}
                                postId={post.id}
                                depth={0}
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
                </div>
            </div>
        </article>
    );
};

export default InsightCard;
