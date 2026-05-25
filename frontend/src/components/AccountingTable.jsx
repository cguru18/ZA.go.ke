import React, { useContext } from 'react';
import { Download, Receipt } from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * AccountingTable
 * Props:
 *   data   (array)  — order records from /api/admin/reports
 *   onExport (fn)   — callback to trigger CSV download
 */
export default function AccountingTable({ data = [], onExport }) {
    const { isDarkMode } = useContext(ThemeContext);

    const handleDownload = () => {
        if (onExport) { onExport(); return; }

        // Standalone fallback CSV serializer
        const headers = ['Date', 'Order ID', 'M-Pesa Receipt', 'Customer', 'Gross (KSh)', 'Fee (0.5%)', 'Net (KSh)', 'Status'];
        const rows = data.map(o => [
            new Date(o.createdAt).toLocaleDateString('en-KE'),
            o.orderId || o._id,
            o.mpesaReceiptNumber || 'N/A',
            o.customerId?.fullName || 'Unknown',
            Number(o.grossRevenue).toFixed(2),
            (Number(o.grossRevenue) * 0.005).toFixed(2),
            (Number(o.grossRevenue) * 0.995).toFixed(2),
            o.paymentStatus
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `Heat_Treats_Report_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const statusStyle = (status) => {
        switch (status) {
            case 'Completed': return 'bg-jade-500/15 text-jade-400 border border-jade-500/30';
            case 'Failed':    return 'bg-red-500/15 text-red-400 border border-red-500/30';
            default:          return 'bg-orange-500/15 text-orange-400 border border-orange-500/30';
        }
    };

    return (
        <div className={`rounded-[2.5rem] backdrop-blur-lg border flex flex-col h-[500px] ${
            isDarkMode
                ? 'bg-black/40 border-fuchsia-500/30 shadow-[0_0_15px_rgba(200,162,200,0.1)]'
                : 'bg-white/70 border-fuchsia-500/20 shadow-xl'
        }`}>
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-white/5">
                <div>
                    <h3 className={`text-lg font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        Financial Records
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {data.length} orders · 0.5% Daraja fee applied
                    </p>
                </div>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-6 py-2.5 bg-jade-500/10 text-jade-400 hover:bg-jade-500 hover:text-white border border-jade-500/40 rounded-full transition-all duration-300 text-[10px] font-black uppercase tracking-[0.15em]"
                >
                    <Download size={14} />
                    Export CSV
                </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className={`sticky top-0 backdrop-blur-md text-[10px] uppercase tracking-[0.2em] font-black border-b border-white/5 ${
                        isDarkMode ? 'bg-black/60 text-gray-400' : 'bg-white/80 text-gray-500'
                    }`}>
                        <tr>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-4 py-4">Order ID</th>
                            <th className="px-4 py-4 flex items-center gap-1">
                                <Receipt size={11} /> M-Pesa Receipt
                            </th>
                            <th className="px-4 py-4">Customer</th>
                            <th className="px-4 py-4 text-right">Gross</th>
                            <th className="px-4 py-4 text-right text-jade-400">Net</th>
                            <th className="px-6 py-4 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {data.map(order => (
                            <tr
                                key={order._id}
                                className={`group transition-colors ${isDarkMode ? 'hover:bg-white/5 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}`}
                            >
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('en-KE')}
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-gray-400">
                                    {(order.orderId || order._id || '').substring(0, 10)}…
                                </td>
                                <td className="px-4 py-4 font-mono text-xs text-amber-400/80">
                                    {order.mpesaReceiptNumber || <span className="text-gray-600 italic">Pending</span>}
                                </td>
                                <td className="px-4 py-4 text-sm">
                                    {order.customerId?.fullName || 'Unknown'}
                                </td>
                                <td className="px-4 py-4 text-right font-bold">
                                    {Number(order.grossRevenue || 0).toLocaleString('en-KE')}
                                </td>
                                <td className="px-4 py-4 text-right font-bold text-jade-400">
                                    {(Number(order.grossRevenue || 0) * 0.995).toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.1em] ${statusStyle(order.paymentStatus)}`}>
                                        {order.paymentStatus}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-4 py-12 text-center text-gray-600 italic text-sm">
                                    No financial records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
