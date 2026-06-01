import React from 'react';
import { Calendar, MapPin, Award, Activity, Clock } from 'lucide-react';

export default function ClientProfileView({ profile, isDarkMode }) {
    if (!profile) {
        return (
            <div className={`w-80 flex-shrink-0 flex flex-col items-center justify-center p-6 border-l text-center ${
                isDarkMode ? 'border-white/5 bg-black/10 text-gray-500' : 'border-gray-100 bg-gray-50/50 text-gray-400'
            }`}>
                <Clock className="opacity-20 mb-3 text-fuchsia-500" size={40} />
                <p className="text-xs font-medium">Select a thread to view client profile data.</p>
            </div>
        );
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const isPremium = profile.accountTier?.toUpperCase() === 'VIP' || profile.accountTier?.toUpperCase() === 'PREMIUM';

    return (
        <div className={`w-80 flex-shrink-0 flex flex-col border-l overflow-y-auto h-full ${
            isDarkMode ? 'border-white/5 bg-[#050505]/40 text-white' : 'border-gray-100 bg-gray-50/30 text-slate-800'
        }`}>
            {/* Header / Avatar Summary */}
            <div className="p-6 flex flex-col items-center text-center border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-fuchsia-500/5 to-transparent pointer-events-none"></div>
                <img 
                    src={profile.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150'} 
                    alt={profile.fullName} 
                    className="w-20 h-20 rounded-full object-cover border-2 border-fuchsia-500/20 shadow-lg shadow-fuchsia-500/10 mb-3"
                />
                <h4 className="font-extrabold text-sm tracking-wide mb-1.5">{profile.fullName}</h4>
                <p className="text-[11px] text-gray-400 font-medium break-all px-2 mb-3">{profile.email}</p>

                {/* Tier Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border ${
                    isPremium
                        ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-md shadow-amber-500/5'
                        : 'bg-zinc-500/10 border-zinc-500/20 text-gray-400'
                }`}>
                    <Award size={12} />
                    {profile.accountTier || 'STANDARD TIER'}
                </div>
            </div>

            {/* Demographics / Details */}
            <div className="p-5 border-b border-white/5 space-y-3.5">
                <h5 className="text-[10px] font-black text-fuchsia-500 tracking-widest uppercase">Demographics</h5>
                
                <div className="flex items-center gap-3 text-xs">
                    <MapPin size={15} className="text-gray-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold leading-none mb-0.5">Location</p>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>{profile.location || 'Nairobi, Kenya'}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                    <Calendar size={15} className="text-gray-400 shrink-0" />
                    <div>
                        <p className="text-[10px] text-gray-500 font-bold leading-none mb-0.5">Registration Date</p>
                        <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-slate-700'}`}>{formatDate(profile.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Activity Logs */}
            <div className="p-5 flex-1 flex flex-col">
                <h5 className="text-[10px] font-black text-fuchsia-500 tracking-widest uppercase mb-3.5">Activity & Transactions</h5>
                
                <div className="space-y-3 flex-1">
                    {profile.logs && profile.logs.length > 0 ? (
                        profile.logs.map((log, idx) => (
                            <div key={idx} className={`p-3 rounded-2xl border text-xs relative ${
                                isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'
                            }`}>
                                <div className="flex items-start justify-between gap-1.5 mb-1.5">
                                    <span className={`font-extrabold text-[11px] flex items-center gap-1 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                                        <Activity size={10} className="text-fuchsia-400 shrink-0" />
                                        {log.action}
                                    </span>
                                    <span className="text-[8px] text-gray-500 font-medium shrink-0">
                                        {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <p className={`text-[10px] font-medium leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                    {log.details}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-6 text-gray-500 text-xs">
                            No recent transactions found
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
