/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, Flame, ShieldAlert, Sparkles, Check, Send, 
  Package, UtensilsCrossed, Truck, Wrench, AlertTriangle, Play
} from "lucide-react";
import { Category } from "../types";

interface SupplierSOSModalProps {
  categories: Category[];
  onClose: () => void;
  onTriggerAlert: (newRequest: {
    id: string;
    companyName: string;
    categoryName: string;
    categoryId: string;
    itemDescription: string;
    address: string;
    timestamp: string;
  }) => void;
}

const PRESET_SIMULATIONS = [
  {
    icon: Package,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    name: "Embalagens Kraft Express",
    category: "embalagens",
    categoryName: "Embalagens e Descartáveis",
    company: "Burger Prime Pinheiros",
    desc: "Acabaram as sacolas kraft tamanho G para delivery de hoje à noite. Urgência total de fardo!",
    address: "Pinheiros, São Paulo - SP",
  },
  {
    icon: UtensilsCrossed,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    name: "Farinha Especial Trigo 00",
    category: "alimentos",
    categoryName: "Alimentos e Insumos",
    company: "Padaria Central Consolação",
    desc: "Estoque de farinha de trigo especial tipo 00 zerou no meio da fornada. Envio urgente de 5 sacas!",
    address: "Consolação, São Paulo - SP",
  },
  {
    icon: Flame,
    color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
    name: "Substituição Cilindro P45",
    category: "gas_energia",
    categoryName: "Gás e Energia",
    company: "Pizzaria Napoli di Brás",
    desc: "Pressão do cilindro de gás principal caiu à zero bem no pico. Necessitamos de carga GLP urgente!",
    address: "Brás, São Paulo - SP",
  },
  {
    icon: Wrench,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    name: "Manutenção Câmara Fria",
    category: "manutencao",
    categoryName: "Manutenção e Serviços",
    company: "Buffet Jardins Gourmet",
    desc: "Display eletrônico da câmara fria de laticínios piscando erro de refrigeração. Urgência de técnico!",
    address: "Paraíso, São Paulo - SP",
  }
];

