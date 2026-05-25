import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload, Camera, Tag, DollarSign, FileText, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

export default function SellProduct() {
    const { user, token } = useContext(AuthContext);
    const { isDarkMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [previewImage, setPreviewImage] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Flower',
        thc: '',
        isInfused: false
    });

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!previewImage) {
            alert('Please upload an image of your product.');
            return;
        }

        try {
            setLoading(true);
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/products`, {
                ...formData,
                image: previewImage
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            navigate('/');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
                <h2 className="text-2xl font-bold mb-4">Sign in to sell items</h2>
                <button onClick={() => navigate('/login')} className="px-6 py-3 bg-fuchsia-600 text-white rounded-xl font-bold">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pt-24 pb-20 px-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            <div className="max-w-2xl mx-auto">
                <button 
                    onClick={() => navigate(-1)} 
                    className={`mb-6 flex items-center gap-2 text-sm font-medium transition-colors ${
                        isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-black'
                    }`}
                >
                    <ArrowLeft size={16} /> Back
                </button>

                <div className="mb-8">
                    <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
                        List an Item
                    </h1>
                    <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Add photos and details to start selling your product to the ZA.go community.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Upload Area */}
                    <div className="relative group">
                        <label className={`block w-full h-64 rounded-3xl border-2 border-dashed cursor-pointer overflow-hidden transition-all ${
                            isDarkMode 
                                ? 'border-fuchsia-500/30 bg-white/5 hover:bg-white/10' 
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                        }`}>
                            <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleImageUpload} 
                                className="hidden" 
                            />
                            {previewImage ? (
                                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                                    <div className="w-16 h-16 rounded-full bg-fuchsia-500/20 text-fuchsia-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Camera size={32} />
                                    </div>
                                    <p className="font-bold text-lg mb-1">Tap to upload a photo</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>High quality images sell faster</p>
                                </div>
                            )}
                            {previewImage && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full font-bold text-white flex items-center gap-2">
                                        <Upload size={18} /> Change Photo
                                    </span>
                                </div>
                            )}
                        </label>
                    </div>

                    {/* Form Fields */}
                    <div className={`p-6 rounded-3xl border shadow-xl ${
                        isDarkMode ? 'bg-[#0a0a0a]/80 border-white/10 backdrop-blur-xl' : 'bg-white border-gray-100 shadow-gray-200/50'
                    }`}>
                        <div className="space-y-5">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold mb-2 uppercase tracking-wide opacity-80">
                                    <Tag size={16} className="text-fuchsia-500" /> Title
                                </label>
                                <input
                                    required
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="e.g., Premium Sour Diesel"
                                    className={`w-full p-4 rounded-2xl outline-none transition-colors font-medium ${
                                        isDarkMode ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-gray-50 focus:bg-gray-100 text-black'
                                    }`}
                                />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold mb-2 uppercase tracking-wide opacity-80">
                                    <FileText size={16} className="text-fuchsia-500" /> Description
                                </label>
                                <textarea
                                    required
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe the condition, strain details, effects..."
                                    rows="3"
                                    className={`w-full p-4 rounded-2xl outline-none transition-colors font-medium resize-none ${
                                        isDarkMode ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-gray-50 focus:bg-gray-100 text-black'
                                    }`}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 uppercase tracking-wide opacity-80">
                                        <DollarSign size={16} className="text-fuchsia-500" /> Price (KSh)
                                    </label>
                                    <input
                                        required
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`w-full p-4 rounded-2xl outline-none transition-colors font-bold text-lg ${
                                            isDarkMode ? 'bg-white/5 focus:bg-white/10 text-jade' : 'bg-gray-50 focus:bg-gray-100 text-jade-600'
                                        }`}
                                    />
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-bold mb-2 uppercase tracking-wide opacity-80">
                                        <Package size={16} className="text-fuchsia-500" /> Category
                                    </label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className={`w-full p-4 rounded-2xl outline-none transition-colors font-medium appearance-none ${
                                            isDarkMode ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-gray-50 focus:bg-gray-100 text-black'
                                        }`}
                                    >
                                        <option value="Flower">Flower</option>
                                        <option value="Edible">Edible</option>
                                        <option value="Concentrate">Concentrate</option>
                                        <option value="Pre-Roll">Pre-Roll</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-bold mb-2 uppercase tracking-wide opacity-80">
                                    Potency / THC
                                </label>
                                <input
                                    required
                                    name="thc"
                                    value={formData.thc}
                                    onChange={handleChange}
                                    placeholder="e.g., 24% THC"
                                    className={`w-full p-4 rounded-2xl outline-none transition-colors font-medium ${
                                        isDarkMode ? 'bg-white/5 focus:bg-white/10 text-white' : 'bg-gray-50 focus:bg-gray-100 text-black'
                                    }`}
                                />
                            </div>

                            <label className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer bg-fuchsia-500/10 border border-fuchsia-500/20">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        name="isInfused"
                                        checked={formData.isInfused}
                                        onChange={handleChange}
                                        className="sr-only"
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${formData.isInfused ? 'bg-fuchsia-500' : 'bg-gray-400'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.isInfused ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div>
                                    <div className="font-bold">Infused Product</div>
                                    <div className="text-xs opacity-70">Check this if the item requires premium vault access</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-fuchsia-500/30 flex justify-center items-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={24} /> : 'List Product for Sale'}
                    </button>
                </form>
            </div>
        </div>
    );
}
