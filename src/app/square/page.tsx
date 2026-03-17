"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/lib/useAuth";
import InsightCard, { SquarePost } from "@/components/InsightCard";
import { SquareComment } from "@/components/CommentThread";

export default function SquarePage() {
    const { user, hasMounted: authMounted } = useAuth();
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
        // Load posts from localStorage on mount
        const savedPosts = localStorage.getItem('square_posts');
        if (savedPosts) {
            try {
                setPosts(JSON.parse(savedPosts));
            } catch (err) {
                console.error("Failed to parse saved posts:", err);
            }
        }
    }, []);

    const [postText, setPostText] = useState("");

    const [posts, setPosts] = useState<SquarePost[]>([
        {
            id: 1,
            author: "Marcus Thorne",
            avatar: "MT",
            avatarImage: null,
            verified: true,
            role: "Analista Elite",
            time: "2h",
            sentiment: "Pessimista",
            sentimentIcon: "trending_down",
            sentimentColor: "text-[#ef4444] bg-[#ef4444]/10",
            ticker: "$TSLA",
            content: "Breakout confirmado abaixo da EMA200 ($TSLA). Relação risco/recompensa desfavorável com compressão de margens e inventory buildup. Suporte crítico em $180 como zona de reteste técnica.",
            likes: 156,
            comments: 24,
            reposts: 12,
            views: "2.4k",
            hasChart: true,
            isLiked: false,
            replies: [
                {
                    id: 101,
                    author: "Jean Pierre",
                    avatar: "JP",
                    content: "Concordo totalmente. O suporte de $180 parece inevitável agora.",
                    time: "1h",
                    likes: 12,
                    isLiked: false,
                    replies: []
                }
            ]
        },
        {
            id: 2,
            author: "Sarah Lin",
            avatar: "SL",
            avatarImage: null,
            verified: true,
            role: "Analista",
            time: "4h",
            sentiment: "Otimista",
            sentimentIcon: "trending_up",
            sentimentColor: "text-[#11d473] bg-[#11d473]/10",
            ticker: "$NVDA",
            content: "Acúmulo institucional detectado em $NVDA. Projeção de Fibonacci atingida no curto prazo, mas demanda resiliente por H100 sugere upside remanescente. Manter viés de alta estrutural. 🚀",
            likes: 86,
            comments: 8,
            reposts: 4,
            views: "1.1k",
            hasChart: false,
            isLiked: false,
            replies: []
        }
    ]);

    // Save posts to localStorage whenever they change
    useEffect(() => {
        if (hasMounted) {
            localStorage.setItem('square_posts', JSON.stringify(posts));
        }
    }, [posts, hasMounted]);


    const [replyingTo, setReplyingTo] = useState<{ postId: number, commentId: number | null, author: string } | null>(null);
    const [replyText, setReplyText] = useState("");
    const [reposting, setReposting] = useState<SquarePost | null>(null);

    // Rich Posting States
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showPollCreator, setShowPollCreator] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [selectedMood, setSelectedMood] = useState<{ label: string, icon: string, color: string } | null>(null);
    const [showMoodSelector, setShowMoodSelector] = useState(false);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePost = (customText?: string, isQuote?: boolean, originalPost?: any) => {
        const text = customText || postText;
        if (!text.trim() && !selectedImage) return;

        const userName = user?.name || "Trader Anônimo";
        const userAvatar = user?.avatarImage ? null : (user?.name?.substring(0, 2).toUpperCase() || "TA");

        const newPostObj: SquarePost = {
            id: Date.now(),
            author: userName,
            avatar: userAvatar as string | null,
            avatarImage: user?.avatarImage || null,
            verified: false,
            role: "Trader",
            time: "agora",
            sentiment: selectedMood?.label || "Neutro",
            sentimentIcon: selectedMood?.icon || "balance",
            sentimentColor: selectedMood?.color || "text-slate-400 bg-slate-400/10",
            ticker: "",
            content: text,
            likes: 0,
            comments: 0,
            reposts: 0,
            views: "1",
            hasChart: !!selectedImage,
            isLiked: false,
            replies: [],
            isQuote,
            quotedPost: originalPost,
            postImage: selectedImage,
            poll: showPollCreator && pollOptions.every((o: string) => o.trim()) ? {
                question: "O que você acha?",
                options: pollOptions.map((o: string) => ({ text: o, votes: 0 }))
            } : null
        };

        setPosts([newPostObj, ...posts]);
        if (!customText) setPostText("");
        if (isQuote) setReposting(null);

        // Reset rich features
        setSelectedImage(null);
        setShowPollCreator(false);
        setPollOptions(["", ""]);
        setSelectedMood(null);
    };

    const handleReply = (postId: number, parentCommentId: number | null, image?: string | null) => {
        if (!replyText.trim() && !image) return;

        const userName = user?.name || "Trader Anônimo";
        const userAvatar = user?.name?.substring(0, 2).toUpperCase() || "TA";

        const newReply: SquareComment = {
            id: Date.now(),
            author: userName,
            avatar: userAvatar,
            content: replyText,
            time: "agora",
            likes: 0,
            isLiked: false,
            replies: [],
            image: image || null
        };

        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                if (parentCommentId === null) {
                    return { ...post, comments: post.comments + 1, replies: [...post.replies, newReply] };
                } else {
                    // Recursive update for nested replies
                    const updateReplies = (replies: SquareComment[]): SquareComment[] => {
                        return replies.map(reply => {
                            if (reply.id === parentCommentId) {
                                return { ...reply, replies: [...reply.replies, newReply] };
                            }
                            return { ...reply, replies: updateReplies(reply.replies) };
                        });
                    };
                    return { ...post, comments: post.comments + 1, replies: updateReplies(post.replies) };
                }
            }
            return post;
        }));

        setReplyText("");
        setReplyingTo(null);
    };

    const handleCommentLike = (postId: number, commentId: number) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                const updateReplies = (replies: SquareComment[]): SquareComment[] => {
                    return replies.map(reply => {
                        if (reply.id === commentId) {
                            return {
                                ...reply,
                                isLiked: !reply.isLiked,
                                likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1
                            };
                        }
                        return { ...reply, replies: updateReplies(reply.replies) };
                    });
                };
                return { ...post, replies: updateReplies(post.replies) };
            }
            return post;
        }));
    };

    const handleLike = (postId: number) => {
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    isLiked: !post.isLiked
                };
            }
            return post;
        }));
    };

    const renderContent = (content: string) => {
        return content.split(/(\$[A-Z0-9]+)/g).map((part, i) => {
            if (part.startsWith("$")) {
                return <span key={i} className="text-primary font-bold">{part}</span>;
            }
            return part;
        });
    };

    const [sentiment, setSentiment] = useState(65);

    const getSentimentLabel = (val: number) => {
        if (val < 25) return { text: "Medo Extremo", color: "text-[#ef4444]", glow: "shadow-[#ef4444]/20" };
        if (val < 45) return { text: "Medo", color: "text-[#f59e0b]", glow: "shadow-[#f59e0b]/20" };
        if (val < 55) return { text: "Neutro", color: "text-slate-400", glow: "shadow-slate-400/20" };
        if (val < 75) return { text: "Ganância", color: "text-[#22c55e]", glow: "shadow-[#22c55e]/20" };
        return { text: "Ganância Extrema", color: "text-[#11d473]", glow: "shadow-[#11d473]/20" };
    };

    const sentimentData = getSentimentLabel(sentiment);

    if (!hasMounted || !authMounted) return null;

    return (
        <div className="bg-black font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <Header currentPath="/square" />

            <main className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 px-4 mt-6 flex-1 h-auto lg:h-[calc(100vh-65px)] lg:overflow-hidden">
                <div className="flex-1 w-full lg:max-w-[700px] xl:max-w-[800px] flex flex-col gap-6 overflow-y-visible lg:overflow-y-auto scrollbar-hide pb-10 lg:pb-20">
                    {/* Feed Header */}
                    <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-neutral-dark-border p-4 mb-4">
                        <div className="relative mb-4">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500">search</span>
                            <input
                                className="w-full bg-neutral-dark-surface border border-neutral-dark-border rounded-full py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm outline-none"
                                placeholder="BUSCAR ATIVOS OU TESES..."
                                type="text"
                            />
                        </div>

                        {/* Top Controls */}
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Feed de Insights</span>
                        </div>

                        {/* Trending Pills */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 pb-1">
                            {["$NVDA", "$BTC", "$ETH", "$SOL", "$PETR4", "$VALE3"].map((ticker) => (
                                <button
                                    key={ticker}
                                    onClick={() => setPostText(prev => prev + ticker + " ")}
                                    className="px-4 py-1.5 rounded-full bg-neutral-dark-surface border border-neutral-dark-border text-xs font-bold text-slate-300 hover:border-primary hover:text-primary transition-all whitespace-nowrap"
                                >
                                    {ticker}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-neutral-dark-surface border border-neutral-dark-border flex items-center justify-center overflow-hidden">
                                {user?.avatarImage ? (
                                    <img src={user.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-primary font-bold">{user?.name?.substring(0, 2).toUpperCase() || "TA"}</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <textarea
                                    className="w-full bg-transparent border-none text-white text-lg placeholder-slate-500 focus:ring-0 resize-none p-0 mb-2 outline-none"
                                    placeholder="COMPARTILHE SUA TESE DE MERCADO..."
                                    rows={2}
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                ></textarea>

                                {/* Image Preview */}
                                {selectedImage && (
                                    <div className="relative inline-block mb-4 mt-2">
                                        <img src={selectedImage} alt="Preview" className="max-h-64 rounded-2xl border border-neutral-dark-border shadow-lg" />
                                        <button
                                            onClick={() => setSelectedImage(null)}
                                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">close</span>
                                        </button>
                                    </div>
                                )}

                                {/* Poll Creator */}
                                {showPollCreator && (
                                    <div className="mb-4 p-4 rounded-2xl bg-neutral-dark-surface border border-neutral-dark-border animate-in fade-in slide-in-from-top-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nova Enquete</span>
                                            <button onClick={() => setShowPollCreator(false)} className="text-slate-500 hover:text-white transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">close</span>
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {pollOptions.map((opt, idx) => (
                                                <input
                                                    key={idx}
                                                    className="w-full bg-black border border-neutral-dark-border rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:border-primary outline-none transition-all"
                                                    placeholder={`Opção ${idx + 1}`}
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...pollOptions];
                                                        newOpts[idx] = e.target.value;
                                                        setPollOptions(newOpts);
                                                    }}
                                                />
                                            ))}
                                            <button
                                                onClick={() => setPollOptions([...pollOptions, ""])}
                                                className="text-primary text-xs font-bold hover:underline self-start mt-1 flex items-center gap-1"
                                            >
                                                <span className="material-symbols-outlined text-[14px]">add</span> Adicionar Opção
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Selected Mood Badge */}
                                {selectedMood && (
                                    <div className="mb-4 animate-in fade-in zoom-in-95">
                                        <span className={`${selectedMood.color} font-bold text-xs px-3 py-1 rounded-full flex items-center gap-1 w-fit border border-current opacity-80`}>
                                            <span className="material-symbols-outlined text-[14px]">{selectedMood.icon}</span>
                                            Mercado {selectedMood.label}
                                            <button onClick={() => setSelectedMood(null)} className="ml-1 hover:text-white">
                                                <span className="material-symbols-outlined text-[12px]">close</span>
                                            </button>
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-neutral-dark-border/50">
                                    <div className="flex gap-2 text-primary relative">
                                        <button
                                            onClick={() => document.getElementById('image-upload')?.click()}
                                            className="p-2 hover:bg-neutral-dark-surface rounded-full transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">image</span>
                                            <input
                                                id="image-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </button>
                                        <button
                                            onClick={() => setShowPollCreator(!showPollCreator)}
                                            className={`p-2 hover:bg-neutral-dark-surface rounded-full transition-colors ${showPollCreator ? 'bg-primary/20 text-white' : ''}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                                        </button>
                                        <div className="relative">
                                            <button
                                                onClick={() => setShowMoodSelector(!showMoodSelector)}
                                                className={`p-2 hover:bg-neutral-dark-surface rounded-full transition-colors ${showMoodSelector ? 'bg-primary/20 text-white' : ''}`}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                                            </button>

                                            {/* Mood Selector Dropdown */}
                                            {showMoodSelector && (
                                                <div className="absolute bottom-full left-0 mb-2 w-48 bg-[#121212] border border-neutral-dark-border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                                                    {([
                                                        { label: "Otimista", icon: "trending_up", color: "text-[#11d473] bg-[#11d473]/10" },
                                                        { label: "Pessimista", icon: "trending_down", color: "text-[#ef4444] bg-[#ef4444]/10" },
                                                        { label: "Neutro", icon: "balance", color: "text-slate-400 bg-slate-400/10" }
                                                    ] as const).map((mood) => (
                                                        <button
                                                            key={mood.label}
                                                            onClick={() => {
                                                                setSelectedMood(mood);
                                                                setShowMoodSelector(false);
                                                            }}
                                                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-dark-surface transition-colors text-sm font-bold text-slate-300 hover:text-white"
                                                        >
                                                            <span className={`material-symbols-outlined ${mood.color.split(' ')[0]}`}>{mood.icon}</span>
                                                            {mood.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePost()}
                                        disabled={!postText.trim() && !selectedImage}
                                        className={`bg-primary text-black px-6 py-1.5 rounded-full font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        Postar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Posts List */}
                    <div className="flex flex-col gap-6 pb-10 w-full min-w-0">
                        {posts.map((post) => (
                            <InsightCard
                                key={post.id}
                                post={post}
                                user={user}
                                handleLike={handleLike}
                                handleReply={handleReply}
                                handleCommentLike={handleCommentLike}
                                setReplyingTo={setReplyingTo}
                                replyingTo={replyingTo}
                                replyText={replyText}
                                setReplyText={setReplyText}
                                setReposting={setReposting}
                                renderContent={renderContent}
                            />
                        ))}
                    </div>
                </div>

                {/* Right Sidebar - Trending */}
                <aside className="flex flex-col w-full lg:w-[320px] shrink-0 gap-6 lg:sticky lg:top-6 lg:h-[calc(100vh-100px)] lg:overflow-y-auto no-scrollbar pb-10 lg:pb-0">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-white font-bold text-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">trending_up</span>
                            HOT TICKERS (24H)
                        </h2>
                        <div className="flex flex-col gap-2">
                            {["$NVDA", "$BTC", "$PETR4"].map((ticker) => (
                                <div key={ticker} className="p-3 rounded-xl bg-neutral-dark-surface border border-neutral-dark-border hover:border-primary/50 transition-colors cursor-pointer group">
                                    <span className="text-white font-bold group-hover:text-primary transition-colors block">{ticker}</span>
                                    <span className="text-slate-500 text-xs text-uppercase">SENTIMENTO POR TICKER</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Fear & Greed Index (Sentiment Thermometer) */}
                    <div className={`p-4 rounded-2xl bg-black border border-neutral-dark-border shadow-xl ${sentimentData.glow} transition-all duration-500`}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-white font-bold text-sm tracking-tight flex items-center gap-2">
                                Índice de Medo e Ganância
                                <span className="material-symbols-outlined text-slate-500 text-[16px] cursor-help">info</span>
                            </h3>
                        </div>

                        <div className="flex flex-col items-center justify-center py-2 relative">
                            {/* Gauge Container */}
                            <div className="relative w-40 h-20 overflow-hidden">
                                {/* Background Track */}
                                <div className="absolute inset-0 border-[10px] border-neutral-dark-surface rounded-t-full"></div>
                                {/* Gradient Track */}
                                <div
                                    className="absolute inset-0 border-[10px] border-transparent rounded-t-full transition-all duration-1000 ease-out"
                                    style={{
                                        background: "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #22c55e 100%) border-box",
                                        mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                                        WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                                        maskComposite: "destination-out",
                                        WebkitMaskComposite: "destination-out",
                                        clipPath: `inset(0 ${100 - sentiment}% 0 0)`
                                    }}
                                ></div>

                                {/* Center Content */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <span className="text-3xl font-black text-white leading-none">{sentiment}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${sentimentData.color} mt-1`}>
                                        {sentimentData.text}
                                    </span>
                                </div>

                                {/* Pointer Indicator */}
                                <div className="absolute top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-lg z-20"></div>
                            </div>

                            <p className="text-slate-500 text-[10px] mt-4 text-center px-2 leading-tight">
                                {sentiment > 50
                                    ? "O mercado está em Ganância. Cuidado com correções."
                                    : "O mercado está em Medo. Pode ser uma oportunidade."}
                            </p>

                            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-neutral-dark-border/30">
                                <span className="text-slate-500 text-[9px] text-center italic uppercase font-bold tracking-wider">PARTICIPAR DO SENTIMENTO DA COMUNIDADE</span>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-1.5 rounded bg-[#ef4444]/10 text-[#ef4444] text-[10px] font-bold border border-[#ef4444]/20 hover:bg-[#ef4444]/20 transition-colors">
                                        Em Baixa
                                    </button>
                                    <button className="flex-1 py-1.5 rounded bg-[#22c55e]/10 text-[#22c55e] text-[10px] font-bold border border-[#22c55e]/20 hover:bg-[#22c55e]/20 transition-colors">
                                        Em Alta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Repost Overlay/Modal Simulator */}
            {reposting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-[#121212] border border-neutral-dark-border rounded-2xl w-full max-w-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-lg">Citar Insight</h3>
                            <button onClick={() => setReposting(null)} className="text-slate-500 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <textarea
                            autoFocus
                            className="w-full bg-transparent border-none text-white text-lg placeholder-slate-500 focus:ring-0 resize-none p-0 mb-4 outline-none"
                            placeholder="O que você está pensando sobre este insight?"
                            rows={3}
                            id="repost-textarea"
                        ></textarea>

                        {/* Quoted Box Preview */}
                        <div className="border border-neutral-dark-border rounded-xl p-4 mb-6 opacity-60">
                            <div className="flex items-center gap-2 mb-2 text-xs">
                                <div className="h-5 w-5 rounded-full bg-neutral-dark-surface flex items-center justify-center font-bold">
                                    {reposting.avatar}
                                </div>
                                <span className="text-white font-bold">{reposting.author}</span>
                                <span className="text-slate-500">• {reposting.time}</span>
                            </div>
                            <p className="text-slate-300 text-sm line-clamp-2">{reposting.content}</p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => {
                                    const val = (document.getElementById('repost-textarea') as HTMLTextAreaElement).value;
                                    handlePost(val, true, reposting);
                                }}
                                className="bg-primary text-black px-8 py-2 rounded-full font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
                            >
                                Postar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
