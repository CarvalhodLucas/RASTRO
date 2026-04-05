"use client";

import React, { useState, useEffect } from "react";
import Header from "@/components/Header";
import { useAuth } from "@/lib/useAuth";
import InsightCard, { SquarePost } from "@/components/InsightCard";
import { SquareComment } from "@/components/CommentThread";
import Link from "next/link";

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

    const [activeTab, setActiveTab] = useState<'Recommended' | 'Following'>('Recommended');
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const [postText, setPostText] = useState("");
    const [showPaywall, setShowPaywall] = useState(false);

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
            performanceData: -2.45,
            title: "Crise na Tesla: Análise Técnica e de Fluxo",
            content: "Breakout confirmado abaixo da EMA200 ($TSLA). Relação risco/recompensa desfavorável com compressão de margens e inventory buildup. Suporte crítico em $180 como zona de reteste técnica.",
            likes: 156,
            comments: 24,
            reposts: 12,
            viewsCount: 2400,
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
            performanceData: 3.10,
            content: "Acúmulo institucional detectado em $NVDA. Projeção de Fibonacci atingida no curto prazo, mas demanda resiliente por H100 sugere upside remanescente. Manter viés de alta estrutural. 🚀",
            likes: 86,
            comments: 8,
            reposts: 4,
            viewsCount: 1100,
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
    const [showCreatorNotice, setShowCreatorNotice] = useState(false);
    const [following, setFollowing] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('square_following');
        if (saved) {
            try { setFollowing(JSON.parse(saved)); } catch (e) {}
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('square_following', JSON.stringify(following));
    }, [following]);

    const toggleFollow = (author: string) => {
        if (!checkAuth()) return;
        setFollowing(prev => prev.includes(author) ? prev.filter(a => a !== author) : [...prev, author]);
    };

    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [selectedMood, setSelectedMood] = useState<{ label: string, icon: string, color: string } | null>(null);
    const [showMoodSelector, setShowMoodSelector] = useState(false);
    
    // User Stats Calculations
    const isLogged = !!user;
    const myPosts = posts.filter(p => p.author === (user?.name || 'User'));
    const likesReceived = myPosts.reduce((acc, post) => acc + (post.likes || 0), 0);
    const followingCount = following.length;
    const [followersCount] = useState(0); // No backend yet, so start at 0

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!checkAuth()) return;
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const checkAuth = () => {
        if (!user) {
            setShowPaywall(true);
            return false;
        }
        return true;
    };

    const handlePost = (customText?: string, isQuote?: boolean, originalPost?: any) => {
        if (!checkAuth()) return;
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
            viewsCount: 1,
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
        if (!checkAuth()) return;
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
        if (!checkAuth()) return;
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
        if (!checkAuth()) return;
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

    const handleDeletePost = (postId: number) => {
        if (user?.email !== "carvalhodlucas@hotmail.com") return;
        setPosts(prev => prev.filter(post => post.id !== postId));
    };

    const handleDeleteComment = (postId: number, commentId: number) => {
        if (user?.email !== "carvalhodlucas@hotmail.com") return;
        setPosts(prev => prev.map(post => {
            if (post.id === postId) {
                const deleteFromReplies = (replies: SquareComment[]): SquareComment[] => {
                    return replies.filter(reply => reply.id !== commentId).map(reply => ({
                        ...reply,
                        replies: deleteFromReplies(reply.replies)
                    }));
                };
                return {
                    ...post,
                    replies: deleteFromReplies(post.replies)
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

    const getSentimentLabel = (val: number) => {
        if (val < 25) return { text: "Medo Extremo", color: "text-[#ef4444]", glow: "shadow-[#ef4444]/20", bg: "bg-[#ef4444]" };
        if (val < 45) return { text: "Medo", color: "text-orange-500", glow: "shadow-orange-500/20", bg: "bg-orange-500" };
        if (val < 55) return { text: "Neutro", color: "text-slate-400", glow: "shadow-slate-400/20", bg: "bg-slate-400" };
        if (val < 75) return { text: "Ganância", color: "text-[#22c55e]", glow: "shadow-[#22c55e]/20", bg: "bg-[#22c55e]" };
        return { text: "Ganância Extrema", color: "text-[#11d473]", glow: "shadow-[#11d473]/20", bg: "bg-[#11d473]" };
    };

    const [sentiments, setSentiments] = useState<Record<string, { value: number, votes: { up: number, down: number } }>>({
        b3: { value: 50, votes: { up: 752, down: 748 } },
        eua: { value: 50, votes: { up: 843, down: 840 } },
        crypto: { value: 50, votes: { up: 1205, down: 1195 } }
    });

    const handleVote = (type: string, vote: 'up' | 'down') => {
        setSentiments(prev => {
            const current = prev[type];
            const newVotes = {
                ...current.votes,
                [vote]: current.votes[vote] + 1
            };
            const total = newVotes.up + newVotes.down;
            const newValue = Math.round((newVotes.up / total) * 100);
            return {
                ...prev,
                [type]: {
                    ...current,
                    value: newValue,
                    votes: newVotes
                }
            };
        });
    };

    const SentimentGauge = ({ label, value, type }: { label: string, value: number, type: string }) => {
        const data = getSentimentLabel(value);
        const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

        return (
            <div className="bg-zinc-900/40 backdrop-blur-sm border border-white/5 p-4 rounded-[1.5rem] flex flex-col items-center group/gauge transition-all hover:bg-zinc-900/60 hover:border-primary/20">
                <div className="flex justify-between items-center w-full mb-4">
                    <h3 className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.2em] flex items-center gap-2 group-hover/gauge:text-primary transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        {label}
                    </h3>
                    <div className="flex flex-col items-end">
                        <span className={`text-base font-black leading-none ${data.color}`}>{value}%</span>
                        <span className={`text-[8px] font-bold uppercase tracking-tighter opacity-60 ${data.color}`}>
                            {data.text}
                        </span>
                    </div>
                </div>

                <div className="relative w-36 h-[72px] mb-6 mt-2">
                    <div className="absolute inset-0 border-[10px] border-zinc-800/50 rounded-t-full shadow-inner"></div>
                    <div
                        className="absolute inset-0 border-[10px] border-transparent rounded-t-full transition-all duration-1000 ease-out"
                        style={{
                            background: "linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #11d473 100%) border-box",
                            mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                            WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
                            maskComposite: "destination-out",
                            WebkitMaskComposite: "destination-out",
                            clipPath: `inset(0 ${100 - value}% 0 0)`
                        }}
                    ></div>

                    <div className="absolute inset-0 flex justify-center pointer-events-none">
                        {[20, 40, 60, 80].map(deg => (
                            <div 
                                key={deg} 
                                className="absolute bottom-0 w-[1px] h-full bg-zinc-950/40 origin-bottom" 
                                style={{ transform: `rotate(${deg - 90}deg)` }} 
                            />
                        ))}
                    </div>

                    <div 
                        className="absolute bottom-0 left-1/2 w-[2px] h-[64px] bg-white rounded-full origin-bottom transition-all duration-1000 ease-out z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        style={{ transform: `translateX(-50%) rotate(${(value / 100) * 180 - 90}deg)` }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full border-2 border-zinc-900 shadow-lg"></div>
                    </div>

                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-5 h-5 bg-zinc-900 border-2 border-zinc-700 rounded-full z-20 flex items-center justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${data.bg}`} />
                    </div>

                    <div 
                        className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-8 rounded-full blur-2xl opacity-20 transition-all duration-1000 ${data.bg}`} 
                    />
                </div>

                <div className="flex gap-2 w-full mt-2">
                    <button 
                        onClick={() => {
                            if (userVote === 'down') {
                                setUserVote(null);
                            } else {
                                setUserVote('down');
                                handleVote(type, 'down');
                            }
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 group/btn ${
                            userVote === 'down' 
                                ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                                : 'bg-zinc-800/50 border-white/5 hover:bg-red-500/10 hover:border-red-500/30'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-[18px] ${userVote === 'down' ? 'text-white' : 'text-slate-500 group-hover/btn:text-red-500'}`}>trending_down</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${userVote === 'down' ? 'text-white' : 'text-slate-400 group-hover/btn:text-red-500'}`}>Baixa</span>
                    </button>
                    <button 
                        onClick={() => {
                            if (userVote === 'up') {
                                setUserVote(null);
                            } else {
                                setUserVote('up');
                                handleVote(type, 'up');
                            }
                        }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all duration-300 group/btn ${
                            userVote === 'up' 
                                ? 'bg-[#11d473] text-white border-[#11d473] shadow-[0_0_15px_rgba(17,212,115,0.3)]' 
                                : 'bg-zinc-800/50 border-white/5 hover:bg-[#11d473]/10 hover:border-[#11d473]/30'
                        }`}
                    >
                        <span className={`material-symbols-outlined text-[18px] ${userVote === 'up' ? 'text-white' : 'text-slate-500 group-hover/btn:text-[#11d473]'}`}>trending_up</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${userVote === 'up' ? 'text-white' : 'text-slate-400 group-hover/btn:text-[#11d473]'}`}>Alta</span>
                    </button>
                </div>
            </div>
        );
    };

    if (!hasMounted || !authMounted) return null;

    return (
        <div className="bg-zinc-950 font-display text-slate-100 min-h-screen flex flex-col overflow-x-hidden selection:bg-primary selection:text-black">
            <Header currentPath="/square" />

            <main className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-[260px_740px_320px] justify-center gap-6 px-4 mt-6 flex-1 h-auto lg:h-[calc(100vh-65px)] lg:overflow-hidden min-w-0">
                {/* Left Sidebar - Following */}
                <aside className="shrink-0 hidden lg:flex flex-col gap-6 lg:overflow-y-auto no-scrollbar pb-10">
                    {/* User Profile Card / CTA */}
                    {isLogged ? (
                        <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/5 rounded-[1.5rem] p-4 flex flex-col gap-4 group/profile hover:bg-zinc-900/90 transition-all">
                            {/* Header do Perfil */}
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden font-bold transition-transform group-hover/profile:scale-105">
                                    {user?.avatarImage ? (
                                        <img src={user.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-lg font-black text-primary">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-white font-black text-sm truncate">{user?.name || 'Investidor Anônimo'}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="bg-primary/20 p-0.5 rounded-full">
                                            <span className="material-symbols-outlined !text-[10px] text-primary block">military_tech</span>
                                        </div>
                                        <span className="text-[8px] text-primary font-black uppercase tracking-[0.2em]">Nível 1 • Iniciante</span>
                                    </div>
                                </div>
                            </div>

                            {/* Grid de Estatísticas */}
                            <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                        {followersCount === 1 ? 'Seguidor' : 'Seguidores'}
                                    </span>
                                    <span className="text-white font-black text-sm">{followersCount}</span>
                                </div>
                                <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Seguindo</span>
                                    <span className="text-white font-black text-sm">{followingCount}</span>
                                </div>
                                <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                        {myPosts.length === 1 ? 'Post' : 'Posts'}
                                    </span>
                                    <span className="text-white font-black text-sm">{myPosts.length}</span>
                                </div>
                                <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                        {likesReceived === 1 ? 'Curtida' : 'Curtidas'}
                                    </span>
                                    <span className="text-white font-black text-sm">{likesReceived}</span>
                                </div>
                            </div>
                            
                            {/* Link para o perfil completo */}
                            <Link href="/perfil" className="w-full mt-1 py-2.5 bg-zinc-800 border border-white/10 hover:bg-zinc-800/80 hover:border-primary/30 text-[10px] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all text-center">
                                Ver Meu Perfil
                            </Link>
                        </div>
                    ) : (
                        /* Estado Deslogado - Call to Action */
                        <div className="bg-zinc-900 border border-white/5 rounded-[1.5rem] p-6 text-center flex flex-col items-center gap-4 shadow-sm">
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                                <span className="material-symbols-outlined text-[32px] text-primary">group_add</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <h3 className="text-white font-black text-sm uppercase tracking-tight">Junte-se à Comunidade</h3>
                                <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Faça login para interagir com o mercado e compartilhar suas teses.</p>
                            </div>
                            <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))} 
                                className="w-full mt-2 py-3 bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
                            >
                                Fazer Login
                            </button>
                        </div>
                    )}

                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                            SEGUINDO
                        </h2>
                        
                        {following.length === 0 ? (
                            <div className="py-2 text-center text-balance overflow-hidden">
                                <p className="text-slate-500 text-[10px] mb-4 leading-relaxed">Você ainda não segue ninguém.</p>
                                <button 
                                    onClick={() => setActiveTab('Recommended')}
                                    className="w-full py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black hover:bg-primary hover:text-black transition-all uppercase tracking-widest"
                                >
                                    Explorar
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {following.map(author => (
                                    <div key={author} className="flex items-center justify-between group/item">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-[9px] text-primary shrink-0">
                                                {author.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-white text-xs font-bold truncate group-hover/item:text-primary transition-colors cursor-pointer">{author}</span>
                                        </div>
                                        <button 
                                            onClick={() => toggleFollow(author)}
                                            className="opacity-0 group-hover/item:opacity-100 text-slate-500 hover:text-red-500 transition-all shrink-0"
                                            title="Deixar de seguir"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">person_remove</span>
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setActiveTab('Recommended')}
                                    className="mt-4 w-full py-2 border border-white/5 rounded-xl text-slate-500 text-[9px] font-black hover:bg-zinc-800/50 hover:text-white transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                >
                                    <span className="material-symbols-outlined text-[14px]">explore</span>
                                    Explorar Mais
                                </button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center Column - Feed */}
                <div className="flex-1 w-full lg:w-[740px] lg:shrink-0 mx-auto flex flex-col gap-6 overflow-y-visible lg:overflow-y-auto scrollbar-hide pb-10 lg:pb-20 min-w-0">
                    
                    {/* User Profile Card (Mobile Only) */}
                    <div className="lg:hidden px-4 pt-4">
                        {isLogged ? (
                            <div className="bg-zinc-900/80 backdrop-blur-sm border border-white/5 rounded-[1.5rem] p-4 flex flex-col gap-4 group/profile hover:bg-zinc-900/90 transition-all">
                                {/* Header do Perfil */}
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center overflow-hidden font-bold transition-transform group-hover/profile:scale-105">
                                        {user?.avatarImage ? (
                                            <img src={user.avatarImage} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-lg font-black text-primary">{user?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-white font-black text-sm truncate">{user?.name || 'Investidor Anônimo'}</h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="bg-primary/20 p-0.5 rounded-full">
                                                <span className="material-symbols-outlined !text-[10px] text-primary block">military_tech</span>
                                            </div>
                                            <span className="text-[8px] text-primary font-black uppercase tracking-[0.2em]">Nível 1 • Iniciante</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid de Estatísticas */}
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            {followersCount === 1 ? 'Seguidor' : 'Seguidores'}
                                        </span>
                                        <span className="text-white font-black text-sm">{followersCount}</span>
                                    </div>
                                    <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Seguindo</span>
                                        <span className="text-white font-black text-sm">{followingCount}</span>
                                    </div>
                                    <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            {myPosts.length === 1 ? 'Post' : 'Posts'}
                                        </span>
                                        <span className="text-white font-black text-sm">{myPosts.length}</span>
                                    </div>
                                    <div className="bg-zinc-950/40 rounded-xl p-3 flex flex-col items-center justify-center border border-white/5 hover:border-primary/20 transition-all">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                                            {likesReceived === 1 ? 'Curtida' : 'Curtidas'}
                                        </span>
                                        <span className="text-white font-black text-sm">{likesReceived}</span>
                                    </div>
                                </div>
                                
                                {/* Link para o perfil completo */}
                                <Link href="/perfil" className="w-full mt-1 py-2.5 bg-zinc-800 border border-white/10 hover:bg-zinc-800/80 hover:border-primary/30 text-[10px] text-white font-black uppercase tracking-[0.2em] rounded-xl transition-all text-center">
                                    Ver Meu Perfil
                                </Link>
                            </div>
                        ) : (
                            /* Estado Deslogado - Call to Action */
                            <div className="bg-zinc-900 border border-white/5 rounded-[1.5rem] p-6 text-center flex flex-col items-center gap-4 shadow-sm">
                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                                    <span className="material-symbols-outlined text-[32px] text-primary">group_add</span>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-white font-black text-sm uppercase tracking-tight">Junte-se à Comunidade</h3>
                                    <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Faça login para interagir com o mercado e compartilhar suas teses.</p>
                                </div>
                                <button 
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }))} 
                                    className="w-full mt-2 py-3 bg-primary text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-xl hover:bg-primary-hover transition-all shadow-lg shadow-primary/10"
                                >
                                    Fazer Login
                                </button>
                            </div>
                        )}
                    </div>

                   {/* Feed Header */}
                   <div className="sticky top-0 z-10 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 pb-2 mb-4">
                        {/* Tabs */}
                        <div className="flex gap-8 px-4 border-b border-white/5 mb-4">
                            {(['Recommended', 'Following'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`py-4 text-sm font-bold transition-all relative ${
                                        activeTab === tab ? 'text-primary' : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    {tab === 'Recommended' ? 'Recomendado' : 'A seguir'}
                                    {activeTab === tab && (
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div className="px-4 mb-4">
                            <div className="relative group">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-[20px] group-focus-within:text-primary transition-colors">search</span>
                                <input
                                    className="w-full bg-zinc-900 border border-white/5 rounded-full py-2 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-xs outline-none"
                                    placeholder="BUSCAR ATIVOS OU TESES..."
                                    type="text"
                                />
                            </div>
                        </div>

                        {/* Trending Pills (Compact) */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 mb-2">
                            {["$NVDA", "$BTC", "$ETH", "$SOL", "$PETR4", "$VALE3"].map((ticker) => (
                                <button
                                    key={ticker}
                                    onClick={() => setPostText(prev => prev + ticker + " ")}
                                    className="px-3 py-1 rounded-md bg-zinc-900 border border-white/5 text-[10px] font-bold text-slate-400 hover:border-primary/30 hover:text-primary transition-all whitespace-nowrap"
                                >
                                    {ticker}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Post Creation Area */}
                    <div className="flex gap-3 px-4 pt-2">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center overflow-hidden">
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
                                onFocus={() => { if (!user) checkAuth(); }}
                                onClick={() => { if (!user) checkAuth(); }}
                                onChange={(e) => setPostText(e.target.value)}
                            ></textarea>

                            {/* Image Preview */}
                            {selectedImage && (
                                <div className="relative inline-block mb-4 mt-2">
                                    <img src={selectedImage} alt="Preview" className="max-h-64 rounded-2xl border border-white/5 shadow-lg" />
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
                                <div className="mb-4 p-4 rounded-2xl bg-zinc-900 border border-white/5 animate-in fade-in slide-in-from-top-2">
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
                                                className="w-full bg-black border border-white/5 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-600 focus:border-primary outline-none transition-all"
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

                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <div className="flex gap-2 text-primary relative">
                                    <button
                                        onClick={() => document.getElementById('image-upload')?.click()}
                                        className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
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
                                        className={`p-2 hover:bg-zinc-900 rounded-full transition-colors ${showPollCreator ? 'bg-primary/20 text-white' : ''}`}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">bar_chart</span>
                                    </button>
                                    <div className="relative">
                                        <button
                                            onClick={() => setShowMoodSelector(!showMoodSelector)}
                                            className={`p-2 hover:bg-zinc-900 rounded-full transition-colors ${showMoodSelector ? 'bg-primary/20 text-white' : ''}`}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">sentiment_satisfied</span>
                                        </button>

                                        {/* Mood Selector Dropdown */}
                                        {showMoodSelector && (
                                            <div className="absolute bottom-full left-0 mb-2 w-48 bg-zinc-900 border border-white/5 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2">
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

                    {/* Feed Posts */}
                    <div className="flex flex-col gap-4 mb-12 w-full pt-4">
                        {(() => {
                            const displayPosts = activeTab === 'Recommended' 
                                ? posts 
                                : posts.filter(p => following.includes(p.author));

                            if (displayPosts.length === 0 && activeTab === 'Following') {
                                return (
                                    <div className="w-full bg-zinc-900 border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="h-20 w-20 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center mb-2">
                                            <span className="material-symbols-outlined text-primary text-[40px] opacity-40">person_add</span>
                                        </div>
                                        <h3 className="text-white font-black text-xl">Seu feed está vazio</h3>
                                        <p className="text-slate-400 text-sm max-w-xs mx-auto">
                                            O seu feed personalizado está vazio. Comece a seguir analistas para ver as teses aqui!
                                        </p>
                                        <button 
                                            onClick={() => setActiveTab('Recommended')}
                                            className="mt-2 bg-primary text-black px-8 py-2.5 rounded-full font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary/20"
                                        >
                                            Explorar Square
                                        </button>
                                    </div>
                                );
                            }

                            return displayPosts.map((post) => (
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
                                    handleDeletePost={handleDeletePost}
                                    handleDeleteComment={handleDeleteComment}
                                    isFollowing={following.includes(post.author)}
                                    onToggleFollow={toggleFollow}
                                />
                            ));
                        })()}
                    </div>
                </div>

                {/* Right Sidebar - Trending */}
                <aside className="shrink-0 hidden lg:flex flex-col gap-6 lg:overflow-y-auto no-scrollbar pb-10">
                    <div className="flex flex-col gap-4">
                        <h2 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wider">
                            <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
                            HOT TICKERS GLOBAIS (24H)
                        </h2>
                        <div className="flex flex-col gap-1">
                            {[
                                { rank: 1, ticker: "NVDA", name: "Nvidia Corp.", change: "+3.10%", color: "text-[#11d473]" },
                                { rank: 2, ticker: "BTC", name: "Bitcoin", change: "+1.25%", color: "text-[#11d473]" },
                                { rank: 3, ticker: "TSLA", name: "Tesla, Inc.", change: "-2.45%", color: "text-[#ef4444]" },
                                { rank: 4, ticker: "ETH", name: "Ethereum", change: "+0.85%", color: "text-[#11d473]" },
                                { rank: 5, ticker: "PETR4", name: "Petrobras", change: "-0.50%", color: "text-[#ef4444]" },
                            ].map((item) => (
                                <div key={item.ticker} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer group">
                                    <span className={`text-xs font-black ${item.rank <= 3 ? 'text-primary' : 'text-slate-600'} w-4`}>{item.rank}</span>
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                                        <span className="text-[10px] font-bold text-slate-400">{item.ticker.substring(0, 2)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-white font-bold text-xs group-hover:text-primary transition-colors">{item.ticker}</span>
                                            <span className="text-slate-500 text-[10px] truncate">{item.name}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className={`text-xs font-bold ${item.color}`}>{item.change}</span>
                                        <span className="material-symbols-outlined text-slate-700 text-[16px]">show_chart</span>
                                    </div>
                                    <button className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center hover:bg-primary hover:text-black transition-all">
                                        <span className="material-symbols-outlined text-[14px]">add</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setShowCreatorNotice(true)}
                            className="w-full py-3 bg-primary text-black font-black text-xs rounded-xl hover:bg-primary-hover transition-all shadow-[0_0_20px_-5px_rgba(234,179,8,0.3)] mt-2 uppercase tracking-widest"
                        >
                            CANDIDATAR-SE AO CREATOR CENTER
                        </button>
                    </div>

                    {/* Triple Sentiment Gauges */}
                    <div className="flex flex-col gap-3">
                        <h2 className="text-white font-bold text-sm flex items-center gap-2 uppercase tracking-wider px-1">
                            <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                            SENTIMENTO DO MERCADO
                        </h2>
                        <SentimentGauge label="B3 (BRASIL)" value={sentiments.b3.value} type="b3" />
                        <SentimentGauge label="EUA (S&P 500)" value={sentiments.eua.value} type="eua" />
                        <SentimentGauge label="CRIPTO (BTC)" value={sentiments.crypto.value} type="crypto" />
                    </div>
                </aside>
            </main>

            {/* Mobile Sidebar Trigger (FAB) */}
            <button 
                onClick={() => setIsMobileSidebarOpen(true)}
                className="lg:hidden fixed bottom-10 right-6 z-[40] w-14 h-14 bg-primary hover:bg-primary-hover text-black rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:scale-110 active:scale-95 transition-all"
                title="Abrir Menu do Mercado"
            >
                <span className="material-symbols-outlined text-2xl font-black">dashboard_customize</span>
            </button>

            {/* Mobile Sidebar Drawer */}
            <div className={`lg:hidden fixed inset-0 z-[60] transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop Layer */}
                <div 
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsMobileSidebarOpen(false)}
                ></div>

                {/* Content Panel */}
                <div className={`absolute right-0 top-0 h-full w-[300px] bg-zinc-950 border-l border-white/5 shadow-2xl transition-transform duration-500 overflow-y-auto no-scrollbar p-6 flex flex-col gap-8 ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-white font-black text-base uppercase tracking-tighter italic">Mercado & Comunidade</h2>
                        <button 
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="bg-zinc-900 p-2 rounded-xl text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Following Section */}
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl p-5 shadow-sm">
                        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] mb-4 flex items-center gap-2 opacity-50">
                            <span className="material-symbols-outlined text-primary text-[16px]">group</span>
                            SEGUINDO
                        </h2>
                        
                        {following.length === 0 ? (
                            <div className="py-2 text-center text-balance overflow-hidden">
                                <p className="text-slate-500 text-[10px] mb-4 leading-relaxed">Você ainda não segue ninguém.</p>
                                <button 
                                    onClick={() => { setActiveTab('Recommended'); setIsMobileSidebarOpen(false); }}
                                    className="w-full py-2 bg-primary/10 border border-primary/20 rounded-xl text-primary text-[10px] font-black hover:bg-primary hover:text-black transition-all uppercase tracking-widest"
                                >
                                    Explorar
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3">
                                {following.map(author => (
                                    <div key={author} className="flex items-center justify-between group/item">
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="h-7 w-7 rounded-full bg-zinc-800 border border-white/5 flex items-center justify-center font-bold text-[9px] text-primary shrink-0">
                                                {author.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-white text-xs font-bold truncate group-hover/item:text-primary transition-colors cursor-pointer">{author}</span>
                                        </div>
                                        <button 
                                            onClick={() => toggleFollow(author)}
                                            className="text-slate-500 hover:text-red-500 transition-all shrink-0"
                                            title="Deixar de seguir"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">person_remove</span>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Hot Tickers (Mobile) */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">local_fire_department</span>
                            HOT TICKERS (24H)
                        </h2>
                        <div className="flex flex-col gap-1">
                            {[
                                { rank: 1, ticker: "NVDA", name: "Nvidia Corp.", change: "+3.10%", color: "text-[#11d473]" },
                                { rank: 2, ticker: "BTC", name: "Bitcoin", change: "+1.25%", color: "text-[#11d473]" },
                                { rank: 3, ticker: "TSLA", name: "Tesla, Inc.", change: "-2.45%", color: "text-[#ef4444]" },
                                { rank: 4, ticker: "ETH", name: "Ethereum", change: "+0.85%", color: "text-[#11d473]" },
                                { rank: 5, ticker: "PETR4", name: "Petrobras", change: "-0.50%", color: "text-[#ef4444]" },
                            ].map((item) => (
                                <div key={item.ticker} className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer group">
                                    <span className={`text-xs font-black ${item.rank <= 3 ? 'text-primary' : 'text-slate-600'} w-4`}>{item.rank}</span>
                                    <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5 shrink-0 overflow-hidden">
                                        <span className="text-[10px] font-bold text-slate-400">{item.ticker.substring(0, 2)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <span className="text-white font-bold text-xs group-hover:text-primary transition-colors">{item.ticker}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end shrink-0">
                                        <span className={`text-xs font-bold ${item.color}`}>{item.change}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sentiment (Mobile) */}
                    <div className="flex flex-col gap-6 pb-12">
                        <h2 className="text-white font-bold text-[10px] uppercase tracking-[0.2em] opacity-50 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">psychology</span>
                            SENTIMENTO
                        </h2>
                        <SentimentGauge label="B3" value={sentiments.b3.value} type="b3" />
                        <SentimentGauge label="EUA" value={sentiments.eua.value} type="eua" />
                        <SentimentGauge label="CRIPTO" value={sentiments.crypto.value} type="crypto" />
                    </div>
                </div>
            </div>

            {/* Repost Overlay/Modal Simulator */}
            {reposting && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-white/5 rounded-2xl w-full max-w-lg shadow-2xl p-6">
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
                        <div className="border border-white/5 rounded-xl p-4 mb-6 opacity-60">
                            <div className="flex items-center gap-2 mb-2 text-xs">
                                <div className="h-5 w-5 rounded-full bg-zinc-900 flex items-center justify-center font-bold">
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
            {/* OVERLAY DO PAYWALL SQUARE */}
            {showPaywall && !user && (
                <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 text-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-zinc-900/90 backdrop-blur-2xl border border-primary/30 p-10 rounded-[3rem] shadow-[0_0_150px_-20px_rgba(234,179,8,0.5)] max-w-xl animate-in zoom-in-95 duration-500 relative">
                        {/* Botão de fechar discreto */}
                        <button 
                            onClick={() => setShowPaywall(false)}
                            className="absolute top-6 right-8 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <span className="material-symbols-outlined text-primary text-4xl">lock</span>
                        </div>
                        <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">
                            Conteúdo Exclusivo <br /> <span className="text-primary italic">RASTRO Square</span>
                        </h2>
                        <p className="text-slate-300 mb-8 text-lg leading-relaxed">
                            Sentimentos em tempo real, Teses da Comunidade e Insights da Elite estão disponíveis apenas para membros. Crie sua conta gratuita em segundos.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                            <button
                                onClick={() => {
                                    setShowPaywall(false);
                                    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'register' } }));
                                }}
                                className="w-full sm:w-auto px-10 py-4 bg-primary hover:bg-primary/90 text-black font-black rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_-5px_rgba(234,179,8,0.5)] uppercase tracking-wider"
                            >
                                Liberar Acesso Grátis
                            </button>
                            <button
                                onClick={() => {
                                    setShowPaywall(false);
                                    window.dispatchEvent(new CustomEvent('open-auth-modal', { detail: { tab: 'login' } }));
                                }}
                                className="w-full sm:w-auto px-10 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all border border-zinc-700"
                            >
                                Já tenho conta
                            </button>
                        </div>
                        <p className="mt-8 text-xs text-slate-500 font-medium uppercase tracking-[0.2em]">
                            Fique um passo à frente do mercado com IA
                        </p>

                        <div className="mt-6 pt-6 border-t border-white/5">
                            <Link href="/" className="text-slate-500 hover:text-primary transition-colors text-sm flex items-center justify-center gap-1">
                                <span className="material-symbols-outlined !text-[16px]">arrow_back</span>
                                Voltar para o Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Creator Notice */}
            {showCreatorNotice && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/5 p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95 duration-300 relative">
                        <button 
                            onClick={() => setShowCreatorNotice(false)}
                            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 mx-auto">
                            <span className="material-symbols-outlined text-primary text-3xl">construction</span>
                        </div>
                        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Em Desenvolvimento</h3>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            O Creator Center está sendo construído para premiar os melhores analistas da comunidade. Fique atento às nossas redes para o lançamento oficial!
                        </p>
                        <button 
                            onClick={() => setShowCreatorNotice(false)}
                            className="w-full py-3 bg-primary text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-primary-hover transition-all"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