export const SupplierSOSModal: React.FC<SupplierSOSModalProps> = ({ 
  categories, 
  onClose,
  onTriggerAlert 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const [customCompany, setCustomCompany] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customAddress, setCustomAddress] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleTriggerPreset = (preset: typeof PRESET_SIMULATIONS[0]) => {
    const newRequest = {
      id: `sos-sim-${Date.now()}`,
      companyName: preset.company,
      categoryName: preset.categoryName,
      categoryId: preset.category,
      itemDescription: preset.desc,
      address: preset.address,
      timestamp: "Previsão 1h • Simulado"
    };

    onTriggerAlert(newRequest);
    setSuccessMsg(`Alerta "${preset.company}" simulado e enviado com sucesso!`);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCompany.trim() || !customDesc.trim() || !customAddress.trim()) return;

    const categoryObj = categories.find(c => c.id === selectedCategory);
    const categoryName = categoryObj ? categoryObj.name : "Geral";

    const newRequest = {
      id: `sos-sim-custom-${Date.now()}`,
      companyName: customCompany.trim(),
      categoryName,
      categoryId: selectedCategory,
      itemDescription: customDesc.trim(),
      address: customAddress.trim(),
      timestamp: "Agora mesmo • Simulado"
    };

    onTriggerAlert(newRequest);
    setSuccessMsg(`Simulação customizada da "${customCompany}" disparada!`);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent blur backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/60 backdrop-blur-md"
      />

      {/* Floating Island iOS drawer */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 40 }}
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 text-white rounded-[36px] overflow-hidden shadow-[0_32px_70px_rgba(0,0,0,0.4)] flex flex-col z-10 p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-5 pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-red/20 text-brand-red flex items-center justify-center border border-brand-red/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold tracking-tight text-white flex items-center gap-1.5 uppercase">
                Painel SOS • Visão do Fornecedor
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">Bypass executivo para disparar simulados e testar matches da rede</p>
            </div>
          </div>

          <button 
            id="close-supplier-sos-btn"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 active:scale-95 flex items-center justify-center text-neutral-300 transition-all cursor-pointer border-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-16 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">Match SOS Disparado!</h4>
              <p className="text-xs text-neutral-300 max-w-[360px]">
                {successMsg} O mapa e a lista de alertas pendentes foram atualizados na sua área de trabalho.
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-brand-red/10 border border-brand-red/15 rounded-2xl text-[11px] text-brand-red font-semibold leading-relaxed">
              💡 <b>Ambiente Dual-Role Ativo:</b> Como fornecedor, este painel especial permite que você dispare ocorrências de emergência rápidas no aplicativo simulando clientes necessitados. Isso ajuda a testar a mecânica de roteamento e envio de propostas expressas pelo WhatsApp comercial!
            </div>

            {/* Quick Presets Grid */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400">Atalhos de Emergências Prontas para Match (1-Clique)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PRESET_SIMULATIONS.map((preset, idx) => {
                  const IconComponent = preset.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleTriggerPreset(preset)}
                      className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800 cursor-pointer text-left transition-all active:scale-[0.98] group flex gap-3.5 items-start"
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${preset.color} transition-all group-hover:scale-105`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-white">{preset.name}</span>
                          <span className="text-[9px] bg-neutral-700/60 text-neutral-300 font-mono px-1.5 py-0.2 rounded">
                            {preset.category === "embalagens" ? "Emba" : preset.category === "alimentos" ? "Alim" : preset.category === "gas_energia" ? "Gás" : "Serv"}
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-400 font-semibold line-clamp-1">Cliente: {preset.company}</p>
                        <p className="text-[10px] text-neutral-500 font-medium line-clamp-2 leading-relaxed">"{preset.desc}"</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom formulation split */}
            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-neutral-800"></div>
              <span className="flex-shrink mx-4 text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Ou Lançar Alerta Totalmente Customizado</span>
              <div className="flex-grow border-t border-neutral-800"></div>
            </div>

            {/* Simulating custom inputs */}
            <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Nome Comercial do Comércio</label>
                  <input
                    type="text"
                    required
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Exemplo: Pizzaria Bella Napoli"
                    className="w-full p-3 bg-neutral-800 rounded-2xl border border-neutral-700/60 focus:border-brand-red outline-none placeholder:text-neutral-500 text-neutral-200 focus:ring-1 focus:ring-brand-red transition-all font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Bairro / Local da Emergência</label>
                  <input
                    type="text"
                    required
                    value={customAddress}
                    onChange={(e) => setCustomAddress(e.target.value)}
                    placeholder="Exemplo: Consolação, São Paulo - SP"
                    className="w-full p-3 bg-neutral-800 rounded-2xl border border-neutral-700/60 focus:border-brand-red outline-none placeholder:text-neutral-500 text-neutral-200 focus:ring-1 focus:ring-brand-red transition-all font-medium"
                  />
                </div>
              </div>

              {/* Categorias field */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Categoria do Insumo ou Serviço</label>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`py-1.5 px-3 rounded-full border text-[10px] font-bold transition-all cursor-pointer ${
                        selectedCategory === cat.id 
                          ? "bg-white text-neutral-900 border-white"
                          : "bg-neutral-800 text-neutral-300 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description Area */}
              <div className="space-y-1.5">
                <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Qual a demanda emergencial do cliente?</label>
                <textarea
                  required
                  rows={2}
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="Descreva a emergência de falta de mercadoria ou defeito de equipamento..."
                  className="w-full p-3 bg-neutral-800 rounded-2xl border border-neutral-700/60 focus:border-brand-red outline-none placeholder:text-neutral-500 text-neutral-200 focus:focus:ring-1 focus:ring-brand-red transition-all font-medium leading-relaxed"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-brand-red hover:bg-brand-red/90 border-none rounded-full font-bold text-xs flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-brand-red/10 cursor-pointer uppercase tracking-wider"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Gerar Chamado SOS Simulador</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
