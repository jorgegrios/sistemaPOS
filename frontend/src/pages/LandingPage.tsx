import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CheckCircle,
    LayoutDashboard,
    Users,
    ShoppingCart,
    BarChart3,
    ShieldCheck,
    Globe,
    Zap,
    ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/auth-context';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/app');
        }
    }, [isAuthenticated, navigate]);

    const plans = [
        {
            name: 'Basic',
            price: '$29',
            features: ['1 Restaurant', '5 Users', 'Basic Reports', 'Email Support'],
            popular: false,
            color: 'blue'
        },
        {
            name: 'Pro',
            price: '$79',
            features: ['5 Restaurants', 'Unlimited Users', 'Advanced Analytics', '24/7 Priority Support', 'Inventory Management'],
            popular: true,
            color: 'indigo'
        },
        {
            name: 'Enterprise',
            price: '$199',
            features: ['Unlimited Restaurants', 'Custom Roles', 'API Access', 'Dedicated Account Manager', 'Custom Integration'],
            popular: false,
            color: 'purple'
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* Navbar */}
            <nav className="flex items-center justify-between px-6 py-6 md:px-12 backdrop-blur-md bg-white/70 sticky top-0 z-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                        <Zap className="text-white w-6 h-6 fill-white" />
                    </div>
                    <span className="text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-700">
                        SISTEMA POS
                    </span>
                </div>

                <div className="hidden md:flex items-center gap-8 font-medium text-gray-600">
                    <a href="#features" className="hover:text-blue-600 transition">Features</a>
                    <a href="#pricing" className="hover:text-blue-600 transition">Pricing</a>
                    <button
                        onClick={() => {
                            const newLang = i18n.language === 'es' ? 'en' : 'es';
                            i18n.changeLanguage(newLang);
                        }}
                        className="flex items-center gap-1 hover:text-blue-600 transition"
                    >
                        <Globe className="w-4 h-4" />
                        {i18n.language === 'es' ? 'English' : 'Español'}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {!isAuthenticated ? (
                        <>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2.5 font-bold text-blue-600 hover:bg-blue-50 rounded-full transition"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/login')}
                                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-full shadow-lg shadow-blue-200 hover:scale-105 transition active:scale-95"
                            >
                                Get Started
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => navigate('/app')}
                            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold rounded-full shadow-lg shadow-blue-200 hover:scale-105 transition active:scale-95 flex items-center gap-2"
                        >
                            Dashboard <ChevronRight className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative px-6 pt-20 pb-32 md:px-12 md:pt-32 md:pb-48 flex flex-col items-center text-center overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-60 -z-10 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-60 -z-10"></div>

                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-bold mb-8 animate-bounce">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    Next Generation POS for Modern Restaurants
                </div>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-gray-900 leading-[1.1] mb-8 max-w-5xl">
                    Complete Control of Your <span className="text-blue-600">Restaurant</span> in Real-Time.
                </h1>

                <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mb-12 leading-relaxed">
                    Manage orders, inventory, staff, and payments across all your branches with our powerful SaaS platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => navigate(isAuthenticated ? '/app' : '/login')}
                        className="px-10 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white text-lg font-black rounded-2xl shadow-2xl shadow-blue-300 hover:translate-y-[-4px] transition active:translate-y-[0px] flex items-center gap-2"
                    >
                        {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'} <ChevronRight className="w-5 h-5" />
                    </button>
                    <button className="px-10 py-5 bg-white border-2 border-gray-100 text-gray-700 text-lg font-bold rounded-2xl hover:bg-gray-50 transition border-b-4 active:border-b-0 active:translate-y-[4px]">
                        Watch Demo
                    </button>
                </div>

                {/* Dashboard Preview mockup */}
                <div className="mt-20 relative w-full max-w-6xl mx-auto rounded-3xl border border-gray-200 p-2 bg-white shadow-3xl shadow-blue-100/50 transform perspective-1000 rotate-x-2">
                    <div className="w-full h-[500px] bg-gray-50 rounded-2xl overflow-hidden relative flex flex-col">
                        <div className="h-12 border-b border-gray-200 bg-white flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <div className="mx-auto w-1/2 h-6 bg-gray-100 rounded-md"></div>
                        </div>
                        <div className="flex-1 p-6 flex gap-6">
                            <div className="w-48 flex flex-col gap-4">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-8 bg-gray-200 rounded-lg animate-pulse"></div>)}
                            </div>
                            <div className="flex-1 grid grid-cols-3 gap-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-32 flex flex-col gap-2">
                                        <div className="w-1/2 h-4 bg-gray-100 rounded"></div>
                                        <div className="w-full h-8 bg-blue-50 rounded"></div>
                                    </div>
                                ))}
                                <div className="col-span-3 bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
                                    <div className="w-1/4 h-6 bg-gray-100 rounded mb-4"></div>
                                    <div className="w-full h-48 bg-blue-50/30 rounded-xl border border-blue-50 flex items-end justify-between px-8 py-4">
                                        {[0.3, 0.5, 0.4, 0.8, 0.6, 0.7, 0.9].map((h, i) => (
                                            <div key={i} style={{ height: `${h * 100}%` }} className="w-8 bg-blue-500 rounded-t-lg"></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-40"></div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 px-6 md:px-12 bg-gray-50">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Everything you need to <span className="text-blue-600">Scale</span>.</h2>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">Powerful tools designed specifically for restaurant growth and management efficiency.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
                    {[
                        { icon: LayoutDashboard, title: 'Centralized Dashboard', desc: 'Monitor all your branches from a single point of truth.' },
                        { icon: Users, title: 'Staff Management', desc: 'Assign roles, track shifts and performance metrics.' },
                        { icon: ShoppingCart, title: 'Smart Orders', desc: 'Intuitive order taking and automated kitchen sync.' },
                        { icon: BarChart3, title: 'Detailed Analytics', desc: 'Generate real-time reports and financial statements.' },
                        { icon: ShieldCheck, title: 'Security First', desc: 'Highest standards of data protection and privacy.' },
                        { icon: Globe, title: 'Cloud Sync', desc: 'Access your restaurant data from anywhere in the world.' },
                        { icon: Zap, title: 'Instant Payments', desc: 'Multiple payment methods integrated seamlessly.' },
                        { icon: CheckCircle, title: 'Zero Downtime', desc: 'Our reliable infrastructure ensures your business never stops.' },
                    ].map((feature, i) => (
                        <div key={i} className="group p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:translate-y-[-8px] transition duration-300">
                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition">
                                <feature.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center mb-20">
                    <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">Simple, Transparent <span className="text-indigo-600">Pricing</span>.</h2>
                    <p className="text-xl text-gray-500 max-w-3xl mx-auto">Choose the plan that fits your current needs and scale when you ready.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <div key={i} className={`relative p-10 rounded-3xl border flex flex-col ${plan.popular ? 'border-indigo-600 shadow-2xl shadow-indigo-100 scale-105 z-10' : 'border-gray-100 shadow-xl'}`}>
                            {plan.popular && (
                                <div className="absolute top-0 right-10 transform translate-y-[-50%] bg-indigo-600 px-4 py-1 text-white text-xs font-black uppercase rounded-full tracking-widest">
                                    Best Value
                                </div>
                            )}

                            <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-8">
                                <span className="text-5xl font-black text-gray-900">{plan.price}</span>
                                <span className="text-gray-500">/mo</span>
                            </div>

                            <div className="space-y-4 mb-10 flex-1">
                                {plan.features.map((feature, j) => (
                                    <div key={j} className="flex items-center gap-3">
                                        <CheckCircle className={`w-5 h-5 flex-shrink-0 ${plan.popular ? 'text-indigo-600' : 'text-blue-600'}`} />
                                        <span className="text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => navigate('/login')}
                                className={`w-full py-4 px-6 rounded-2xl font-black transition ${plan.popular ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700' : 'bg-gray-900 text-white hover:bg-black'}`}
                            >
                                Choose {plan.name}
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 py-20 px-6 md:px-12 text-white overflow-hidden relative">
                <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[80%] bg-blue-900/20 rounded-full blur-[120px] -z-0"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Zap className="text-white w-5 h-5 fill-white" />
                            </div>
                            <span className="text-xl font-black tracking-tight">SISTEMA POS</span>
                        </div>
                        <p className="text-gray-400 max-w-sm mb-8 leading-relaxed">
                            Transforming the restaurant industry with intelligent software solutions since 2024.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-blue-500">Company</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li className="hover:text-white transition cursor-pointer">About us</li>
                            <li className="hover:text-white transition cursor-pointer">Careers</li>
                            <li className="hover:text-white transition cursor-pointer">Legal</li>
                            <li className="hover:text-white transition cursor-pointer">Privacy</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold mb-6 uppercase text-xs tracking-widest text-blue-500">Support</h4>
                        <ul className="space-y-3 text-gray-400">
                            <li className="hover:text-white transition cursor-pointer">Documentation</li>
                            <li className="hover:text-white transition cursor-pointer">Help Center</li>
                            <li className="hover:text-white transition cursor-pointer">API Status</li>
                            <li className="hover:text-white transition cursor-pointer">Contact</li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto pt-20 mt-20 border-t border-gray-800 text-center text-sm text-gray-500 relative z-10">
                    © {new Date().getFullYear()} Sistema POS SaaS. All rights reserved.
                </div>
            </footer>
        </div>
    );
};
