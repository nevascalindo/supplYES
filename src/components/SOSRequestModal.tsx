/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { X, Flame, ShieldAlert, Sparkles, Check, Send, AlertTriangle } from "lucide-react";
import { Category } from "../types";

interface SOSRequestModalProps {
  categories: Category[];
  onClose: () => void;
  onSOSSubmit: (categoryName: string, itemDescription: string) => void;
}

export const SOSRequestModal: React.FC<SOSRequestModalProps> = ({ 
  categories, 
  onClose,
  onSOSSubmit 
}) => {
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || "");
  const [itemDescription, setItemDescription] = useState("");
  const [address, setAddress] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemDescription.trim()) return;

    // Call callback to trigger filters and prioritize matching suppliers
    onSOSSubmit(selectedCategory, itemDescription);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent blur backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-neutral-950/55 backdrop-blur-md"
      />

      {/* Floating Island iOS drawer */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 40 }}
        className="relative w-full max-w-lg bg-neutral-900 border border-neutral-800 text-white rounded-[36px] overflow-hidden shadow-[0_32px_70px_rgba(0,0,0,0.4)] flex flex-col z-10 p-6 sm:p-8"
      >
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-red/20 text-brand-red flex items-center justify-center border border-brand-red/30">
              <Flame className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                SOS Conexão Rápida
              </h3>
              <p className="text-[11px] text-neutral-400 font-medium">Buscando fornecedores com estoque imediato</p>
            </div>
          </div>

          <button 
            id="close-sos-btn"
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
            className="py-12 flex flex-col items-center justify-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Check className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-base font-bold text-white">Canal Alinhado com Sucesso!</h4>
              <p className="text-xs text-neutral-300 max-w-[280px]">
                Ligamos o modo SOS e filtramos os parceiros que resolvem <b>{categories.find(c => c.id === selectedCategory)?.name}</b> imediatamente!
              </p>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Disclaimer */}
            <div className="p-3.5 bg-brand-red/10 border border-brand-red/20 rounded-2xl text-[11px] text-brand-red flex items-start gap-2.5 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-brand-red" />
              <span>Use este recurso apenas se você precisa que o item saia para entrega no mesmo dia em menos de 1-2 horas devido a uma emergência técnica ou desabastecimento brusco.</span>
            </div>

            {/* Categorias field */}
            <div className="space-y-2">
              <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">O que está em falta em seu estabelecimento?</label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between h-20 ${
                      selectedCategory === cat.id 
                        ? "bg-white text-neutral-900 border-white font-semibold"
                        : "bg-neutral-800/50 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800"
                    }`}
                  >
                    <span className="text-[10px] opacity-70">Necessidade</span>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Descreva o item ou conserto específico com urgência</label>
              <textarea
                required
                rows={2}
                value={itemDescription}
                onChange={(e) => setItemDescription(e.target.value)}
                placeholder="Exemplo: Preciso de 4 fardos de sacola de papel para hambúrguer e 100 copos descartáveis de chopp. Acabou no meio do expediente!"
                className="w-full p-3 bg-neutral-800 rounded-2xl border border-neutral-700/60 focus:border-brand-red outline-none placeholder:text-neutral-500 text-neutral-200 focus:ring-1 focus:ring-brand-red transition-all font-medium leading-relaxed"
              />
            </div>

            {/* Address Input */}
            <div className="space-y-1.5">
              <label className="font-bold text-neutral-300 tracking-wide uppercase text-[10px]">Bairro / Local da Emergência para match frete</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Exemplo: Pinheiros, São Paulo - SP"
                className="w-full p-3 bg-neutral-800 rounded-2xl border border-neutral-700/60 focus:border-brand-red outline-none placeholder:text-neutral-500 text-neutral-200 focus:ring-1 focus:ring-brand-red transition-all font-medium"
              />
            </div>

            {/* Actions */}
            <button
              type="submit"
              className="w-full py-3.5 bg-brand-red hover:bg-brand-red/90 border-none rounded-full font-bold text-xs flex items-center justify-center gap-2 text-white active:scale-95 transition-all shadow-lg shadow-brand-red/10 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>RODAR CONEXÃO DE URGÊNCIA</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};
